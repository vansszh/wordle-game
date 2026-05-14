"use client";

import { Tile } from "./Tile";
import type { RowEvaluation, TileState } from "@/types";
import { WORD_LENGTH } from "@/types";

interface RowProps {
  rowIndex: number;
  guess: string;
  evaluation: RowEvaluation | null;
  flipping: boolean;
  bouncing: boolean;
  shake: boolean;
}

export function Row({ rowIndex, guess, evaluation, flipping, bouncing, shake }: RowProps) {
  return (
    <div className="board-row" data-shake={shake ? "true" : undefined} role="row">
      {Array.from({ length: WORD_LENGTH }, (_, i) => {
        const letter = guess[i] ?? "";
        const state: TileState = evaluation
          ? (evaluation[i] ?? "absent")
          : letter
            ? "tbd"
            : "empty";
        return (
          <Tile
            key={i}
            letter={letter}
            state={state}
            index={i}
            flipping={flipping}
            bouncing={bouncing}
            rowNumber={rowIndex + 1}
          />
        );
      })}
    </div>
  );
}
