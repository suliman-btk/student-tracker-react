import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes, deleteObject } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";

export const ROOM_HOST_STALE_MS = 90 * 1000;

function timestampToMillis(value) {
  if (!value) return null;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  return null;
}

export function isRoomHostStale(room) {
  if (!room || room.isEnded === true) return false;
  const hostLastSeen = timestampToMillis(room.hostLastSeen) ?? timestampToMillis(room.createdAt);
  return hostLastSeen != null && Date.now() - hostLastSeen > ROOM_HOST_STALE_MS;
}

const currentUserOrThrow = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return user;
};

export function watchPresence(uid, callback, onError) {
  return onSnapshot(
    doc(db, "users", uid),
    (snap) => callback(snap.exists() ? { uid, ...snap.data() } : null),
    onError,
  );
}

export async function setPresence(status, visible = true) {
  const user = currentUserOrThrow();
  await setDoc(
    doc(db, "users", user.uid),
    {
      studyStatus: status,
      statusVisible: visible,
      lastActive: serverTimestamp(),
      displayName: user.displayName || user.email?.split("@")[0] || "",
      avatarUrl: user.photoURL || null,
    },
    { merge: true },
  );
}

export async function createFirestoreRoom({
  name,
  subjectTag,
  focusDuration,
  breakDuration,
  hostUid,
  hostName,
  roomCode,
  isPrivate = false,
  allowVoiceDuringFocus = true,
  allowChatDuringFocus = true,
}) {
  const docRef = await addDoc(collection(db, "pomodoro_rooms"), {
    roomName: name,
    subjectTag: subjectTag || null,
    focusDuration,
    breakDuration,
    hostUid,
    hostName,
    roomCode,
    isPrivate,
    allowVoiceDuringFocus,
    allowChatDuringFocus,
    phase: "idle",
    isRunning: false,
    isEnded: false,
    roundsCompleted: 0,
    memberCount: 0,
    phaseEndsAt: null,
    remainingSeconds: 0,
    createdAt: serverTimestamp(),
    hostLastSeen: serverTimestamp(),
  });
  return docRef.id;
}

export async function joinRoomByCode(code) {
  const q = query(
    collection(db, "pomodoro_rooms"),
    where("roomCode", "==", code.toUpperCase().trim()),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id;
}

export async function updateRoomPhase(roomId, phase, durationMinutes) {
  const data = { phase, isRunning: phase !== "idle" };
  if (phase !== "idle" && durationMinutes) {
    const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    data.phaseEndsAt = endsAt;
    data.remainingSeconds = durationMinutes * 60;
  } else {
    data.phaseEndsAt = null;
    data.remainingSeconds = 0;
  }
  if (phase === "focus") data.roundsCompleted = increment(0);
  await updateDoc(doc(db, "pomodoro_rooms", roomId), data);
}

export async function incrementRound(roomId) {
  await updateDoc(doc(db, "pomodoro_rooms", roomId), { roundsCompleted: increment(1) });
}

// Reconcile a drifted memberCount to the real member total. The host calls this
// while present so a stored count corrupted by earlier join/leave bugs heals to
// the actual number of people in the room.
export async function setRoomMemberCount(roomId, count) {
  await updateDoc(doc(db, "pomodoro_rooms", roomId), { memberCount: Math.max(0, count) });
}

export async function endRoom(roomId) {
  await updateDoc(doc(db, "pomodoro_rooms", roomId), {
    isEnded: true,
    phase: "idle",
    isRunning: false,
    phaseEndsAt: null,
    memberCount: 0,
  });
}

export async function endStaleRoomIfNeeded(roomId) {
  const roomRef = doc(db, "pomodoro_rooms", roomId);
  return runTransaction(db, async (tx) => {
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists()) return false;
    const data = roomSnap.data();
    if (data.isEnded === true) return false;
    const lastSeen = timestampToMillis(data.hostLastSeen) ?? timestampToMillis(data.createdAt);
    if (lastSeen == null || Date.now() - lastSeen <= ROOM_HOST_STALE_MS) return false;
    tx.update(roomRef, {
      isEnded: true,
      phase: "idle",
      isRunning: false,
      phaseEndsAt: null,
      memberCount: 0,
    });
    return true;
  });
}

export async function updateMutedState(roomId, isMuted) {
  const user = currentUserOrThrow();
  await updateDoc(doc(db, "pomodoro_rooms", roomId, "members", user.uid), { isMuted });
}

