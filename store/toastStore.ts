"use client";

import { create } from "zustand";
import type { ToastMessage } from "@/types";
import { uid } from "@/lib/utils";

const MAX_TOASTS = 3;

interface ToastState {
  toasts: ToastMessage[];
  push: (text: string, durationMs?: number) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  push: (text, durationMs = 1000) => {
    const id = uid();
    const next: ToastMessage = { id, text, durationMs };
    set((s) => ({
      toasts: [...s.toasts.slice(-(MAX_TOASTS - 1)), next],
    }));
    if (durationMs > 0) {
      if (typeof window !== "undefined") {
        window.setTimeout(() => get().dismiss(id), durationMs);
      }
    }
    return id;
  },

  dismiss: (id) =>
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== id),
    })),

  clear: () => set({ toasts: [] }),
}));
