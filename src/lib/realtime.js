import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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

const currentUserOrThrow = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return user;
};

export function watchPresence(uid, callback, onError) {
  return onSnapshot(doc(db, "users", uid), (snap) => callback(snap.exists() ? { uid, ...snap.data() } : null), onError);
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

export async function createFirestoreRoom({ name, focusDuration, breakDuration, hostUid, hostName, roomCode, isPrivate = false, allowVoiceDuringFocus = true, allowChatDuringFocus = true }) {
  const docRef = await addDoc(collection(db, "pomodoro_rooms"), {
    roomName: name,
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
  });
  return docRef.id;
}

export async function joinRoomByCode(code) {
  const q = query(collection(db, "pomodoro_rooms"), where("roomCode", "==", code.toUpperCase().trim()));
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

export async function endRoom(roomId) {
  await updateDoc(doc(db, "pomodoro_rooms", roomId), { isEnded: true, phase: "idle", isRunning: false, phaseEndsAt: null });
}

export async function updateMutedState(roomId, isMuted) {
  const user = currentUserOrThrow();
  await updateDoc(doc(db, "pomodoro_rooms", roomId, "members", user.uid), { isMuted });
}

export function watchPublicRooms(callback, onError) {
  const roomsQuery = query(collection(db, "pomodoro_rooms"), where("isPrivate", "==", false), orderBy("createdAt", "desc"));
  return onSnapshot(roomsQuery, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

export function watchRoom(roomId, callback, onError) {
  return onSnapshot(doc(db, "pomodoro_rooms", roomId), (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null), onError);
}

export function watchRoomMembers(roomId, callback, onError) {
  return onSnapshot(collection(db, "pomodoro_rooms", roomId, "members"), (snap) => callback(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))), onError);
}

export function watchRoomMessages(roomId, callback, onError) {
  const messagesQuery = query(collection(db, "pomodoro_rooms", roomId, "messages"), orderBy("sentAt", "desc"), limit(50));
  return onSnapshot(messagesQuery, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

export function watchSharedFiles(roomId, callback, onError) {
  const filesQuery = query(collection(db, "pomodoro_rooms", roomId, "files"), orderBy("uploadedAt", "desc"));
  return onSnapshot(filesQuery, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

export async function joinRoom(roomId) {
  const user = currentUserOrThrow();
  const roomRef = doc(db, "pomodoro_rooms", roomId);
  const memberRef = doc(db, "pomodoro_rooms", roomId, "members", user.uid);
  await runTransaction(db, async (tx) => {
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists()) throw new Error("Room not found");
    tx.set(memberRef, {
      displayName: user.displayName || user.email?.split("@")[0],
      joinedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      isMuted: false,
      status: "active",
    });
    tx.update(roomRef, { memberCount: increment(1) });
  });
}

export async function leaveRoom(roomId) {
  const user = currentUserOrThrow();
  await deleteDoc(doc(db, "pomodoro_rooms", roomId, "members", user.uid));
  await updateDoc(doc(db, "pomodoro_rooms", roomId), { memberCount: increment(-1) });
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
  const type = file.type?.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : "document";
  return { url, type, name: file.name, size: file.size };
}

export async function uploadUserAvatar(file) {
  const user = currentUserOrThrow();
  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
  const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${safeName}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

export async function uploadRoomFile(roomId, file) {
  const user = currentUserOrThrow();
  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
  const storageRef = ref(storage, `rooms/${roomId}/${Date.now()}_${safeName}`);
  await uploadBytes(storageRef, file);
  const fileUrl = await getDownloadURL(storageRef);
  const fileType = file.type?.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : "document";
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
  await updateDoc(doc(db, "pomodoro_rooms", roomId, "members", user.uid), { agoraUid });
}

export async function deleteRoomFile(roomId, fileId, fileUrl) {
  await deleteDoc(doc(db, "pomodoro_rooms", roomId, "files", fileId));
  try {
    await deleteObject(ref(storage, fileUrl));
  } catch {
    // The Firestore record is the source of truth for UI; ignore stale storage URLs.
  }
}
