import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { profileFromAuthUser } from "@/lib/supabase/profile";
import {
  getGameStateForDate,
  getUserStats,
  upsertGameState,
  upsertProfile,
  upsertUserStats,
} from "@/lib/db/queries";
import { utcDateKey } from "@/lib/game/words";
import type { CurrentGameState, PlayerStats } from "@/types";

type SyncRequest =
  | { action: "push"; currentGame: CurrentGameState; stats: PlayerStats }
  | { action: "pull" };

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }

  let body: SyncRequest;
  try {
    body = (await request.json()) as SyncRequest;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Mirror auth.users into public.profiles so foreign-key references resolve.
  await upsertProfile(profileFromAuthUser(auth.user));

  if (body.action === "pull") {
    const [game, stats] = await Promise.all([
      getGameStateForDate(auth.user.id, utcDateKey()),
      getUserStats(auth.user.id),
    ]);
    return NextResponse.json({ currentGame: game, stats });
  }

  if (body.action === "push") {
    const { currentGame, stats } = body;
    if (!currentGame || !stats) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    // Conflict resolution: if the server already has a finished game for
    // this date, keep it unless the local copy is also finished.
    const serverGame = await getGameStateForDate(auth.user.id, currentGame.date);
    const serverDone = serverGame && serverGame.gameStatus !== "IN_PROGRESS";
    const localDone = currentGame.gameStatus !== "IN_PROGRESS";

    if (!serverDone || localDone) await upsertGameState(auth.user.id, currentGame);
    await upsertUserStats(auth.user.id, stats);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
