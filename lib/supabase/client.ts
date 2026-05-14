"use client";

import { createBrowserClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Browser-side Supabase client. Lazily created the first time it is used. */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error(
      "Supabase environment variables are not set. " +
        "Define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }
  client = createBrowserClient(url, anon, {
    cookieOptions: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    } satisfies CookieOptions,
  });
  return client;
}

/** Returns true if Supabase env is configured (used to gate UI). */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
