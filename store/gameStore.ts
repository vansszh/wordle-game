"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CurrentGameState, PlayerStats, RowEvaluation } from "@/types";
import {
  createEmptyGame,
  pressBackspace as enginePressBackspace,
  pressLetter as enginePressLetter,
  submitGuess as engineSubmit,
  type SubmitError,
} from "@/lib/game/engine";
import { dayOffsetForDate, utcDateKey } from "@/lib/game/words";
import { applyGameResult, emptyPlayerStats } from "@/lib/utils";

export interface GameState {
  current: CurrentGameState;
  stats: PlayerStats;
  /** ID of the current row to flash with shake (null when none). */
  shakeRowId: number | null;
  /** ISO timestamp of the last successful sync to Supabase. */
  lastSynced: string | null;

  // Game actions
  initForToday: (today?: Date) => void;
  resetForNewDay: (today?: Date, hardMode?: boolean) => void;
  letter: (ch: string) => void;
  backspace: () => void;
  submit: (
    answer: string,
    isAccepted: (w: string) => boolean,
  ) =>
    | { ok: true; evaluation: RowEvaluation; finalStatus: CurrentGameState["gameStatus"]; guessNumber: number }
    | { ok: false; error: SubmitError };

  triggerShake: () => void;
  clearShake: () => void;

  // Sync helpers
  applyServerSnapshot: (snapshot: { current?: CurrentGameState; stats?: PlayerStats }) => void;
  setLastSynced: (iso: string | null) => void;
}

const STORAGE_KEY = "wordle-state";

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      current: createEmptyGame(utcDateKey(), dayOffsetForDate(), false),
      stats: emptyPlayerStats(),
      shakeRowId: null,
      lastSynced: null,

      initForToday: (today = new Date()) => {
        const cur = get().current;
        const todayKey = utcDateKey(today);
        if (cur.date !== todayKey) {
          set({ current: createEmptyGame(todayKey, dayOffsetForDate(today), cur.hardMode) });
        }
      },

      resetForNewDay: (today = new Date(), hardMode) => {
        const cur = get().current;
        set({
          current: createEmptyGame(
            utcDateKey(today),
            dayOffsetForDate(today),
            hardMode ?? cur.hardMode,
          ),
        });
      },

      letter: (ch) => {
        const r = enginePressLetter(get().current, ch);
        if (r.changed) set({ current: r.state });
      },

      backspace: () => {
        const r = enginePressBackspace(get().current);
        if (r.changed) set({ current: r.state });
      },

      submit: (answer, isAccepted) => {
        const r = engineSubmit(get().current, answer, isAccepted);
        if (!r.ok) {
          return { ok: false, error: r.error ?? { kind: "not-in-word-list" } };
        }
        const evaluation = r.evaluation!;
        const finalStatus = r.finalStatus!;
        const guessNumber = r.guessNumber!;

        const updates: Partial<GameState> = { current: r.state };

        if (finalStatus === "WIN" || finalStatus === "LOSE") {
          updates.stats = applyGameResult(
            get().stats,
            finalStatus === "WIN",
            guessNumber,
            r.state.date,
          );
        }
        set(updates);
        return { ok: true, evaluation, finalStatus, guessNumber };
      },

      triggerShake: () => set({ shakeRowId: get().current.currentRow }),
      clearShake: () => set({ shakeRowId: null }),

      applyServerSnapshot: ({ current, stats }) => {
        set((prev) => ({
          current: current ?? prev.current,
          stats: stats ?? prev.stats,
        }));
      },

      setLastSynced: (iso) => set({ lastSynced: iso }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
      version: 1,
      partialize: (state) => ({
        current: state.current,
        stats: state.stats,
        lastSynced: state.lastSynced,
      }),
    },
  ),
);
