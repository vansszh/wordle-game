import type { ClassValue } from "@/lib/types";
import type { GuessDistribution, PlayerStats, RowEvaluation, TileState } from "@/types";
import { utcDateKey } from "@/lib/game/words";

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string" || typeof input === "number") out.push(String(input));
    else if (Array.isArray(input)) { const n = cn(...input); if (n) out.push(n); }
    else if (typeof input === "object") {
      for (const [k, v] of Object.entries(input)) if (v) out.push(k);
    }
  }
  return out.join(" ");
}

export function emptyGuessDistribution(): GuessDistribution {
  return { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 };
}

export function emptyPlayerStats(): PlayerStats {
  return {
    gamesPlayed: 0, gamesWon: 0, currentStreak: 0, maxStreak: 0,
    guessDistribution: emptyGuessDistribution(),
    lastCompletedDate: null, lastWonDate: null,
  };
}

// Update stats after a game ends. Streak increments only if the player
// won the previous UTC day; otherwise it resets to 1.
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
    next.currentStreak = stats.lastWonDate && isYesterday(stats.lastWonDate, todayKey)
      ? stats.currentStreak + 1
      : 1;
    next.maxStreak = Math.max(stats.maxStreak, next.currentStreak);
    next.lastWonDate = todayKey;
  } else {
    next.currentStreak = 0;
  }

  return next;
}

export function isYesterday(prev: string, today: string): boolean {
  const parse = (s: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return null;
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  };
  const a = parse(prev), b = parse(today);
  return a !== null && b !== null && (b - a) / 86_400_000 === 1;
}

export function buildShareGrid(params: {
  puzzleNumber: number;
  guesses: string[];
  evaluations: (RowEvaluation | null)[];
  won: boolean;
  hardMode: boolean;
  highContrast: boolean;
}): string {
  const { puzzleNumber, evaluations, won, hardMode, highContrast } = params;
  const used = evaluations.filter(Boolean).length;
  const score = won ? `${used}/6` : "X/6";
  const header = `Wordle ${puzzleNumber.toLocaleString("en-US")} ${score}${hardMode ? "*" : ""}`;

  const emoji = (s: TileState | undefined) => {
    if (s === "correct") return highContrast ? "🟧" : "🟩";
    if (s === "present") return highContrast ? "🟦" : "🟨";
    return "⬛";
  };

  const rows = evaluations
    .filter((e): e is RowEvaluation => e !== null)
    .map((ev) => ev.map(emoji).join(""));

  return `${header}\n\n${rows.join("\n")}`;
}

export async function shareOrCopy(text: string): Promise<"copied" | "shared" | "failed"> {
  if (typeof navigator === "undefined") return "failed";
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return "copied"; }
  } catch { /* fall through */ }
  try {
    if (typeof navigator.share === "function") { await navigator.share({ text }); return "shared"; }
  } catch { /* user cancelled */ }
  return "failed";
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
