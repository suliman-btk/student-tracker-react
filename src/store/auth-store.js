import { create } from "zustand";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { userApi } from "@/lib/api";

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  error: null,
  setProfile: (profile) => set({ profile }),
  clearError: () => set({ error: null }),
  refreshProfile: async () => {
    const profile = await userApi.profile();
    set({ profile });
    return profile;
  },
  syncProfile: async (extra = {}) => {
    const user = get().user || auth.currentUser;
    if (!user) return null;
    const profile = await userApi.sync({
      name: extra.name ?? user.displayName ?? user.email?.split("@")[0],
      avatar_url: extra.avatarUrl ?? user.photoURL,
      fcm_token: extra.fcmToken,
    });
    set({ profile });
    return profile;
  },
  loginEmail: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      set({ user: cred.user });
      await get().syncProfile();
      return cred.user;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  registerEmail: async ({ name, email, password }) => {
    set({ loading: true, error: null });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(cred.user, { displayName: name });
      set({ user: cred.user });
      await get().syncProfile({ name });
      return cred.user;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  loginGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      set({ user: cred.user });
      await get().syncProfile();
      return cred.user;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
    await signOut(auth);
    set({ user: null, profile: null, loading: false });
  },
}));

let unsubscribeAuth = null;

export function startAuthListener() {
  if (unsubscribeAuth || typeof window === "undefined") return unsubscribeAuth;
  unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    useAuthStore.setState({ user, loading: true, initialized: true, error: null });
    if (!user) {
      useAuthStore.setState({ profile: null, loading: false });
      return;
    }
    try {
      await useAuthStore.getState().syncProfile();
    } catch {
      try {
        await useAuthStore.getState().refreshProfile();
      } catch {
        // Keep Firebase auth alive even if Laravel profile sync is temporarily unavailable.
      }
    } finally {
      useAuthStore.setState({ loading: false });
    }
  });
  return unsubscribeAuth;
}

export async function getFreshIdToken(forceRefresh = false) {
  const user = auth.currentUser || useAuthStore.getState().user;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}
