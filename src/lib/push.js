import { userApi } from "./api";

// Web push (FCM). All firebase/messaging imports are dynamic because the
// app SSRs on Cloudflare Workers and getMessaging touches window.

const ENABLED_KEY = "raqip:push-enabled";
const PROMPT_DISMISSED_KEY = "raqip:push-prompt-dismissed";

/** Route to open when a notification of the given type is clicked. */
export function routeForNotification(type, data = {}) {
  switch (type) {
    case "post_reaction":
      return "/social";
    case "event_reminder":
      return "/calendar";
    case "deadline":
      return data.task_id ? `/tasks/${data.task_id}` : "/backlog";
    case "sprint_end":
      return data.sprint_id ? `/sprints/${data.sprint_id}` : "/sprints";
    case "friend_request":
    case "friend_accepted":
    case "standup_reminder":
    default:
      return "/notifications";
  }
}

export async function pushSupported() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  try {
    const { isSupported } = await import("firebase/messaging");
    return await isSupported();
  } catch {
    return false;
  }
}

export function pushPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export function pushEnabled() {
  return typeof window !== "undefined" && localStorage.getItem(ENABLED_KEY) === "1" && pushPermission() === "granted";
}

export function promptDismissed() {
  return typeof window !== "undefined" && localStorage.getItem(PROMPT_DISMISSED_KEY) === "1";
}

export function dismissPrompt() {
  localStorage.setItem(PROMPT_DISMISSED_KEY, "1");
}

async function acquireAndRegisterToken() {
  const { getMessaging, getToken } = await import("firebase/messaging");
  const { firebaseApp } = await import("./firebase");
  const vapidKey = String(import.meta.env.VITE_FIREBASE_VAPID_KEY || "").replace(/\s+/g, "");
  if (!vapidKey) {
    throw new Error("Missing VITE_FIREBASE_VAPID_KEY in the web build environment.");
  }
  validateVapidKey(vapidKey);

  await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const registration = await navigator.serviceWorker.ready;
  let token;
  try {
    token = await getToken(getMessaging(firebaseApp), {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
  } catch (error) {
    if (
      error?.name === "AbortError" ||
      /push service error|registration failed/i.test(error?.message || "")
    ) {
      throw new Error(
        "Browser push registration failed. In Brave/Chromium, enable Google push messaging/site notifications or try Chrome, then reload RAQIP.",
      );
    }
    throw error;
  }
  if (!token) throw new Error("No registration token received");
  await userApi.updateFcmToken(token, "web");
  return token;
}

function validateVapidKey(vapidKey) {
  try {
    const padding = "=".repeat((4 - (vapidKey.length % 4)) % 4);
    const base64 = `${vapidKey}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    if (bytes.length !== 65 || bytes[0] !== 4) {
      throw new Error();
    }
  } catch {
    throw new Error(
      `Invalid VITE_FIREBASE_VAPID_KEY. Current length: ${vapidKey.length}. Copy the full Web Push certificates public key from Firebase; it should be one complete 87-character key.`,
    );
  }
}

/**
 * Request permission and register this browser for push.
 * Returns "granted" | "denied" | "default".
 */
export async function enablePush() {
  if (!(await pushSupported())) {
    throw new Error("This browser does not support web push notifications.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;
  await acquireAndRegisterToken();
  localStorage.setItem(ENABLED_KEY, "1");
  return permission;
}

export function disablePush() {
  // Browsers offer no permission revocation from JS; stop the foreground
  // handler and let the server prune the token when it goes stale.
  localStorage.removeItem(ENABLED_KEY);
}

/**
 * Call once per app load when the user is logged in. Refreshes the token
 * (handles FCM token rotation) and wires foreground messages to the given
 * callback. Returns an unsubscribe function.
 */
export async function initPushIfGranted(onForegroundMessage) {
  if (!pushEnabled() || !(await pushSupported())) return () => {};

  try {
    await acquireAndRegisterToken();
  } catch (e) {
    console.warn("Push token refresh failed", e);
  }

  const { getMessaging, onMessage } = await import("firebase/messaging");
  const { firebaseApp } = await import("./firebase");
  return onMessage(getMessaging(firebaseApp), (payload) => {
    const title = payload.notification?.title || "RAQIP";
    const body = payload.notification?.body || "";
    const data = payload.data || {};
    onForegroundMessage?.({ title, body, type: data.type, data });
  });
}
