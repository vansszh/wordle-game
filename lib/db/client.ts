import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

// Server-only. Do not import from client components.
export function getDb() {
  if (db) return db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it to .env.local.");
  db = drizzle(postgres(url, { prepare: false, max: 1, idle_timeout: 20 }), { schema });
  return db;
}
