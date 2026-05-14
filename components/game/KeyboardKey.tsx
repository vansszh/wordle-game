"use client";

import type { ReactNode } from "react";
import type { TileState } from "@/types";
import { cn } from "@/lib/utils";

interface KeyboardKeyProps {
  /** Visible label on the key. */
  label: string | ReactNode;
  /** ARIA label for icon-only keys. */
  ariaLabel?: string;
  /** Pass-through state from derived keyboard map (correct > present > absent). */
  state?: TileState;
  /** True for ENTER and Backspace keys. */
  wide?: boolean;
  onClick: () => void;
}

export function KeyboardKey({ label, ariaLabel, state, wide, onClick }: KeyboardKeyProps) {
  const handle = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(20);
      } catch {
        /* ignore */
      }
    }
    onClick();
  };

  return (
    <button
      type="button"
      className={cn("key")}
      data-state={state && state !== "empty" && state !== "tbd" ? state : undefined}
      data-wide={wide ? "true" : undefined}
      aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
      onClick={handle}
    >
      {label}
    </button>
  );
}
