"use client";

import { Cloud, CloudOff, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useSync } from "@/hooks/useSync";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Header badge showing sync state. When signed-out, shows a subtle cloud icon.
 * When signed-in, shows the user avatar plus a small status icon.
 */
export function UserMenu() {
  const { user, state } = useSync();

  if (!isSupabaseConfigured()) return null;

  if (!user) {
    return (
      <span
        title="Not signed in — local play only"
        aria-label="Not signed in"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--c-text-secondary)]"
      >
        <CloudOff size={20} aria-hidden="true" />
      </span>
    );
  }

  return (
    <span
      className="relative inline-flex h-9 w-9 items-center justify-center"
      title={`Signed in as ${user.displayName ?? user.email}`}
      aria-label={`Signed in as ${user.displayName ?? user.email}`}
    >
      {user.avatarUrl ? (
        <Image
          src={user.avatarUrl}
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 rounded-full object-cover"
        />
      ) : (
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--c-accent)] text-xs font-bold text-white"
          aria-hidden="true"
        >
          {(user.displayName ?? user.email)[0]?.toUpperCase()}
        </div>
      )}
      <span
        className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--c-bg-primary)] text-[var(--c-text-secondary)]"
        aria-hidden="true"
      >
        {state === "syncing" ? (
          <Loader2 size={10} className="animate-spin" />
        ) : state === "error" ? (
          <AlertCircle size={10} className="text-red-500" />
        ) : state === "offline" ? (
          <CloudOff size={10} />
        ) : (
          <Cloud size={10} />
        )}
      </span>
    </span>
  );
}
