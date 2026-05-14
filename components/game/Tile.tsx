"use client";

import type { TileState } from "@/types";

interface TileProps {
  letter: string;
  state: TileState;
  index: number;
  flipping: boolean;
  bouncing: boolean;
  rowNumber: number;
}

// State-driven via data attributes — all visuals live in globals.css.
export function Tile({ letter, state, index, flipping, bouncing, rowNumber }: TileProps) {
  const animationDelay = flipping
    ? `${index * 250}ms`
    : bouncing
      ? `${index * 100}ms`
      : undefined;

  const ariaState = state === "tbd" ? "empty" : state;
  const label = letter
    ? `Row ${rowNumber}, Tile ${index + 1}: ${letter.toUpperCase()}, ${ariaState}`
    : `Row ${rowNumber}, Tile ${index + 1}: empty`;

  return (
    <div
      className="tile"
      data-state={state}
      data-flipping={flipping ? "true" : undefined}
      data-bounce={bouncing ? "true" : undefined}
      role="img"
      aria-label={label}
      style={animationDelay ? { animationDelay } : undefined}
    >
      {letter ? letter.toUpperCase() : ""}
    </div>
  );
}
