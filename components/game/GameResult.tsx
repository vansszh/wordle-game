"use client";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useToastStore } from "@/store/toastStore";
import { buildShareGrid, shareOrCopy } from "@/lib/utils";
import { dayOffsetForDate, formatCountdown, msUntilNextUtcMidnight } from "@/lib/game/words";
import { PUZZLE_EPOCH_UTC } from "@/lib/game/words";

export function GameResult() {
  const game = useGameStore((s) => s.current);
  const stats = useGameStore((s) => s.stats);
  const highContrast = useSettingsStore((s) => s.highContrast);
  const pushToast = useToastStore((s) => s.push);

  const [countdown, setCountdown] = useState<string>(() => formatCountdown(msUntilNextUtcMidnight()));

  useEffect(() => {
    const id = window.setInterval(() => {
      setCountdown(formatCountdown(msUntilNextUtcMidnight()));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (game.gameStatus === "IN_PROGRESS") return null;

  const won = game.gameStatus === "WIN";
  const guesses = game.boardState.filter(Boolean);

  const handleShare = async () => {
    const text = buildShareGrid({
      puzzleNumber: dayOffsetForDate(new Date(game.date + "T00:00:00Z")) + 1,
      guesses: game.boardState,
      evaluations: game.evaluations,
      won,
      hardMode: game.hardMode,
      highContrast,
    });
    const result = await shareOrCopy(text);
    if (result === "copied") pushToast("Copied results to clipboard", 1400);
    else if (result === "shared") pushToast("Shared!", 1200);
    else pushToast("Share failed", 1500);
  };

  // Avoid unused-var warning for PUZZLE_EPOCH_UTC re-export.
  void PUZZLE_EPOCH_UTC;

  return (
    <div
      className="mx-auto mt-3 flex w-full max-w-[420px] flex-col items-center gap-3 rounded-xl border border-[var(--c-border-subtle)] bg-[var(--c-bg-secondary)] px-4 py-3 text-center"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-[var(--c-text-secondary)]">
        {won ? `Solved in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}` : "Better luck tomorrow"}
      </p>
      <div className="flex w-full items-center justify-between text-xs text-[var(--c-text-secondary)]">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider">Next Wordle</span>
          <span className="font-mono text-base text-[var(--c-text-primary)]">{countdown}</span>
        </div>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--c-accent)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-transform active:scale-95"
        >
          Share <Share2 size={14} aria-hidden="true" />
        </button>
      </div>
      <p className="sr-only">
        {won
          ? `You won in ${guesses.length} guesses. Current streak: ${stats.currentStreak}.`
          : `You did not solve today's puzzle. Current streak: ${stats.currentStreak}.`}
      </p>
    </div>
  );
}
