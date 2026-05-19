import { create } from "zustand";

export const useUI = create((set) => ({
  aiOpen: false,
  aiContext: null,
  activeSpaceId: null,
  toggleAI: (ctx) => set((s) => ({ aiOpen: !s.aiOpen, aiContext: ctx ?? s.aiContext })),
  openAI: (ctx) => set({ aiOpen: true, aiContext: ctx }),
  closeAI: () => set({ aiOpen: false }),
  setActiveSpace: (id) => set({ activeSpaceId: id }),
}));
