"use client";

import { Tile } from "./Tile";
import type { RowEvaluation, TileState } from "@/types";
import { WORD_LENGTH } from "@/types";

interface RowProps {
  /** 0-indexed row position within the board. */
  rowIndex: number;
  /** Letters typed so far (0..WORD_LENGTH chars). */
  guess: string;
  /** Submitted evaluation; null while the row is still in progress. */
  evaluation: RowEvaluation | null;
  /** True when this row is mid flip animation. */
  flipping: boolean;
  /** True when this row should bounce (winning row). */
  bouncing: boolean;
  /** True for a one-shot shake animation. */
  shake: boolean;
}

export function Row({ rowIndex, guess, evaluation, flipping, bouncing, shake }: RowProps) {
  const tiles: { letter: string; state: TileState }[] = Array.from({ length: WORD_LENGTH }, (_, i) => {
    const letter = guess[i] ?? "";
    if (evaluation) {
      // submitted row
      const s = evaluation[i] ?? "absent";
      return { letter, state: s };
    }
    return { letter, state: letter ? "tbd" : "empty" };
  });

  return (
    <div className="board-row" data-shake={shake ? "true" : undefined} role="row">
      {tiles.map((t, i) => (
        <Tile
          key={i}
          letter={t.letter}
          state={t.state}
          index={i}
          flipping={flipping}
          bouncing={bouncing}
          rowNumber={rowIndex + 1}
        />
      ))}
    </div>
  );
}
