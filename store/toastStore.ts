"use client";

import { create } from "zustand";
import type { ToastMessage } from "@/types";
import { uid } from "@/lib/utils";

interface ToastState {
  toasts: ToastMessage[];
  push: (text: string, durationMs?: number) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  push: (text, durationMs = 1000) => {
    const id = uid();
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, durationMs }] }));
    if (durationMs > 0 && typeof window !== "undefined") {
      window.setTimeout(() => get().dismiss(id), durationMs);
    }
    return id;
  },

  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
