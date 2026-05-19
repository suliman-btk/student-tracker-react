import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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

export async function deleteRoomFile(roomId, fileId, fileUrl) {
  await deleteDoc(doc(db, "pomodoro_rooms", roomId, "files", fileId));
  try {
    await deleteObject(ref(storage, fileUrl));
  } catch {
    // The Firestore record is the source of truth for UI; ignore stale storage URLs.
  }
}
