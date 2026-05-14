import { and, eq } from "drizzle-orm";
import { getDb } from "./client";
import { gameStates, profiles, userStats } from "./schema";
import type {
  CurrentGameState,
  PlayerStats,
  RowEvaluation,
  GameStatus,
  GuessDistribution,
} from "@/types";

/* -------------------------------------------------------------------------- */
/* Profiles                                                                    */
/* -------------------------------------------------------------------------- */

export async function upsertProfile(args: {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}): Promise<void> {
  const db = getDb();
  await db
    .insert(profiles)
    .values({
      id: args.id,
      email: args.email,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        email: args.email,
        displayName: args.displayName,
        avatarUrl: args.avatarUrl,
        updatedAt: new Date(),
      },
    });
}

/* -------------------------------------------------------------------------- */
/* Game state                                                                  */
/* -------------------------------------------------------------------------- */

export async function upsertGameState(userId: string, game: CurrentGameState): Promise<void> {
  const db = getDb();
  const numGuesses = game.evaluations.filter((e) => e !== null).length;
  await db
    .insert(gameStates)
    .values({
      userId,
      date: game.date,
      boardState: game.boardState,
      evaluations: game.evaluations,
      gameStatus: game.gameStatus,
      hardMode: game.hardMode,
      dayOffset: game.dayOffset,
      numGuesses,
    })
    .onConflictDoUpdate({
      target: [gameStates.userId, gameStates.date],
      set: {
        boardState: game.boardState,
        evaluations: game.evaluations,
        gameStatus: game.gameStatus,
        hardMode: game.hardMode,
        dayOffset: game.dayOffset,
        numGuesses,
        updatedAt: new Date(),
      },
    });
}

export async function getGameStateForDate(
  userId: string,
  dateKey: string,
): Promise<CurrentGameState | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(gameStates)
    .where(and(eq(gameStates.userId, userId), eq(gameStates.date, dateKey)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const board = (row.boardState as string[]) ?? [];
  const evals = (row.evaluations as (RowEvaluation | null)[]) ?? [];
  return {
    date: row.date,
    dayOffset: row.dayOffset,
    boardState: board,
    evaluations: evals,
    currentRow: evals.filter((e) => e !== null).length,
    gameStatus: row.gameStatus as GameStatus,
    hardMode: row.hardMode,
  };
}

/* -------------------------------------------------------------------------- */
/* User stats                                                                  */
/* -------------------------------------------------------------------------- */

export async function upsertUserStats(userId: string, stats: PlayerStats): Promise<void> {
  const db = getDb();
  await db
    .insert(userStats)
    .values({
      userId,
      gamesPlayed: stats.gamesPlayed,
      gamesWon: stats.gamesWon,
      currentStreak: stats.currentStreak,
      maxStreak: stats.maxStreak,
      guessDistribution: stats.guessDistribution,
      lastCompletedDate: stats.lastCompletedDate,
      lastWonDate: stats.lastWonDate,
    })
    .onConflictDoUpdate({
      target: userStats.userId,
      set: {
        gamesPlayed: stats.gamesPlayed,
        gamesWon: stats.gamesWon,
        currentStreak: stats.currentStreak,
        maxStreak: stats.maxStreak,
        guessDistribution: stats.guessDistribution,
        lastCompletedDate: stats.lastCompletedDate,
        lastWonDate: stats.lastWonDate,
        updatedAt: new Date(),
      },
    });
}

export async function getUserStats(userId: string): Promise<PlayerStats | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    gamesPlayed: row.gamesPlayed,
    gamesWon: row.gamesWon,
    currentStreak: row.currentStreak,
    maxStreak: row.maxStreak,
    guessDistribution: row.guessDistribution as GuessDistribution,
    lastCompletedDate: row.lastCompletedDate,
    lastWonDate: row.lastWonDate,
  };
}
