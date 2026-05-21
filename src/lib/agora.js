import AgoraRTC from "agora-rtc-sdk-ng";
import { focusApi } from "@/lib/api";

export const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || "df3f0dced8aa45848a067feb0661daeb";

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
  client.enableAudioVolumeIndicator();

  const joinedUid = await client.join(AGORA_APP_ID, String(roomId), token, uid || null);
  await client.publish([localAudioTrack]);
  await localAudioTrack.setMuted(true);

  return {
    client,
    uid: joinedUid,
    localAudioTrack,
    mute: (muted) => localAudioTrack.setMuted(muted),
    leave: async () => {
      try { localAudioTrack.stop(); } catch {}
      try { localAudioTrack.close(); } catch {}
      try { await client.leave(); } catch {}
    },
  };
}
