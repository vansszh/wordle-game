"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ThemePreference } from "@/types";

export interface SettingsState {
  theme: ThemePreference;
  highContrast: boolean;
  hardMode: boolean;
  setTheme: (t: ThemePreference) => void;
  setHighContrast: (v: boolean) => void;
  setHardMode: (v: boolean) => void;
}

const STORAGE_KEY = "wordle-settings";

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
      name: STORAGE_KEY,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          // SSR safety — provide a no-op shim.
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
      version: 1,
    },
  ),
);
