/* global firebase, importScripts */
// Firebase Cloud Messaging service worker.
// Served verbatim from public/ (not processed by Vite), so it uses the
// compat CDN builds and a hardcoded copy of the public Firebase config —
// keep these values in sync with fallbackConfig in src/lib/firebase.js.
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBvx6WQRcnfJEQF1munAA4FpXlZ1zAoYLY",
  authDomain: "student-tracker-firebase.firebaseapp.com",
  projectId: "student-tracker-firebase",
  storageBucket: "student-tracker-firebase.firebasestorage.app",
  messagingSenderId: "704047060628",
  appId: "1:704047060628:web:c1746157240bf6e2e0c681",
});

// The server always sends message.notification plus webpush.fcm_options.link,
// so the SDK displays background notifications and opens the right page on
// click — no custom onBackgroundMessage/notificationclick handlers needed.
firebase.messaging();
