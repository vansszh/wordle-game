/**
 * Shared application types for the Wordle game.
 *
 * Keep this file dependency-free so it can be imported from any layer
 * (server components, client components, edge routes, tests, etc.).
 */

/** Length of every guess and answer. */
export const WORD_LENGTH = 5;

/** Maximum number of attempts a player gets per puzzle. */
export const MAX_GUESSES = 6;

/** Per-tile evaluation states. */
export type TileState = "empty" | "tbd" | "absent" | "present" | "correct";

/** Possible end-of-game statuses. */
export type GameStatus = "IN_PROGRESS" | "WIN" | "LOSE";

/** Theme preference. */
export type ThemePreference = "dark" | "light" | "system";

/** Per-row evaluation: an array of TileStates of length WORD_LENGTH. */
export type RowEvaluation = TileState[];

/** Distribution of wins by guess count (1..6). */
export interface GuessDistribution {
  "1": number;
  "2": number;
  "3": number;
  "4": number;
  "5": number;
  "6": number;
}

/** Persisted statistics for a single player. */
export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: GuessDistribution;
  /** ISO date (YYYY-MM-DD, UTC) of the last completed game (win or loss). */
  lastCompletedDate: string | null;
  /** ISO date (YYYY-MM-DD, UTC) of the last won game. */
  lastWonDate: string | null;
}

/** Snapshot of a single day's puzzle progress. */
export interface CurrentGameState {
  /** ISO date (YYYY-MM-DD, UTC) the puzzle is for. */
  date: string;
  /** Day index since the puzzle epoch — used to derive the answer. */
  dayOffset: number;
  /** One string per row (length WORD_LENGTH always === MAX_GUESSES, padded with "" for unused rows). */
  boardState: string[];
  /** Same length as boardState; null for rows that have not been submitted. */
  evaluations: (RowEvaluation | null)[];
  /** Current row index the player is typing into (0..MAX_GUESSES). */
  currentRow: number;
  /** Current high-level state of the game. */
  gameStatus: GameStatus;
  /** Whether hard mode was enabled when this game started. */
  hardMode: boolean;
}

/** Full local-storage shape persisted to "wordle-state". */
export interface LocalStateShape {
  currentGame: CurrentGameState;
  stats: PlayerStats;
  preferences: {
    theme: ThemePreference;
    highContrast: boolean;
    hardMode: boolean;
  };
  /** Server sync — null until the client has talked to Supabase. */
  lastSynced: string | null;
}

/** Toast notification. */
export interface ToastMessage {
  id: string;
  text: string;
  /** Auto-dismiss in ms (0 = persistent until manually closed). */
  durationMs: number;
}

/** Authenticated user profile (subset we render in UI). */
export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

/** Sync states for the header indicator. */
export type SyncState = "idle" | "syncing" | "synced" | "error" | "offline";
