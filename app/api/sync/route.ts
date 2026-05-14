import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getGameStateForDate,
  getUserStats,
  upsertGameState,
  upsertProfile,
  upsertUserStats,
} from "@/lib/db/queries";
import { utcDateKey } from "@/lib/game/words";
import type { CurrentGameState, PlayerStats } from "@/types";

interface PushRequest {
  action: "push";
  currentGame: CurrentGameState;
  stats: PlayerStats;
}

interface PullRequest {
  action: "pull";
}

type SyncRequest = PushRequest | PullRequest;

export const runtime = "nodejs";

async function requireUser() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

export async function POST(request: Request): Promise<Response> {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured on the server." },
      { status: 503 },
    );
  }

  let body: SyncRequest;
  try {
    body = (await request.json()) as SyncRequest;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Best-effort profile sync (idempotent).
  await upsertProfile({
    id: user.id,
    email: user.email ?? "",
    displayName:
      (user.user_metadata?.["full_name"] as string | undefined) ??
      (user.user_metadata?.["name"] as string | undefined) ??
      null,
    avatarUrl:
      (user.user_metadata?.["avatar_url"] as string | undefined) ??
      (user.user_metadata?.["picture"] as string | undefined) ??
      null,
  });

  if (body.action === "pull") {
    const today = utcDateKey();
    const [game, stats] = await Promise.all([
      getGameStateForDate(user.id, today),
      getUserStats(user.id),
    ]);
    return NextResponse.json({ currentGame: game, stats });
  }

  if (body.action === "push") {
    const { currentGame, stats } = body;
    if (!currentGame || !stats) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    // Conflict resolution: if the server already has a completed game for
    // today, keep the server version. Otherwise upsert local.
    const serverGame = await getGameStateForDate(user.id, currentGame.date);
    const serverIsComplete =
      serverGame && (serverGame.gameStatus === "WIN" || serverGame.gameStatus === "LOSE");
    const localIsComplete =
      currentGame.gameStatus === "WIN" || currentGame.gameStatus === "LOSE";

    if (!serverIsComplete || localIsComplete) {
      await upsertGameState(user.id, currentGame);
    }
    await upsertUserStats(user.id, stats);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
