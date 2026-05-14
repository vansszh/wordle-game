import type { RowEvaluation, TileState } from "@/types";
import { WORD_LENGTH } from "@/types";

/**
 * Evaluate a guess against the answer using Wordle's two-pass duplicate rule:
 * 1. Mark exact matches (correct) and remove those letters from the pool.
 * 2. Mark remaining letters present/absent based on what's left in the pool.
 *
 * This ensures a letter is only highlighted as many times as it appears in the answer.
 */
export function evaluateGuess(guess: string, answer: string): RowEvaluation {
  if (guess.length !== WORD_LENGTH || answer.length !== WORD_LENGTH) {
    throw new Error(`Both guess and answer must be ${WORD_LENGTH} letters.`);
  }

  const g = guess.toLowerCase();
  const a = answer.toLowerCase();
  const result: TileState[] = new Array<TileState>(WORD_LENGTH).fill("absent");
  const pool = new Map<string, number>();

  // Pass 1 — exact matches
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (g[i] === a[i]) {
      result[i] = "correct";
    } else {
      const ch = a[i]!;
      pool.set(ch, (pool.get(ch) ?? 0) + 1);
    }
  }

  // Pass 2 — present check against remaining pool
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === "correct") continue;
    const ch = g[i]!;
    const left = pool.get(ch) ?? 0;
    if (left > 0) {
      result[i] = "present";
      pool.set(ch, left - 1);
    }
  }

  return result;
}

export function isWinningRow(row: RowEvaluation): boolean {
  return row.length === WORD_LENGTH && row.every((s) => s === "correct");
}

// Returns the best known state per letter for the on-screen keyboard.
// Priority: correct > present > absent.
export function deriveKeyboardState(
  guesses: string[],
  evaluations: (RowEvaluation | null)[],
): Map<string, TileState> {
  const priority: Record<TileState, number> = {
    empty: 0, tbd: 0, absent: 1, present: 2, correct: 3,
  };
  const out = new Map<string, TileState>();

  for (let r = 0; r < guesses.length; r++) {
    const ev = evaluations[r];
    if (!ev) continue;
    const lower = guesses[r]!.toLowerCase();
    for (let i = 0; i < lower.length; i++) {
      const letter = lower[i]!;
      const state = ev[i]!;
      const prev = out.get(letter);
      if (!prev || priority[state] > priority[prev]) out.set(letter, state);
    }
  }

  return out;
}
