"use client";

import { useMemo } from "react";
import { Delete } from "lucide-react";
import { KeyboardKey } from "./KeyboardKey";
import { useGameStore } from "@/store/gameStore";
import { deriveKeyboardState } from "@/lib/game/evaluator";

const ROW_1 = "qwertyuiop".split("");
const ROW_2 = "asdfghjkl".split("");
const ROW_3 = "zxcvbnm".split("");

interface KeyboardProps {
  onLetter: (letter: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
}

export function Keyboard({ onLetter, onEnter, onBackspace }: KeyboardProps) {
  const guesses = useGameStore((s) => s.current.boardState);
  const evaluations = useGameStore((s) => s.current.evaluations);

  const keyMap = useMemo(
    () => deriveKeyboardState(guesses, evaluations),
    [guesses, evaluations],
  );

  return (
    <div className="keyboard" role="group" aria-label="On-screen keyboard">
      <div className="keyboard-row">
        {ROW_1.map((l) => (
          <KeyboardKey key={l} label={l} state={keyMap.get(l)} onClick={() => onLetter(l)} />
        ))}
      </div>
      <div className="keyboard-row">
        <span style={{ flex: 0.5 }} aria-hidden="true" />
        {ROW_2.map((l) => (
          <KeyboardKey key={l} label={l} state={keyMap.get(l)} onClick={() => onLetter(l)} />
        ))}
        <span style={{ flex: 0.5 }} aria-hidden="true" />
      </div>
      <div className="keyboard-row">
        <KeyboardKey label="Enter" wide onClick={onEnter} />
        {ROW_3.map((l) => (
          <KeyboardKey key={l} label={l} state={keyMap.get(l)} onClick={() => onLetter(l)} />
        ))}
        <KeyboardKey
          label={<Delete size={20} aria-hidden="true" />}
          ariaLabel="Backspace"
          wide
          onClick={onBackspace}
        />
      </div>
    </div>
  );
}
