"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import type { SyncState, UserProfile } from "@/types";

interface SyncApi {
  user: UserProfile | null;
  state: SyncState;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  pushNow: () => Promise<void>;
}

const SYNC_INTERVAL_MS = 5 * 60 * 1000;
const DEBOUNCE_MS = 1000;

/**
 * Wires Supabase auth to the game store: pulls server snapshot on sign-in,
 * pushes local changes on game completion / debounced after each guess,
 * runs a background sync every 5 minutes while the tab is visible.
 *
 * If Supabase is not configured, this hook becomes a no-op so the app keeps
 * working purely from localStorage.
 */
export function useSync(): SyncApi {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [state, setState] = useState<SyncState>(
    isSupabaseConfigured() ? "idle" : "offline",
  );
  const debouncedTimer = useRef<number | null>(null);

  const game = useGameStore();

  const callApi = useCallback(
    async (path: string, body: unknown): Promise<Response> => {
      return fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    [],
  );

  const pushNow = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    const { data } = await sb.auth.getUser();
    if (!data?.user) return;

    setState("syncing");
    try {
      const res = await callApi("/api/sync", {
        action: "push",
        currentGame: useGameStore.getState().current,
        stats: useGameStore.getState().stats,
      });
      if (!res.ok) throw new Error(`push failed: ${res.status}`);
      useGameStore.getState().setLastSynced(new Date().toISOString());
      setState("synced");
      window.setTimeout(() => setState("idle"), 1500);
    } catch (e) {
      console.error("[sync] push", e);
      setState("error");
    }
  }, [callApi]);

  const pull = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    const { data } = await sb.auth.getUser();
    if (!data?.user) return;

    setState("syncing");
    try {
      const res = await callApi("/api/sync", { action: "pull" });
      if (!res.ok) throw new Error(`pull failed: ${res.status}`);
      const json = (await res.json()) as {
        currentGame?: typeof useGameStore.getState extends () => infer S
          ? S extends { current: infer C }
            ? C
            : never
          : never;
        stats?: typeof useGameStore.getState extends () => infer S
          ? S extends { stats: infer S2 }
            ? S2
            : never
          : never;
      };
      useGameStore.getState().applyServerSnapshot({
        current: json.currentGame ?? undefined,
        stats: json.stats ?? undefined,
      });
      useGameStore.getState().setLastSynced(new Date().toISOString());
      setState("synced");
      window.setTimeout(() => setState("idle"), 1500);
    } catch (e) {
      console.error("[sync] pull", e);
      setState("error");
    }
  }, [callApi]);

  // Watch auth state, expose UserProfile.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    let active = true;

    const refresh = async () => {
      const { data } = await sb.auth.getUser();
      if (!active) return;
      const u = data?.user ?? null;
      setUser(
        u
          ? {
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
            }
          : null,
      );
    };

    void refresh();
    const sub = sb.auth.onAuthStateChange((_event) => {
      void refresh();
      if (_event === "SIGNED_IN") void pull();
    });
    return () => {
      active = false;
      sub.data.subscription.unsubscribe();
    };
  }, [pull]);

  // Debounced push after each board change (only if a user is signed in).
  const currentSerialized = JSON.stringify(game.current);
  useEffect(() => {
    if (!user) return;
    if (debouncedTimer.current) window.clearTimeout(debouncedTimer.current);
    debouncedTimer.current = window.setTimeout(() => {
      void pushNow();
    }, DEBOUNCE_MS);
    return () => {
      if (debouncedTimer.current) window.clearTimeout(debouncedTimer.current);
    };
  }, [currentSerialized, user, pushNow]);

  // Immediate push on completion.
  useEffect(() => {
    if (!user) return;
    if (game.current.gameStatus !== "IN_PROGRESS") {
      void pushNow();
    }
  }, [game.current.gameStatus, user, pushNow]);

  // Background sync every 5 minutes while visible.
  useEffect(() => {
    if (!user) return;
    const tick = () => {
      if (document.visibilityState === "visible") void pushNow();
    };
    const id = window.setInterval(tick, SYNC_INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [user, pushNow]);

  // Online/offline indicator.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const setOn = () => setState((s) => (s === "offline" ? "idle" : s));
    const setOff = () => setState("offline");
    window.addEventListener("online", setOn);
    window.addEventListener("offline", setOff);
    if (!navigator.onLine) setState("offline");
    return () => {
      window.removeEventListener("online", setOn);
      window.removeEventListener("offline", setOff);
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL ?? "";
    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/callback` },
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    await sb.auth.signOut();
    setUser(null);
    setState("idle");
  }, []);

  return { user, state, signInWithGoogle, signOut, pushNow };
}
