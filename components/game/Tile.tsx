"use client";

import type { TileState } from "@/types";
import { cn } from "@/lib/utils";

interface TileProps {
  letter: string;
  state: TileState;
  /** 0-indexed within the row, used to stagger flip animations. */
  index: number;
  /** True while this tile's row is in the flip-animation phase. */
  flipping: boolean;
  /** True while this tile's row is in the win-bounce phase. */
  bouncing: boolean;
  /** ARIA: 1-indexed row number. */
  rowNumber: number;
}

/** A single board tile. State-driven via data attributes; CSS handles all visuals. */
export function Tile({ letter, state, index, flipping, bouncing, rowNumber }: TileProps) {
  const flipStyle = flipping
    ? { animationDelay: `${index * 250}ms` }
    : bouncing
    ? { animationDelay: `${index * 100}ms` }
    : undefined;

  // While the flip is mid-rotation we still want the *post-flip* state to be
  // applied at the half-way point. CSS's tile-flip animation rotates the tile
  // and our `data-state` already contains the future state — that's exactly
  // when the colour should change. We rely on the keyframe's transform to
  // mask the change; nothing more is needed here.

  const ariaState =
    state === "correct"
      ? "correct"
      : state === "present"
      ? "present"
      : state === "absent"
      ? "absent"
      : "empty";

  return (
    <div
      className={cn("tile")}
      data-state={state}
      data-flipping={flipping ? "true" : undefined}
      data-bounce={bouncing ? "true" : undefined}
      role="img"
      aria-label={
        letter
          ? `Row ${rowNumber}, Tile ${index + 1}: ${letter.toUpperCase()}, ${ariaState}`
          : `Row ${rowNumber}, Tile ${index + 1}: empty`
      }
      style={flipStyle}
    >
      {letter ? letter.toUpperCase() : ""}
    </div>
  );
}
