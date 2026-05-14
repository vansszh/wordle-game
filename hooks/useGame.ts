"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useToastStore } from "@/store/toastStore";
import { getAnswerForDate, loadValidWords } from "@/lib/game/words";
import { winMessageFor } from "@/lib/game/engine";
import type { SubmitError } from "@/lib/game/engine";

function errorMessage(err: SubmitError): string {
  switch (err.kind) {
    case "not-enough-letters": return "Not enough letters";
    case "not-in-word-list": return "Not in word list";
    case "hard-mode-position": return `Hard Mode: Must use ${err.letter.toUpperCase()} in position ${err.position + 1}`;
    case "hard-mode-missing": return `Hard Mode: Guess must contain ${err.letter.toUpperCase()}`;
  }
}

export interface UseGameApi {
  ready: boolean;
  answer: string | null;
  pressLetter: (ch: string) => void;
  pressBackspace: () => void;
  submit: () => void;
  flippingRow: number | null;
  bouncingRow: number | null;
}

export function useGame(): UseGameApi {
  const game = useGameStore();
  const hardModePref = useSettingsStore((s) => s.hardMode);
  const pushToast = useToastStore((s) => s.push);

  const [ready, setReady] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const validRef = useRef<Set<string> | null>(null);
  const [flippingRow, setFlippingRow] = useState<number | null>(null);
  const [bouncingRow, setBouncingRow] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      game.initForToday();
      const [valid, ans] = await Promise.all([loadValidWords(), getAnswerForDate()]);
      if (cancelled) return;
      validRef.current = valid;
      setAnswer(ans);
      setReady(true);
    })().catch(() => pushToast("Failed to load word list", 2000));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync hard-mode preference before any guesses are made.
  useEffect(() => {
    const cur = game.current;
    if (cur.gameStatus !== "IN_PROGRESS") return;
    if (cur.evaluations.some((e) => e !== null)) return;
    if (cur.hardMode !== hardModePref) game.resetForNewDay(new Date(), hardModePref);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hardModePref]);

  const pressLetter = useCallback((ch: string) => { if (ready) game.letter(ch); }, [ready, game]);
  const pressBackspace = useCallback(() => { if (ready) game.backspace(); }, [ready, game]);

  const submit = useCallback(() => {
    if (!ready || !answer || !validRef.current) return;
    if (game.current.gameStatus !== "IN_PROGRESS") return;

    const rowIdx = game.current.currentRow;
    const result = game.submit(answer, (w) => validRef.current!.has(w));

    if (!result.ok) {
      pushToast(errorMessage(result.error), 1100);
      game.triggerShake();
      window.setTimeout(() => game.clearShake(), 650);
      return;
    }

    const FLIP_MS = 1700;
    setFlippingRow(rowIdx);

    if (result.finalStatus === "WIN") {
      window.setTimeout(() => {
        setFlippingRow(null);
        setBouncingRow(rowIdx);
        pushToast(winMessageFor(result.guessNumber), 2000);
        try { navigator.vibrate?.([100, 50, 100]); } catch { /* ignore */ }
      }, FLIP_MS);
      window.setTimeout(() => setBouncingRow(null), FLIP_MS + 1100);
    } else if (result.finalStatus === "LOSE") {
      window.setTimeout(() => {
        setFlippingRow(null);
        pushToast(`The answer was ${answer.toUpperCase()}`, 4000);
      }, FLIP_MS);
    } else {
      window.setTimeout(() => setFlippingRow(null), FLIP_MS);
    }
  }, [ready, answer, game, pushToast]);

  return { ready, answer, pressLetter, pressBackspace, submit, flippingRow, bouncingRow };
}
