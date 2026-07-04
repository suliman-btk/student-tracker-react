import AgoraRTC from "agora-rtc-sdk-ng";
import { focusApi } from "@/lib/api";

export const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID;

export async function createAgoraRoomClient({ roomId, uid, useServerToken = true, onUserJoined, onUserLeft, onVolume }) {
  const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  let token = null;

  if (useServerToken) {
    try {
      const payload = await focusApi.rooms.agoraToken({ channel: roomId, uid: uid || 0 });
      token = payload?.token || null;
    } catch {
      token = null;
    }
  }

  client.on("user-published", async (user, mediaType) => {
    await client.subscribe(user, mediaType);
    if (mediaType === "audio") user.audioTrack?.play();
    onUserJoined?.(user);
  });
  client.on("user-unpublished", (user) => onUserLeft?.(user));
  client.on("volume-indicator", (volumes) => onVolume?.(volumes));

  let joinedUid;
  try {
    joinedUid = await client.join(AGORA_APP_ID, String(roomId), token, uid || null);
    await client.publish([localAudioTrack]);
    // Must be enabled AFTER join + publish — the SDK needs an active channel to
    // attach the volume-reporting interval to, otherwise volume-indicator never fires.
    client.enableAudioVolumeIndicator();
    await localAudioTrack.setMuted(true);
  } catch (err) {
    // The mic track was already created above; without this cleanup a failed
    // join leaves the microphone captured (browser recording indicator on).
    try { localAudioTrack.stop(); } catch {}
    try { localAudioTrack.close(); } catch {}
    try { client.removeAllListeners(); } catch {}
    try { await client.leave(); } catch {}
    throw err;
  }

  return {
    client,
    uid: joinedUid,
    localAudioTrack,
    mute: (muted) => localAudioTrack.setMuted(muted),
    leave: async () => {
      try { localAudioTrack.stop(); } catch {}
      try { localAudioTrack.close(); } catch {}
      try { await client.leave(); } catch {}
      try { client.removeAllListeners(); } catch {}
    },
  };
}
