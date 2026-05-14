"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CurrentGameState, PlayerStats, RowEvaluation } from "@/types";
import {
  createEmptyGame,
  pressBackspace as engineBackspace,
  pressLetter as engineLetter,
  submitGuess as engineSubmit,
  type SubmitError,
} from "@/lib/game/engine";
import { dayOffsetForDate, utcDateKey } from "@/lib/game/words";
import { applyGameResult, emptyPlayerStats } from "@/lib/utils";

export interface GameState {
  current: CurrentGameState;
  stats: PlayerStats;
  shakeRowId: number | null;
  lastSynced: string | null;

  initForToday: (today?: Date) => void;
  resetForNewDay: (today?: Date, hardMode?: boolean) => void;
  letter: (ch: string) => void;
  backspace: () => void;
  submit: (
    answer: string,
    isAccepted: (w: string) => boolean,
  ) => { ok: true; evaluation: RowEvaluation; finalStatus: CurrentGameState["gameStatus"]; guessNumber: number }
    | { ok: false; error: SubmitError };
  triggerShake: () => void;
  clearShake: () => void;
  applyServerSnapshot: (snapshot: { current?: CurrentGameState; stats?: PlayerStats }) => void;
  setLastSynced: (iso: string | null) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      current: createEmptyGame(utcDateKey(), dayOffsetForDate(), false),
      stats: emptyPlayerStats(),
      shakeRowId: null,
      lastSynced: null,

      initForToday: (today = new Date()) => {
        const todayKey = utcDateKey(today);
        if (get().current.date !== todayKey) {
          set({ current: createEmptyGame(todayKey, dayOffsetForDate(today), get().current.hardMode) });
        }
      },

      resetForNewDay: (today = new Date(), hardMode) => {
        set({ current: createEmptyGame(utcDateKey(today), dayOffsetForDate(today), hardMode ?? get().current.hardMode) });
      },

      letter: (ch) => { const r = engineLetter(get().current, ch); if (r.changed) set({ current: r.state }); },
      backspace: () => { const r = engineBackspace(get().current); if (r.changed) set({ current: r.state }); },

      submit: (answer, isAccepted) => {
        const r = engineSubmit(get().current, answer, isAccepted);
        if (!r.ok) return { ok: false, error: r.error ?? { kind: "not-in-word-list" } };

        const updates: Partial<GameState> = { current: r.state };
        if (r.finalStatus === "WIN" || r.finalStatus === "LOSE") {
          updates.stats = applyGameResult(get().stats, r.finalStatus === "WIN", r.guessNumber!, r.state.date);
        }
        set(updates);
        return { ok: true, evaluation: r.evaluation!, finalStatus: r.finalStatus!, guessNumber: r.guessNumber! };
      },

      triggerShake: () => set({ shakeRowId: get().current.currentRow }),
      clearShake: () => set({ shakeRowId: null }),
      applyServerSnapshot: ({ current, stats }) =>
        set((prev) => ({ current: current ?? prev.current, stats: stats ?? prev.stats })),
      setLastSynced: (iso) => set({ lastSynced: iso }),
    }),
    {
      name: "wordle-state",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
          : window.localStorage
      ),
      version: 1,
      partialize: (s) => ({ current: s.current, stats: s.stats, lastSynced: s.lastSynced }),
    },
  ),
);
