import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const fallbackConfig = {
  apiKey: "AIzaSyBvx6WQRcnfJEQF1munAA4FpXlZ1zAoYLY",
  authDomain: "student-tracker-firebase.firebaseapp.com",
  projectId: "student-tracker-firebase",
  storageBucket: "student-tracker-firebase.firebasestorage.app",
  messagingSenderId: "704047060628",
  appId: "1:704047060628:web:c1746157240bf6e2e0c681",
  measurementId: "G-KBLLJ6CECZ",
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || fallbackConfig.measurementId,
};

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: "select_account" });
