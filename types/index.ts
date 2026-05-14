// Shared application types. Keep this file dependency-free so it can be
// imported from anywhere — server, client, edge routes, tests.

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

export type TileState = "empty" | "tbd" | "absent" | "present" | "correct";
export type GameStatus = "IN_PROGRESS" | "WIN" | "LOSE";
export type ThemePreference = "dark" | "light" | "system";
export type RowEvaluation = TileState[];
export type SyncState = "idle" | "syncing" | "synced" | "error" | "offline";

export interface GuessDistribution {
  "1": number;
  "2": number;
  "3": number;
  "4": number;
  "5": number;
  "6": number;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: GuessDistribution;
  lastCompletedDate: string | null;
  lastWonDate: string | null;
}

export interface CurrentGameState {
  date: string;
  dayOffset: number;
  /** One string per row, length always === MAX_GUESSES, padded with "" for unused rows. */
  boardState: string[];
  /** Same length as boardState; null for rows that have not been submitted. */
  evaluations: (RowEvaluation | null)[];
  currentRow: number;
  gameStatus: GameStatus;
  hardMode: boolean;
}

export interface ToastMessage {
  id: string;
  text: string;
  durationMs: number;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}
