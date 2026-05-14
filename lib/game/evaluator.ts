import type { RowEvaluation, TileState } from "@/types";
import { WORD_LENGTH } from "@/types";

/**
 * Evaluate a 5-letter guess against the answer using the original Wordle
 * duplicate-letter rules:
 *
 *   1. First pass — every letter in the exact correct position is marked
 *      `correct`. Each match consumes a slot in the answer's letter pool.
 *   2. Second pass — for every still-unmatched letter, mark `present` if
 *      the answer's letter pool still has that letter remaining; otherwise
 *      `absent`.
 *
 * This is what makes the duplicate-letter behaviour feel right: if the answer
 * is `ALLOY` and you guess `LLAMA`, only the first L is marked, and so on.
 */
export function evaluateGuess(guess: string, answer: string): RowEvaluation {
  if (guess.length !== WORD_LENGTH) {
    throw new Error(
      `evaluateGuess: guess must be exactly ${WORD_LENGTH} letters, received ${guess.length}.`,
    );
  }
  if (answer.length !== WORD_LENGTH) {
    throw new Error(
      `evaluateGuess: answer must be exactly ${WORD_LENGTH} letters, received ${answer.length}.`,
    );
  }

  const g = guess.toLowerCase();
  const a = answer.toLowerCase();

  const result: TileState[] = new Array<TileState>(WORD_LENGTH).fill("absent");
  // Track how many of each letter remain "available" in the answer.
  const remaining = new Map<string, number>();

  // Pass 1 — exact matches.
  for (let i = 0; i < WORD_LENGTH; i++) {
    const ag = a[i];
    const gg = g[i];
    if (ag === undefined || gg === undefined) continue;
    if (gg === ag) {
      result[i] = "correct";
    } else {
      remaining.set(ag, (remaining.get(ag) ?? 0) + 1);
    }
  }

  // Pass 2 — present (yellow) for letters still in the pool.
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === "correct") continue;
    const gg = g[i];
    if (gg === undefined) continue;
    const left = remaining.get(gg) ?? 0;
    if (left > 0) {
      result[i] = "present";
      remaining.set(gg, left - 1);
    }
  }

  return result;
}

/** True when every tile in the row is `correct`. */
export function isWinningRow(row: RowEvaluation): boolean {
  return row.length === WORD_LENGTH && row.every((s) => s === "correct");
}

/**
 * Combine multiple row evaluations into a per-letter best-known state for
 * the on-screen keyboard. Priority: `correct` > `present` > `absent`.
 *
 * Returns a Map keyed by lowercase letter.
 */
export function deriveKeyboardState(
  guesses: string[],
  evaluations: (RowEvaluation | null)[],
): Map<string, TileState> {
  const order: Record<TileState, number> = {
    empty: 0,
    tbd: 0,
    absent: 1,
    present: 2,
    correct: 3,
  };
  const out = new Map<string, TileState>();

  for (let r = 0; r < guesses.length; r++) {
    const guess = guesses[r];
    const ev = evaluations[r];
    if (!guess || !ev) continue;
    const lower = guess.toLowerCase();
    for (let i = 0; i < lower.length; i++) {
      const letter = lower[i];
      const state = ev[i];
      if (!letter || !state) continue;
      const prev = out.get(letter);
      if (!prev || order[state] > order[prev]) {
        out.set(letter, state);
      }
    }
  }

  return out;
}
