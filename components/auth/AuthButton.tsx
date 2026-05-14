"use client";

import { LogIn, LogOut, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useSync } from "@/hooks/useSync";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface AuthButtonProps {
  fullWidth?: boolean;
}

export function AuthButton({ fullWidth = false }: AuthButtonProps) {
  const { user, signInWithGoogle, signOut, state } = useSync();

  if (!isSupabaseConfigured()) {
    return (
      <p className="text-xs text-[var(--c-text-secondary)]">
        Sign-in is disabled — Supabase is not configured. The game continues to work locally.
      </p>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        className={cn(
          "inline-flex items-center justify-center gap-3 rounded-md border border-[var(--c-border-subtle)] bg-[var(--c-bg-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--c-text-primary)] transition-colors hover:bg-[var(--c-bg-surface)]",
          fullWidth ? "w-full" : "",
        )}
      >
        <LogIn size={16} aria-hidden="true" />
        Sign in with Google
      </button>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", fullWidth ? "w-full" : "")}>
      <div className="flex flex-1 items-center gap-3 overflow-hidden">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--c-accent)] text-sm font-bold text-white"
            aria-hidden="true"
          >
            {(user.displayName ?? user.email)[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-[var(--c-text-primary)]">
            {user.displayName ?? user.email}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-[var(--c-text-secondary)]">
            <CheckCircle2 size={11} aria-hidden="true" /> Sync {state === "syncing" ? "…" : "enabled"}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void signOut()}
        aria-label="Sign out"
        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--c-border-subtle)] px-2.5 py-1.5 text-xs font-medium text-[var(--c-text-secondary)] transition-colors hover:bg-[var(--c-bg-surface)]"
      >
        <LogOut size={12} aria-hidden="true" /> Sign out
      </button>
    </div>
  );
}
