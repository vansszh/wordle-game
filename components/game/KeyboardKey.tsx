"use client";

import type { ReactNode } from "react";
import type { TileState } from "@/types";

interface KeyboardKeyProps {
  label: string | ReactNode;
  ariaLabel?: string;
  state?: TileState;
  wide?: boolean;
  onClick: () => void;
}

export function KeyboardKey({ label, ariaLabel, state, wide, onClick }: KeyboardKeyProps) {
  const handleClick = () => {
    try { navigator.vibrate?.(20); } catch { /* unsupported */ }
    onClick();
  };

  return (
    <button
      type="button"
      className="key"
      data-state={state && state !== "empty" && state !== "tbd" ? state : undefined}
      data-wide={wide ? "true" : undefined}
      aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
      onClick={handleClick}
    >
      {label}
    </button>
  );
}
