import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUI = create(
  persist(
    (set) => ({
      aiOpen: false,
      aiContext: null,
      activeSpaceId: null,
      toggleAI: (ctx) => set((s) => ({ aiOpen: !s.aiOpen, aiContext: ctx ?? s.aiContext })),
      openAI: (ctx) => set({ aiOpen: true, aiContext: ctx }),
      closeAI: () => set({ aiOpen: false }),
      setActiveSpace: (id) => set({ activeSpaceId: id }),
    }),
    {
      name: "raqip-ui",
      partialize: (s) => ({ activeSpaceId: s.activeSpaceId }),
    }
  )
);
