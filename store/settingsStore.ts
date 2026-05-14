"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ThemePreference } from "@/types";

interface SettingsState {
  theme: ThemePreference;
  highContrast: boolean;
  hardMode: boolean;
  setTheme: (t: ThemePreference) => void;
  setHighContrast: (v: boolean) => void;
  setHardMode: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      highContrast: false,
      hardMode: false,
      setTheme: (theme) => set({ theme }),
      setHighContrast: (highContrast) => set({ highContrast }),
      setHardMode: (hardMode) => set({ hardMode }),
    }),
    {
      name: "wordle-settings",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
          : window.localStorage
      ),
      version: 1,
    },
  ),
);