export function watchPublicRooms(callback, onError) {
  // Only the single `isPrivate == false` equality filter runs server-side —
  // that needs no composite index. Combining it with `isEnded == false` AND a
  // `createdAt >` range would require a composite index (and breaks the query
  // entirely if that index is missing), so we apply those filters in memory.
  const cutoffSeconds = (Date.now() - 24 * 60 * 60 * 1000) / 1000;
  const roomsQuery = query(collection(db, "pomodoro_rooms"), where("isPrivate", "==", false));
  let latestDocs = [];
  const emit = () => {
    const rooms = latestDocs
      .map((d) => ({ id: d.id, ...d.data() }))
      // Exclude ended (ghost) rooms, rooms older than 24h, and empty/abandoned
      // (or count-corrupted) rooms — none of those are joinable "active" sessions.
      .filter((r) => {
        const stale = isRoomHostStale(r);
        if (stale) endStaleRoomIfNeeded(r.id).catch(() => {});
        return (
          r.isEnded !== true &&
          !stale &&
          (r.memberCount ?? 0) > 0 &&
          (r.createdAt?.seconds ?? 0) > cutoffSeconds
        );
      })
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    callback(rooms);
  };
  const unsubscribe = onSnapshot(
    roomsQuery,
    (snap) => {
      latestDocs = snap.docs;
      emit();
    },
    onError,
  );
  const timer = window.setInterval(emit, 15000);
  return () => {
    window.clearInterval(timer);
    unsubscribe();
  };
}

export function watchRoom(roomId, callback, onError) {
  return onSnapshot(
    doc(db, "pomodoro_rooms", roomId),
    (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    onError,
  );
}

export function watchRoomMembers(roomId, callback, onError) {
  return onSnapshot(
    collection(db, "pomodoro_rooms", roomId, "members"),
    (snap) => callback(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))),
    onError,
  );
}

export function watchRoomMessages(roomId, callback, onError) {
  const messagesQuery = query(
    collection(db, "pomodoro_rooms", roomId, "messages"),
    orderBy("sentAt", "desc"),
    limit(50),
  );
  return onSnapshot(
    messagesQuery,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  );
}

export function watchSharedFiles(roomId, callback, onError) {
  const filesQuery = query(
    collection(db, "pomodoro_rooms", roomId, "files"),
    orderBy("uploadedAt", "desc"),
  );
  return onSnapshot(
    filesQuery,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  );
}

export async function joinRoom(roomId, code) {
  const user = currentUserOrThrow();
  const roomRef = doc(db, "pomodoro_rooms", roomId);
  const memberRef = doc(db, "pomodoro_rooms", roomId, "members", user.uid);
  await runTransaction(db, async (tx) => {
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists()) throw new Error("Room not found");
    const data = roomSnap.data();
    if (data.isEnded === true) throw new Error("Room session already ended");
    if ((data.banned || []).includes(user.uid)) {
      const err = new Error("You were removed from this room by the host");
      err.code = "room/banned";
      throw err;
    }
    // Only count a join once — re-joining an existing membership must not
    // inflate memberCount (the leave path decrements only once).
    const alreadyMember = (await tx.get(memberRef)).exists();
    // Private rooms are code-gated: only the host, existing members, or
    // someone presenting the correct room code may join.
    if (data.isPrivate === true && data.hostUid !== user.uid && !alreadyMember) {
      const provided = (code || "").trim().toUpperCase();
      if (!provided || provided !== data.roomCode) {
        const err = new Error("This room is private — join it with its room code");
        err.code = "room/private";
        throw err;
      }
    }
    // merge: joinRoom races with Agora's onJoined (which writes agoraUid to
    // this same doc) — a plain set() would wipe the agoraUid and other
    // members would never get speaking waves drawn for this user.
    tx.set(
      memberRef,
      {
        displayName: user.displayName || user.email?.split("@")[0],
        joinedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        isMuted: false,
        status: "active",
      },
      { merge: true },
    );
    if (!alreadyMember) tx.update(roomRef, { memberCount: increment(1) });
  });
}

export async function updateRoomPresence(roomId) {
  const user = currentUserOrThrow();
  const roomRef = doc(db, "pomodoro_rooms", roomId);
  const memberRef = doc(db, "pomodoro_rooms", roomId, "members", user.uid);
  await runTransaction(db, async (tx) => {
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists()) return;
    const data = roomSnap.data();
    tx.set(memberRef, { lastSeen: serverTimestamp() }, { merge: true });
    if (data.hostUid === user.uid) {
      tx.update(roomRef, { hostLastSeen: serverTimestamp() });
    }
  });
}

