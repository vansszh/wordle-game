"use client";

import { useEffect } from "react";

interface UseKeyboardArgs {
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  /** Disable when modals are open. */
  enabled: boolean;
}

/** Wire physical keyboard events to the game. */
export function useKeyboard({ onLetter, onBackspace, onEnter, enabled }: UseKeyboardArgs): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key;
      if (key === "Enter") {
        e.preventDefault();
        onEnter();
        return;
      }
      if (key === "Backspace" || key === "Delete") {
        e.preventDefault();
        onBackspace();
        return;
      }
      if (/^[a-zA-Z]$/.test(key)) {
        onLetter(key);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, onLetter, onBackspace, onEnter]);
}
