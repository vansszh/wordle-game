"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { CurrentGameState, PlayerStats, SyncState, UserProfile } from "@/types";

interface SyncApi {
  user: UserProfile | null;
  state: SyncState;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  pushNow: () => Promise<void>;
}

const SYNC_INTERVAL_MS = 5 * 60 * 1000;
const DEBOUNCE_MS = 1000;

export function useSync(): SyncApi {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [state, setState] = useState<SyncState>(isSupabaseConfigured() ? "idle" : "offline");
  const debounceTimer = useRef<number | null>(null);
  const game = useGameStore();

  const callApi = useCallback(async (body: unknown) => {
    return fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }, []);

  const pushNow = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    const { data } = await getSupabaseBrowserClient().auth.getUser();
    if (!data?.user) return;
    setState("syncing");
    try {
      const res = await callApi({
        action: "push",
        currentGame: useGameStore.getState().current,
        stats: useGameStore.getState().stats,
      });
      if (!res.ok) throw new Error(`${res.status}`);
      useGameStore.getState().setLastSynced(new Date().toISOString());
      setState("synced");
      window.setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("error");
    }
  }, [callApi]);

  const pull = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    const { data } = await getSupabaseBrowserClient().auth.getUser();
    if (!data?.user) return;
    setState("syncing");
    try {
      const res = await callApi({ action: "pull" });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = (await res.json()) as { currentGame?: CurrentGameState; stats?: PlayerStats };
      useGameStore.getState().applyServerSnapshot({
        current: json.currentGame ?? undefined,
        stats: json.stats ?? undefined,
      });
      useGameStore.getState().setLastSynced(new Date().toISOString());
      setState("synced");
      window.setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("error");
    }
  }, [callApi]);

  // Watch auth state.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    let active = true;

    const refresh = async () => {
      const { data } = await sb.auth.getUser();
      if (!active) return;
      const u = data?.user ?? null;
      setUser(u ? {
        id: u.id,
        email: u.email ?? "",
        displayName: (u.user_metadata?.["full_name"] ?? u.user_metadata?.["name"] ?? null) as string | null,
        avatarUrl: (u.user_metadata?.["avatar_url"] ?? u.user_metadata?.["picture"] ?? null) as string | null,
      } : null);
    };

    void refresh();
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      void refresh();
      if (event === "SIGNED_IN") void pull();
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [pull]);

  // Debounced push after each board change.
  const serialized = JSON.stringify(game.current);
  useEffect(() => {
    if (!user) return;
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => void pushNow(), DEBOUNCE_MS);
    return () => { if (debounceTimer.current) window.clearTimeout(debounceTimer.current); };
  }, [serialized, user, pushNow]);

  // Immediate push on game completion.
  useEffect(() => {
    if (user && game.current.gameStatus !== "IN_PROGRESS") void pushNow();
  }, [game.current.gameStatus, user, pushNow]);

  // Background sync every 5 minutes while tab is visible.
  useEffect(() => {
    if (!user) return;
    const tick = () => { if (document.visibilityState === "visible") void pushNow(); };
    const id = window.setInterval(tick, SYNC_INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [user, pushNow]);

  // Online/offline indicator.
  useEffect(() => {
    const on = () => setState((s) => s === "offline" ? "idle" : s);
    const off = () => setState("offline");
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    if (!navigator.onLine) setState("offline");
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    const origin = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL ?? "";
    await getSupabaseBrowserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/callback` },
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    await getSupabaseBrowserClient().auth.signOut();
    setUser(null);
    setState("idle");
  }, []);

  return { user, state, signInWithGoogle, signOut, pushNow };
}
