import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/* profiles — mirrors Supabase auth.users with public-readable display info.   */
/* -------------------------------------------------------------------------- */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* -------------------------------------------------------------------------- */
/* game_states — one row per (user, UTC date).                                 */
/* -------------------------------------------------------------------------- */
export const gameStates = pgTable(
  "game_states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    boardState: jsonb("board_state").notNull().default([]),
    evaluations: jsonb("evaluations").notNull().default([]),
    gameStatus: text("game_status").notNull().default("IN_PROGRESS"),
    hardMode: boolean("hard_mode").default(false).notNull(),
    dayOffset: integer("day_offset").notNull(),
    numGuesses: integer("num_guesses"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userDateUq: uniqueIndex("game_states_user_date_uq").on(t.userId, t.date),
  }),
);

/* -------------------------------------------------------------------------- */
/* user_stats — aggregate stats per user.                                      */
/* -------------------------------------------------------------------------- */
export const userStats = pgTable("user_stats", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  gamesPlayed: integer("games_played").default(0).notNull(),
  gamesWon: integer("games_won").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  maxStreak: integer("max_streak").default(0).notNull(),
  guessDistribution: jsonb("guess_distribution")
    .default({ "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 })
    .notNull(),
  lastCompletedDate: date("last_completed_date"),
  lastWonDate: date("last_won_date"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ProfileRow = typeof profiles.$inferSelect;
export type GameStateRow = typeof gameStates.$inferSelect;
export type UserStatsRow = typeof userStats.$inferSelect;
