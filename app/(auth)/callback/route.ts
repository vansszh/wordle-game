import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { profileFromAuthUser } from "@/lib/supabase/profile";
import { upsertProfile } from "@/lib/db/queries";

// Exchange the OAuth `code` for a session, then mirror the profile into our DB.
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (!code) return NextResponse.redirect(new URL("/login?error=missing_code", url));

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.user) {
    console.error("[callback] exchange failed", error);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", url));
  }

  // Best-effort — don't block sign-in if the DB call fails.
  if (process.env.DATABASE_URL) {
    try {
      await upsertProfile(profileFromAuthUser(data.user));
    } catch (e) {
      console.error("[callback] profile upsert failed", e);
    }
  }

  return NextResponse.redirect(new URL(next, url));
}