export async function leaveRoom(roomId) {
  const user = currentUserOrThrow();
  const memberRef = doc(db, "pomodoro_rooms", roomId, "members", user.uid);
  const snap = await getDoc(memberRef).catch(() => null);
  if (!snap?.exists()) return; // already left — don't double-decrement
  await deleteDoc(memberRef);
  const roomRef = doc(db, "pomodoro_rooms", roomId);
  const roomSnap = await getDoc(roomRef).catch(() => null);
  if (roomSnap?.exists()) {
    const current = roomSnap.data().memberCount ?? 0;
    await updateDoc(roomRef, { memberCount: Math.max(0, current - 1) });
  }
}

// Host-only: remove a member and permanently ban them. The banned UID lives on
// the room doc, so joinRoom refuses it and the kicked client's room snapshot
// sees itself banned and bounces out.
export async function kickMember(roomId, uid) {
  const roomRef = doc(db, "pomodoro_rooms", roomId);
  const memberRef = doc(db, "pomodoro_rooms", roomId, "members", uid);
  await runTransaction(db, async (tx) => {
    const memberSnap = await tx.get(memberRef);
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists()) throw new Error("Room not found");
    const current = roomSnap.data().memberCount ?? 0;
    const update = { banned: arrayUnion(uid) };
    if (memberSnap.exists()) update.memberCount = Math.max(0, current - 1);
    tx.update(roomRef, update);
    if (memberSnap.exists()) tx.delete(memberRef);
  });
}

export async function sendRoomMessage(roomId, text) {
  const user = currentUserOrThrow();
  await addDoc(collection(db, "pomodoro_rooms", roomId, "messages"), {
    senderUid: user.uid,
    senderName: user.displayName || user.email?.split("@")[0],
    text,
    sentAt: serverTimestamp(),
  });
}

export async function uploadPostAttachment(file) {
  const user = currentUserOrThrow();
  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
  const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${safeName}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  const type = file.type?.startsWith("image/")
    ? "image"
    : file.type === "application/pdf"
      ? "pdf"
      : "document";
  return { url, type, name: file.name, size: file.size };
}

export async function uploadUserAvatar(file) {
  const user = currentUserOrThrow();
  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
  const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${safeName}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

export async function uploadUserBanner(file) {
  const user = currentUserOrThrow();
  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
  // Upload under the already-permitted `avatars/{uid}` prefix. The dedicated
  // `banners/` path is blocked by Storage rules, which fails the cover upload;
  // reusing the user's avatar prefix keeps it within the allowed rule.
  const storageRef = ref(storage, `avatars/${user.uid}/banner_${Date.now()}_${safeName}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

export async function uploadRoomFile(roomId, file) {
  const user = currentUserOrThrow();
  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
  const storageRef = ref(storage, `rooms/${roomId}/${Date.now()}_${safeName}`);
  await uploadBytes(storageRef, file);
  const fileUrl = await getDownloadURL(storageRef);
  const fileType = file.type?.startsWith("image/")
    ? "image"
    : file.type === "application/pdf"
      ? "pdf"
      : "document";
  const docRef = await addDoc(collection(db, "pomodoro_rooms", roomId, "files"), {
    uploaderUid: user.uid,
    uploaderName: user.displayName || user.email?.split("@")[0],
    fileName: file.name,
    fileUrl,
    uploadedAt: serverTimestamp(),
    fileType,
  });
  await sendRoomMessage(roomId, `[FILE]${file.name}|${fileUrl}|${fileType}`);
  return { id: docRef.id, fileName: file.name, fileUrl, fileType };
}

export async function updateAgoraUid(roomId, agoraUid) {
  const user = currentUserOrThrow();
  // set+merge, not updateDoc: Agora can join before the joinRoom transaction
  // creates the member doc, and updateDoc on a missing doc throws — silently
  // dropping the agoraUid mapping (no speaking waves for this user).
  await setDoc(
    doc(db, "pomodoro_rooms", roomId, "members", user.uid),
    { agoraUid },
    { merge: true },
  );
}

export async function deleteRoomFile(roomId, fileId, fileUrl) {
  await deleteDoc(doc(db, "pomodoro_rooms", roomId, "files", fileId));
  try {
    await deleteObject(ref(storage, fileUrl));
  } catch {
    // The Firestore record is the source of truth for UI; ignore stale storage URLs.
  }
}
