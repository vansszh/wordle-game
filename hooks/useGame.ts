"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useToastStore } from "@/store/toastStore";
import {
  getAnswerForDate,
  loadValidWords,
  utcDateKey,
} from "@/lib/game/words";
import { winMessageFor } from "@/lib/game/engine";
import type { SubmitError } from "@/lib/game/engine";

function describeError(err: SubmitError): string {
  switch (err.kind) {
    case "not-enough-letters":
      return "Not enough letters";
    case "not-in-word-list":
      return "Not in word list";
    case "hard-mode-position":
      return `Hard Mode: Must use ${err.letter.toUpperCase()} in position ${err.position + 1}`;
    case "hard-mode-missing":
      return `Hard Mode: Guess must contain ${err.letter.toUpperCase()}`;
  }
}

export interface UseGameApi {
  ready: boolean;
  answer: string | null;
  pressLetter: (ch: string) => void;
  pressBackspace: () => void;
  submit: () => void;
  /** Indices of rows that are currently flipping (for animation). */
  flippingRow: number | null;
  /** Indices of rows that should bounce (winning row). */
  bouncingRow: number | null;
}

/**
 * Main hook the page uses to drive the board. Loads the answer + valid-word
 * set on mount, wires keyboard input, and coordinates animation timing
 * between submit -> flip -> result toast.
 */
export function useGame(): UseGameApi {
  const game = useGameStore();
  const hardModePref = useSettingsStore((s) => s.hardMode);
  const highContrast = useSettingsStore((s) => s.highContrast);
  const pushToast = useToastStore((s) => s.push);

  const [ready, setReady] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const validRef = useRef<Set<string> | null>(null);

  const [flippingRow, setFlippingRow] = useState<number | null>(null);
  const [bouncingRow, setBouncingRow] = useState<number | null>(null);

  // On mount: roll forward to today, load valid words + today's answer.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      game.initForToday();
      const [valid, ans] = await Promise.all([loadValidWords(), getAnswerForDate()]);
      if (cancelled) return;
      validRef.current = valid;
      setAnswer(ans);
      setReady(true);
    })().catch((err) => {
      console.error(err);
      pushToast("Failed to load word list", 2000);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync hard-mode pref into the game state — only allowed before any guesses
  // are made on a given day.
  useEffect(() => {
    const cur = game.current;
    if (cur.gameStatus !== "IN_PROGRESS") return;
    const anyGuessed = cur.evaluations.some((e) => e !== null);
    if (anyGuessed) return;
    if (cur.hardMode !== hardModePref) {
      game.resetForNewDay(new Date(), hardModePref);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hardModePref]);

  const pressLetter = useCallback(
    (ch: string) => {
      if (!ready) return;
      game.letter(ch);
    },
    [ready, game],
  );

  const pressBackspace = useCallback(() => {
    if (!ready) return;
    game.backspace();
  }, [ready, game]);

  const submit = useCallback(() => {
    if (!ready || !answer) return;
    const valid = validRef.current;
    if (!valid) return;
    if (game.current.gameStatus !== "IN_PROGRESS") return;

    const rowIdx = game.current.currentRow;

    const result = game.submit(answer, (w) => valid.has(w));

    if (!result.ok) {
      pushToast(describeError(result.error), 1100);
      game.triggerShake();
      window.setTimeout(() => game.clearShake(), 650);
      return;
    }

    // Trigger flip animation for the row we just submitted.
    setFlippingRow(rowIdx);
    const flipDuration = 1700; // 5 tiles * 300ms approx + buffer

    if (result.finalStatus === "WIN") {
      window.setTimeout(() => {
        setFlippingRow(null);
        setBouncingRow(rowIdx);
        pushToast(winMessageFor(result.guessNumber), 2000);
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try {
            navigator.vibrate([100, 50, 100]);
          } catch {
            /* ignore */
          }
        }
      }, flipDuration);
      window.setTimeout(() => setBouncingRow(null), flipDuration + 1100);
    } else if (result.finalStatus === "LOSE") {
      window.setTimeout(() => {
        setFlippingRow(null);
        pushToast(`The answer was ${answer.toUpperCase()}`, 4000);
      }, flipDuration);
    } else {
      window.setTimeout(() => setFlippingRow(null), flipDuration);
    }
    void highContrast;
  }, [ready, answer, game, pushToast, highContrast]);

  return { ready, answer, pressLetter, pressBackspace, submit, flippingRow, bouncingRow };
}
