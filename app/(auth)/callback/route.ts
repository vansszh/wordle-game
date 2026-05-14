import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { upsertProfile } from "@/lib/db/queries";

/**
 * OAuth callback handler. Exchanges the `code` returned by Supabase Auth
 * for a session, then ensures the corresponding profile row exists.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url));
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.user) {
    console.error("[callback] exchange failed", error);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", url));
  }

  const u = data.user;

  // Best-effort profile upsert — don't block sign-in if DB is unavailable.
  if (process.env.DATABASE_URL) {
    try {
      await upsertProfile({
        id: u.id,
        email: u.email ?? "",
        displayName:
          (u.user_metadata?.["full_name"] as string | undefined) ??
          (u.user_metadata?.["name"] as string | undefined) ??
          null,
        avatarUrl:
          (u.user_metadata?.["avatar_url"] as string | undefined) ??
          (u.user_metadata?.["picture"] as string | undefined) ??
          null,
      });
    } catch (e) {
      console.error("[callback] profile upsert failed", e);
    }
  }

  return NextResponse.redirect(new URL(next, url));
}
