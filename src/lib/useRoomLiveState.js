import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { watchRoom, watchRoomMembers, watchRoomMessages } from "@/lib/realtime";

/**
 * Merges the three Firestore room subscriptions (room doc, members subcollection,
 * messages subcollection) into one stable snapshot. Consumers never wire up
 * watchers directly or derive room-level booleans inline.
 *
 * Returns:
 *   room          — raw Firestore room document (null while loading)
 *   members       — array of member objects
 *   messages      — array of message objects, chronological (oldest first)
 *   loading       — true until the first room snapshot arrives
 *   phase         — "idle" | "focus" | "breakTime"
 *   isHost        — current user is the room host
 *   isJoined      — current user appears in the members subcollection
 *   allowVoice    — voice is permitted in focus phase
 *   allowChat     — chat is permitted in focus phase
 *   voiceLocked   — voice is currently blocked (allowVoice=false AND phase=focus)
 *   chatLocked    — chat is currently blocked (allowChat=false AND phase=focus)
 *   ended         — host has ended the session
 */
export function useRoomLiveState(roomId) {
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUid, setCurrentUid] = useState(auth.currentUser?.uid ?? null);

  // Firebase Auth resolves asynchronously after a hard reload — keep uid reactive
  // so isHost/isJoined recompute once the user is known.
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => setCurrentUid(user?.uid ?? null));
  }, []);

  useEffect(() => {
    if (!roomId) return;
    setLoading(true);

    const u1 = watchRoom(roomId, (data) => { setRoom(data); setLoading(false); }, console.error);
    const u2 = watchRoomMembers(roomId, setMembers, console.error);
    const u3 = watchRoomMessages(roomId, (msgs) => setMessages([...msgs].reverse()), console.error);

    return () => { u1(); u2(); u3(); };
  }, [roomId]);

  const phase       = room?.phase ?? "idle";
  const isHost      = Boolean(room && currentUid && room.hostUid === currentUid);
  const isJoined    = members.some((m) => m.uid === currentUid);
  const allowVoice  = room?.allowVoiceDuringFocus !== false;
  const allowChat   = room?.allowChatDuringFocus !== false;
  const voiceLocked = !allowVoice && phase === "focus";
  const chatLocked  = !allowChat  && phase === "focus";
  const ended       = room?.isEnded === true;

  return { room, members, messages, loading, phase, isHost, isJoined, allowVoice, allowChat, voiceLocked, chatLocked, ended };
}
