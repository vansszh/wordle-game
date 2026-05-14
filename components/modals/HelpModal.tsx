"use client";

import type { ReactNode } from "react";
import { Modal } from "./Modal";
import type { TileState } from "@/types";

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

interface ExampleProps {
  word: string;
  highlightIndex: number;
  highlightState: TileState;
  caption: ReactNode;
}

function Example({ word, highlightIndex, highlightState, caption }: ExampleProps) {
  return (
    <div className="my-3 space-y-2">
      <div className="flex gap-1.5">
        {word.split("").map((c, i) => (
          <div
            key={i}
            className="inline-flex h-12 w-12 items-center justify-center font-mono text-xl font-bold"
            style={{
              border:
                i === highlightIndex
                  ? "2px solid transparent"
                  : "2px solid var(--c-border-subtle)",
              backgroundColor:
                i === highlightIndex ? `var(--c-tile-${highlightState})` : "transparent",
              color:
                i === highlightIndex
                  ? "var(--c-tile-revealed-text)"
                  : "var(--c-text-primary)",
              aspectRatio: "1 / 1",
            }}
          >
            {c.toUpperCase()}
          </div>
        ))}
      </div>
      <p className="text-sm text-[var(--c-text-primary)]">{caption}</p>
    </div>
  );
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="How To Play" description="Guess the Wordle in 6 tries.">
      <ul className="ml-5 list-disc space-y-1 text-sm">
        <li>Each guess must be a valid 5-letter word.</li>
        <li>The color of the tiles will change to show how close your guess was to the word.</li>
      </ul>

      <hr className="my-4 border-t border-[var(--c-border-subtle)]" />

      <p className="text-sm font-bold uppercase tracking-wider">Examples</p>

      <Example
        word="WEARY"
        highlightIndex={0}
        highlightState="correct"
        caption={
          <>
            <strong>W</strong> is in the word and in the correct spot.
          </>
        }
      />
      <Example
        word="PILLS"
        highlightIndex={1}
        highlightState="present"
        caption={
          <>
            <strong>I</strong> is in the word but in the wrong spot.
          </>
        }
      />
      <Example
        word="VAGUE"
        highlightIndex={3}
        highlightState="absent"
        caption={
          <>
            <strong>U</strong> is not in the word in any spot.
          </>
        }
      />

      <hr className="my-4 border-t border-[var(--c-border-subtle)]" />

      <div>
        <p className="text-sm font-bold uppercase tracking-wider">Hard Mode</p>
        <p className="mt-2 text-sm text-[var(--c-text-secondary)]">
          Any revealed hints must be used in subsequent guesses. Hard Mode can only be enabled
          before any guesses have been made.
        </p>
      </div>

      <p className="mt-4 text-xs italic text-[var(--c-text-muted)]">
        A new puzzle is released daily at midnight UTC.
      </p>
    </Modal>
  );
}
