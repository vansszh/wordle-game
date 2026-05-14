import { and, eq } from "drizzle-orm";
import { getDb } from "./client";
import { gameStates, profiles, userStats } from "./schema";
import type {
  CurrentGameState,
  GameStatus,
  GuessDistribution,
  PlayerStats,
  RowEvaluation,
} from "@/types";

interface ProfileInput {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export async function upsertProfile(args: ProfileInput): Promise<void> {
  const db = getDb();
  await db
    .insert(profiles)
    .values(args)
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

export async function upsertGameState(userId: string, game: CurrentGameState): Promise<void> {
  const db = getDb();
  const numGuesses = game.evaluations.filter((e) => e !== null).length;
  const payload = {
    userId,
    date: game.date,
    boardState: game.boardState,
    evaluations: game.evaluations,
    gameStatus: game.gameStatus,
    hardMode: game.hardMode,
    dayOffset: game.dayOffset,
    numGuesses,
  };
  await db
    .insert(gameStates)
    .values(payload)
    .onConflictDoUpdate({
      target: [gameStates.userId, gameStates.date],
      set: { ...payload, updatedAt: new Date() },
    });
}

export async function getGameStateForDate(
  userId: string,
  dateKey: string,
): Promise<CurrentGameState | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(gameStates)
    .where(and(eq(gameStates.userId, userId), eq(gameStates.date, dateKey)))
    .limit(1);
  if (!row) return null;

  const evals = (row.evaluations as (RowEvaluation | null)[]) ?? [];
  return {
    date: row.date,
    dayOffset: row.dayOffset,
    boardState: (row.boardState as string[]) ?? [],
    evaluations: evals,
    currentRow: evals.filter((e) => e !== null).length,
    gameStatus: row.gameStatus as GameStatus,
    hardMode: row.hardMode,
  };
}

export async function upsertUserStats(userId: string, stats: PlayerStats): Promise<void> {
  const db = getDb();
  await db
    .insert(userStats)
    .values({ userId, ...stats })
    .onConflictDoUpdate({
      target: userStats.userId,
      set: { ...stats, updatedAt: new Date() },
    });
}

export async function getUserStats(userId: string): Promise<PlayerStats | null> {
  const db = getDb();
  const [row] = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);
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
