import { WORD_LENGTH } from "@/types";

/**
 * Wordle's original epoch — June 19th 2021 (UTC). Day 0 == "CIGAR".
 * We only use it as an arbitrary anchor: the actual answer word list
 * shipped here doesn't have to match NYT's, but the maths is identical.
 */
export const PUZZLE_EPOCH_UTC = Date.UTC(2021, 5, 19);

/** Number of milliseconds in a UTC day. */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Returns "YYYY-MM-DD" for the UTC date of `d` (defaults to now).
 */
export function utcDateKey(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Day index since the puzzle epoch. Same value across the entire UTC day,
 * for every player on Earth.
 */
export function dayOffsetForDate(d: Date = new Date()): number {
  const startOfDay = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((startOfDay - PUZZLE_EPOCH_UTC) / MS_PER_DAY);
}

/** Milliseconds remaining until the next UTC midnight. */
export function msUntilNextUtcMidnight(now: Date = new Date()): number {
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0,
  );
  return Math.max(0, next - now.getTime());
}

/** "HH:MM:SS" formatted countdown. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/* -------------------------------------------------------------------------- */
/* Word list loading                                                           */
/* -------------------------------------------------------------------------- */

let validCache: Set<string> | null = null;
let answersCache: string[] | null = null;

/** Load the full set of accepted 5-letter guesses (lazy, cached). */
export async function loadValidWords(): Promise<Set<string>> {
  if (validCache) return validCache;
  const res = await fetch("/words/valid-words.json", { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to load valid word list: ${res.status}`);
  const list = (await res.json()) as string[];
  validCache = new Set(list.map((w) => w.toLowerCase()));
  return validCache;
}

/** Load the curated answer list (lazy, cached). */
export async function loadAnswerList(): Promise<string[]> {
  if (answersCache) return answersCache;
  const res = await fetch("/words/answers.json", { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to load answer list: ${res.status}`);
  const list = (await res.json()) as string[];
  answersCache = list.map((w) => w.toLowerCase()).filter((w) => w.length === WORD_LENGTH);
  return answersCache;
}

/**
 * Pick the answer for a given UTC date. The same offset always returns
 * the same word for every client globally.
 */
export async function getAnswerForDate(date: Date = new Date()): Promise<string> {
  const answers = await loadAnswerList();
  if (answers.length === 0) throw new Error("Answer list is empty");
  const offset = dayOffsetForDate(date);
  const idx = ((offset % answers.length) + answers.length) % answers.length;
  // Safe: idx is bounded by answers.length above, but TS strict still wants a guard.
  const word = answers[idx];
  if (!word) throw new Error(`No answer at index ${idx}`);
  return word;
}

/** Synchronous variant for tests / SSR — caller provides the answer list. */
export function getAnswerForDateSync(answers: string[], date: Date = new Date()): string {
  if (answers.length === 0) throw new Error("Answer list is empty");
  const offset = dayOffsetForDate(date);
  const idx = ((offset % answers.length) + answers.length) % answers.length;
  const word = answers[idx];
  if (!word) throw new Error(`No answer at index ${idx}`);
  return word.toLowerCase();
}

/** True iff `guess` exists in the accepted-guesses list. */
export async function isAcceptedGuess(guess: string): Promise<boolean> {
  if (guess.length !== WORD_LENGTH) return false;
  const set = await loadValidWords();
  return set.has(guess.toLowerCase());
}

/** Reset internal caches — used by tests. */
export function __resetWordCaches(): void {
  validCache = null;
  answersCache = null;
}
