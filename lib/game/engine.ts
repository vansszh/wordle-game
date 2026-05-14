import type { CurrentGameState, GameStatus, RowEvaluation } from "@/types";
import { MAX_GUESSES, WORD_LENGTH } from "@/types";
import { evaluateGuess, isWinningRow } from "./evaluator";

/** Build a fresh, empty game state for a given UTC date / day offset. */
export function createEmptyGame(date: string, dayOffset: number, hardMode: boolean): CurrentGameState {
  return {
    date,
    dayOffset,
    boardState: Array.from({ length: MAX_GUESSES }, () => ""),
    evaluations: Array.from({ length: MAX_GUESSES }, () => null),
    currentRow: 0,
    gameStatus: "IN_PROGRESS",
    hardMode,
  };
}

/** Result of attempting to add a letter. */
export interface KeyResult {
  state: CurrentGameState;
  changed: boolean;
}

export function pressLetter(state: CurrentGameState, letter: string): KeyResult {
  if (state.gameStatus !== "IN_PROGRESS") return { state, changed: false };
  const row = state.currentRow;
  const current = state.boardState[row] ?? "";
  if (current.length >= WORD_LENGTH) return { state, changed: false };
  if (!/^[a-zA-Z]$/.test(letter)) return { state, changed: false };
  const next = [...state.boardState];
  next[row] = (current + letter).toLowerCase();
  return { state: { ...state, boardState: next }, changed: true };
}

export function pressBackspace(state: CurrentGameState): KeyResult {
  if (state.gameStatus !== "IN_PROGRESS") return { state, changed: false };
  const row = state.currentRow;
  const current = state.boardState[row] ?? "";
  if (current.length === 0) return { state, changed: false };
  const next = [...state.boardState];
  next[row] = current.slice(0, -1);
  return { state: { ...state, boardState: next }, changed: true };
}

/** Validation results for a submission attempt. */
export type SubmitError =
  | { kind: "not-enough-letters" }
  | { kind: "not-in-word-list" }
  | { kind: "hard-mode-position"; letter: string; position: number }
  | { kind: "hard-mode-missing"; letter: string };

export interface SubmitResult {
  ok: boolean;
  state: CurrentGameState;
  /** Set when ok=false. */
  error?: SubmitError;
  /** Set when ok=true — the evaluation for the just-submitted row. */
  evaluation?: RowEvaluation;
  /** Set when ok=true — the final game status after this submit. */
  finalStatus?: GameStatus;
  /** Set when ok=true — number of guesses used (1..MAX_GUESSES). */
  guessNumber?: number;
}

/**
 * Validate the current row meets hard-mode constraints based on prior reveals.
 * Returns null if valid, otherwise a SubmitError describing the violation.
 *
 * Original Wordle hard-mode rules:
 *   - any letter previously revealed `correct` must remain in that exact position
 *   - any letter previously revealed `present` must be reused somewhere
 */
export function checkHardMode(state: CurrentGameState, guess: string): SubmitError | null {
  const lower = guess.toLowerCase();

  // Required positions (correct from any previous row).
  const requiredPositions = new Map<number, string>();
  // Letters that must appear at least N times (present from previous rows).
  const requiredCounts = new Map<string, number>();

  for (let r = 0; r < state.currentRow; r++) {
    const ev = state.evaluations[r];
    const prev = state.boardState[r];
    if (!ev || !prev) continue;
    const counts: Record<string, number> = {};
    for (let i = 0; i < WORD_LENGTH; i++) {
      const ch = prev[i];
      const st = ev[i];
      if (!ch || !st) continue;
      if (st === "correct") {
        requiredPositions.set(i, ch);
      } else if (st === "present") {
        counts[ch] = (counts[ch] ?? 0) + 1;
      }
    }
    for (const [letter, n] of Object.entries(counts)) {
      const existing = requiredCounts.get(letter) ?? 0;
      if (n > existing) requiredCounts.set(letter, n);
    }
  }

  for (const [pos, letter] of requiredPositions) {
    if (lower[pos] !== letter) {
      return { kind: "hard-mode-position", letter, position: pos };
    }
  }

  for (const [letter, needed] of requiredCounts) {
    let count = 0;
    for (const ch of lower) if (ch === letter) count += 1;
    if (count < needed) {
      return { kind: "hard-mode-missing", letter };
    }
  }

  return null;
}

/**
 * Try to submit the current row.
 *
 * `isAccepted` is the (already-fetched) word-list checker. It is passed in so
 * this function stays synchronous and easy to test.
 */
export function submitGuess(
  state: CurrentGameState,
  answer: string,
  isAccepted: (word: string) => boolean,
): SubmitResult {
  if (state.gameStatus !== "IN_PROGRESS") return { ok: false, state };

  const row = state.currentRow;
  const guess = (state.boardState[row] ?? "").toLowerCase();

  if (guess.length < WORD_LENGTH) {
    return { ok: false, state, error: { kind: "not-enough-letters" } };
  }

  if (!isAccepted(guess)) {
    return { ok: false, state, error: { kind: "not-in-word-list" } };
  }

  if (state.hardMode) {
    const violation = checkHardMode(state, guess);
    if (violation) return { ok: false, state, error: violation };
  }

  const evaluation = evaluateGuess(guess, answer);
  const newEvaluations = [...state.evaluations];
  newEvaluations[row] = evaluation;

  const won = isWinningRow(evaluation);
  const lastRow = row === MAX_GUESSES - 1;
  const finalStatus: GameStatus = won ? "WIN" : lastRow ? "LOSE" : "IN_PROGRESS";

  return {
    ok: true,
    state: {
      ...state,
      evaluations: newEvaluations,
      currentRow: row + 1,
      gameStatus: finalStatus,
    },
    evaluation,
    finalStatus,
    guessNumber: row + 1,
  };
}

/** Result message for a winning game, by guess number. */
export function winMessageFor(guessNumber: number): string {
  switch (guessNumber) {
    case 1: return "Genius!";
    case 2: return "Magnificent!";
    case 3: return "Impressive!";
    case 4: return "Splendid!";
    case 5: return "Great!";
    case 6: return "Phew!";
    default: return "Well done!";
  }
}
