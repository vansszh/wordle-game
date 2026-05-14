"use client";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { Modal } from "./Modal";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useToastStore } from "@/store/toastStore";
import { buildShareGrid, shareOrCopy } from "@/lib/utils";
import { dayOffsetForDate, formatCountdown, msUntilNextUtcMidnight } from "@/lib/game/words";
import type { GuessDistribution } from "@/types";

interface StatsModalProps {
  open: boolean;
  onClose: () => void;
}

interface StatCardProps {
  value: number | string;
  label: string;
}

function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="flex flex-col items-center justify-start text-center">
      <span className="text-3xl font-light leading-none tabular-nums">{value}</span>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[var(--c-text-secondary)]">
        {label}
      </span>
    </div>
  );
}

interface DistributionRowProps {
  label: string;
  count: number;
  max: number;
  highlight: boolean;
}

function DistributionRow({ label, count, max, highlight }: DistributionRowProps) {
  const widthPct = max === 0 ? 0 : Math.max(7, (count / max) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right tabular-nums">{label}</span>
      <div className="relative h-5 flex-1 overflow-hidden rounded-sm bg-[var(--c-bg-surface)]">
        <div
          className="flex h-full items-center justify-end px-2 text-[11px] font-bold text-white"
          style={{
            width: `${count === 0 ? 7 : widthPct}%`,
            backgroundColor: highlight ? "var(--c-accent)" : "var(--c-text-muted)",
            transition: "width 240ms ease",
          }}
        >
          {count}
        </div>
      </div>
    </div>
  );
}

export function StatsModal({ open, onClose }: StatsModalProps) {
  const stats = useGameStore((s) => s.stats);
  const game = useGameStore((s) => s.current);
  const highContrast = useSettingsStore((s) => s.highContrast);
  const pushToast = useToastStore((s) => s.push);

  const [countdown, setCountdown] = useState<string>(() => formatCountdown(msUntilNextUtcMidnight()));
  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(
      () => setCountdown(formatCountdown(msUntilNextUtcMidnight())),
      1000,
    );
    return () => window.clearInterval(id);
  }, [open]);

  const dist = stats.guessDistribution;
  const max = Math.max(...Object.values(dist));
  const winPct = stats.gamesPlayed === 0 ? 0 : Math.round((stats.gamesWon / stats.gamesPlayed) * 100);

  const completedToday = game.gameStatus !== "IN_PROGRESS";
  const highlightKey = String(game.evaluations.filter((e) => e !== null).length) as keyof GuessDistribution;

  const handleShare = async () => {
    const text = buildShareGrid({
      puzzleNumber: dayOffsetForDate(new Date(game.date + "T00:00:00Z")) + 1,
      guesses: game.boardState,
      evaluations: game.evaluations,
      won: game.gameStatus === "WIN",
      hardMode: game.hardMode,
      highContrast,
    });
    const r = await shareOrCopy(text);
    if (r === "copied") pushToast("Copied results to clipboard", 1200);
    else if (r === "shared") pushToast("Shared!", 1200);
    else pushToast("Share failed", 1500);
  };

  return (
    <Modal open={open} onClose={onClose} title="Statistics">
      <div className="flex justify-around gap-3 py-2">
        <StatCard value={stats.gamesPlayed} label="Played" />
        <StatCard value={`${winPct}`} label="Win %" />
        <StatCard value={stats.currentStreak} label="Current Streak" />
        <StatCard value={stats.maxStreak} label="Max Streak" />
      </div>

      <div className="mt-2">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider">
          Guess Distribution
        </p>
        {stats.gamesPlayed === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--c-text-secondary)]">
            No data yet — finish a puzzle to see your stats here.
          </p>
        ) : (
          <div className="space-y-1.5">
            {(["1", "2", "3", "4", "5", "6"] as const).map((k) => (
              <DistributionRow
                key={k}
                label={k}
                count={dist[k]}
                max={max}
                highlight={completedToday && game.gameStatus === "WIN" && highlightKey === k}
              />
            ))}
          </div>
        )}
      </div>

      {completedToday ? (
        <>
          <hr className="my-4 border-t border-[var(--c-border-subtle)]" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--c-text-secondary)]">
                Next Wordle
              </p>
              <p className="font-mono text-2xl tabular-nums">{countdown}</p>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--c-accent)] px-5 py-3 text-sm font-bold uppercase tracking-wider text-white transition-transform active:scale-95"
            >
              Share <Share2 size={16} aria-hidden="true" />
            </button>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
