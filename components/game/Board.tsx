"use client";

import { Row } from "./Row";
import { useGameStore } from "@/store/gameStore";
import { MAX_GUESSES } from "@/types";

interface BoardProps {
  flippingRow: number | null;
  bouncingRow: number | null;
}

export function Board({ flippingRow, bouncingRow }: BoardProps) {
  const current = useGameStore((s) => s.current);
  const shakeRowId = useGameStore((s) => s.shakeRowId);

  return (
    <div className="board" role="grid" aria-label="Wordle board">
      {Array.from({ length: MAX_GUESSES }, (_, r) => (
        <Row
          key={r}
          rowIndex={r}
          guess={current.boardState[r] ?? ""}
          evaluation={current.evaluations[r] ?? null}
          flipping={flippingRow === r}
          bouncing={bouncingRow === r}
          shake={shakeRowId === r}
        />
      ))}
    </div>
  );
}
