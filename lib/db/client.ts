import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _sql: ReturnType<typeof postgres> | null = null;

/**
 * Lazily-instantiated Drizzle client. Server-only — do not import from a
 * client component.
 */
export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local.");
  }
  _sql = postgres(url, {
    prepare: false,
    max: 1,
    idle_timeout: 20,
  });
  _db = drizzle(_sql, { schema });
  return _db;
}
