"use client";

import { useEffect } from "react";

interface UseKeyboardArgs {
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  enabled: boolean;
}

export function useKeyboard({ onLetter, onBackspace, onEnter, enabled }: UseKeyboardArgs): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") { e.preventDefault(); onEnter(); }
      else if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); onBackspace(); }
      else if (/^[a-zA-Z]$/.test(e.key)) onLetter(e.key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, onLetter, onBackspace, onEnter]);
}
