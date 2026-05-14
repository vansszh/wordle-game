import type { CurrentGameState, GameStatus, RowEvaluation } from "@/types";
import { MAX_GUESSES, WORD_LENGTH } from "@/types";
import { evaluateGuess, isWinningRow } from "./evaluator";

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

export interface KeyResult {
  state: CurrentGameState;
  changed: boolean;
}

export function pressLetter(state: CurrentGameState, letter: string): KeyResult {
  if (state.gameStatus !== "IN_PROGRESS") return { state, changed: false };
  const current = state.boardState[state.currentRow] ?? "";
  if (current.length >= WORD_LENGTH || !/^[a-zA-Z]$/.test(letter)) return { state, changed: false };
  const next = [...state.boardState];
  next[state.currentRow] = (current + letter).toLowerCase();
  return { state: { ...state, boardState: next }, changed: true };
}

export function pressBackspace(state: CurrentGameState): KeyResult {
  if (state.gameStatus !== "IN_PROGRESS") return { state, changed: false };
  const current = state.boardState[state.currentRow] ?? "";
  if (!current.length) return { state, changed: false };
  const next = [...state.boardState];
  next[state.currentRow] = current.slice(0, -1);
  return { state: { ...state, boardState: next }, changed: true };
}

export type SubmitError =
  | { kind: "not-enough-letters" }
  | { kind: "not-in-word-list" }
  | { kind: "hard-mode-position"; letter: string; position: number }
  | { kind: "hard-mode-missing"; letter: string };

export interface SubmitResult {
  ok: boolean;
  state: CurrentGameState;
  error?: SubmitError;
  evaluation?: RowEvaluation;
  finalStatus?: GameStatus;
  guessNumber?: number;
}

// Validate hard-mode constraints: correct letters must stay in position,
// present letters must be reused somewhere.
export function checkHardMode(state: CurrentGameState, guess: string): SubmitError | null {
  const lower = guess.toLowerCase();
  const requiredPositions = new Map<number, string>();
  const requiredCounts = new Map<string, number>();

  for (let r = 0; r < state.currentRow; r++) {
    const ev = state.evaluations[r];
    const prev = state.boardState[r];
    if (!ev || !prev) continue;
    const counts: Record<string, number> = {};
    for (let i = 0; i < WORD_LENGTH; i++) {
      const ch = prev[i]; const st = ev[i];
      if (!ch || !st) continue;
      if (st === "correct") requiredPositions.set(i, ch);
      else if (st === "present") counts[ch] = (counts[ch] ?? 0) + 1;
    }
    for (const [letter, n] of Object.entries(counts)) {
      if (n > (requiredCounts.get(letter) ?? 0)) requiredCounts.set(letter, n);
    }
  }

  for (const [pos, letter] of requiredPositions) {
    if (lower[pos] !== letter) return { kind: "hard-mode-position", letter, position: pos };
  }
  for (const [letter, needed] of requiredCounts) {
    const count = [...lower].filter((c) => c === letter).length;
    if (count < needed) return { kind: "hard-mode-missing", letter };
  }
  return null;
}

export function submitGuess(
  state: CurrentGameState,
  answer: string,
  isAccepted: (word: string) => boolean,
): SubmitResult {
  if (state.gameStatus !== "IN_PROGRESS") return { ok: false, state };

  const row = state.currentRow;
  const guess = (state.boardState[row] ?? "").toLowerCase();

  if (guess.length < WORD_LENGTH) return { ok: false, state, error: { kind: "not-enough-letters" } };
  if (!isAccepted(guess)) return { ok: false, state, error: { kind: "not-in-word-list" } };
  if (state.hardMode) {
    const err = checkHardMode(state, guess);
    if (err) return { ok: false, state, error: err };
  }

  const evaluation = evaluateGuess(guess, answer);
  const newEvaluations = [...state.evaluations];
  newEvaluations[row] = evaluation;

  const won = isWinningRow(evaluation);
  const finalStatus: GameStatus = won ? "WIN" : row === MAX_GUESSES - 1 ? "LOSE" : "IN_PROGRESS";

  return {
    ok: true,
    state: { ...state, evaluations: newEvaluations, currentRow: row + 1, gameStatus: finalStatus },
    evaluation,
    finalStatus,
    guessNumber: row + 1,
  };
}

export function winMessageFor(guessNumber: number): string {
  return ["Genius!", "Magnificent!", "Impressive!", "Splendid!", "Great!", "Phew!"][guessNumber - 1] ?? "Well done!";
}
