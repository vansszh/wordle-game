import { WORD_LENGTH } from "@/types";

// June 19 2021 — the day the original Wordle launched (puzzle #1).
export const PUZZLE_EPOCH_UTC = Date.UTC(2021, 5, 19);

const MS_PER_DAY = 86_400_000;

export function utcDateKey(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// How many days since the epoch — same value for every player on the same UTC day.
export function dayOffsetForDate(d: Date = new Date()): number {
  const midnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((midnight - PUZZLE_EPOCH_UTC) / MS_PER_DAY);
}

export function msUntilNextUtcMidnight(now: Date = new Date()): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(0, next - now.getTime());
}

export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

// Lazy-loaded caches so word lists are only fetched once.
let validCache: Set<string> | null = null;
let answersCache: string[] | null = null;

export async function loadValidWords(): Promise<Set<string>> {
  if (validCache) return validCache;
  const res = await fetch("/words/valid-words.json", { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to load word list: ${res.status}`);
  const list = (await res.json()) as string[];
  validCache = new Set(list.map((w) => w.toLowerCase()));
  return validCache;
}

export async function loadAnswerList(): Promise<string[]> {
  if (answersCache) return answersCache;
  const res = await fetch("/words/answers.json", { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to load answers: ${res.status}`);
  const list = (await res.json()) as string[];
  answersCache = list.map((w) => w.toLowerCase()).filter((w) => w.length === WORD_LENGTH);
  return answersCache;
}

export async function getAnswerForDate(date: Date = new Date()): Promise<string> {
  const answers = await loadAnswerList();
  const idx = ((dayOffsetForDate(date) % answers.length) + answers.length) % answers.length;
  const word = answers[idx];
  if (!word) throw new Error(`No answer at index ${idx}`);
  return word;
}

// Synchronous version for tests — caller provides the answer list.
export function getAnswerForDateSync(answers: string[], date: Date = new Date()): string {
  const idx = ((dayOffsetForDate(date) % answers.length) + answers.length) % answers.length;
  const word = answers[idx];
  if (!word) throw new Error(`No answer at index ${idx}`);
  return word.toLowerCase();
}

export async function isAcceptedGuess(guess: string): Promise<boolean> {
  if (guess.length !== WORD_LENGTH) return false;
  return (await loadValidWords()).has(guess.toLowerCase());
}

export function __resetWordCaches(): void {
  validCache = null;
  answersCache = null;
}
