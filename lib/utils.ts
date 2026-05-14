import type { ClassValue } from "@/lib/types";
import type { GuessDistribution, PlayerStats, RowEvaluation, TileState } from "@/types";
import { utcDateKey } from "@/lib/game/words";

/**
 * Tiny clsx replacement so we don't pull in a dep.
 * Accepts strings, numbers, conditional objects, or arrays of any of the above.
 */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string" || typeof input === "number") {
      out.push(String(input));
    } else if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) out.push(nested);
    } else if (typeof input === "object") {
      for (const [key, val] of Object.entries(input)) {
        if (val) out.push(key);
      }
    }
  }
  return out.join(" ");
}

/** Empty distribution. */
export function emptyGuessDistribution(): GuessDistribution {
  return { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 };
}

/** Brand-new player stats. */
export function emptyPlayerStats(): PlayerStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: emptyGuessDistribution(),
    lastCompletedDate: null,
    lastWonDate: null,
  };
}

/**
 * Update stats after a finished game. `won` indicates outcome, `guessNumber`
 * is the 1-indexed row of the winning guess (ignored on loss).
 *
 * Streak rules:
 *   - On win: increment if previous lastWonDate was yesterday OR streak === 0
 *     and lastCompletedDate is null. Otherwise reset to 1.
 *   - On loss: streak resets to 0.
 */
export function applyGameResult(
  stats: PlayerStats,
  won: boolean,
  guessNumber: number,
  todayKey: string = utcDateKey(),
): PlayerStats {
  const next: PlayerStats = {
    ...stats,
    guessDistribution: { ...stats.guessDistribution },
    gamesPlayed: stats.gamesPlayed + 1,
    lastCompletedDate: todayKey,
  };

  if (won) {
    next.gamesWon += 1;
    const key = String(Math.min(Math.max(guessNumber, 1), 6)) as keyof GuessDistribution;
    next.guessDistribution[key] += 1;

    if (stats.lastWonDate && isYesterday(stats.lastWonDate, todayKey)) {
      next.currentStreak = stats.currentStreak + 1;
    } else if (stats.lastWonDate === todayKey) {
      next.currentStreak = stats.currentStreak; // shouldn't happen, but safe
    } else {
      next.currentStreak = 1;
    }
    next.maxStreak = Math.max(stats.maxStreak, next.currentStreak);
    next.lastWonDate = todayKey;
  } else {
    next.currentStreak = 0;
  }

  return next;
}

/** True iff `prev` is the UTC day directly before `today` (both YYYY-MM-DD). */
export function isYesterday(prev: string, today: string): boolean {
  const a = parseISODate(prev);
  const b = parseISODate(today);
  if (!a || !b) return false;
  const diff = (b - a) / 86_400_000;
  return diff === 1;
}

function parseISODate(s: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const [, y, mo, d] = m;
  if (!y || !mo || !d) return null;
  return Date.UTC(Number(y), Number(mo) - 1, Number(d));
}

/** Build the share-grid emoji string for a finished game. */
export function buildShareGrid(params: {
  puzzleNumber: number;
  guesses: string[];
  evaluations: (RowEvaluation | null)[];
  won: boolean;
  hardMode: boolean;
  highContrast: boolean;
}): string {
  const { puzzleNumber, guesses, evaluations, won, hardMode, highContrast } = params;
  const used = evaluations.filter((e) => e !== null).length;
  const score = won ? `${used}/6` : "X/6";
  const header = `Wordle ${puzzleNumber.toLocaleString("en-US")} ${score}${hardMode ? "*" : ""}`;

  const map = (s: TileState | undefined): string => {
    switch (s) {
      case "correct": return highContrast ? "🟧" : "🟩";
      case "present": return highContrast ? "🟦" : "🟨";
      case "absent": return "⬛";
      default: return "⬛";
    }
  };

  const rows: string[] = [];
  for (let r = 0; r < guesses.length; r++) {
    const ev = evaluations[r];
    if (!ev) continue;
    rows.push(ev.map(map).join(""));
  }

  return `${header}\n\n${rows.join("\n")}`;
}

/** Copy text to clipboard with a Web-Share fallback. Returns "copied" / "shared" / "failed". */
export async function shareOrCopy(text: string): Promise<"copied" | "shared" | "failed"> {
  if (typeof navigator === "undefined") return "failed";
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return "copied";
    }
  } catch {
    // fall through to share
  }
  try {
    if (typeof navigator.share === "function") {
      await navigator.share({ text });
      return "shared";
    }
  } catch {
    // user cancelled — fall through
  }
  return "failed";
}

/** Stable random id (best-effort, no crypto requirement). */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
