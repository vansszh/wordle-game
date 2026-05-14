"use client";

import { useEffect, useRef } from "react";
import { Board } from "./Board";
import { Keyboard } from "./Keyboard";
import { GameResult } from "./GameResult";
import { useNavbar } from "@/components/layout/Navbar";
import { Toast } from "@/components/layout/Toast";
import { useGame } from "@/hooks/useGame";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useTheme } from "@/hooks/useTheme";
import { useSync } from "@/hooks/useSync";
import { useGameStore } from "@/store/gameStore";

export function GameApp() {
  useTheme();
  useSync();

  const game = useGame();
  const status = useGameStore((s) => s.current.gameStatus);
  const { modalsOpen, header, modals, openStats } = useNavbar();

  useKeyboard({
    enabled: !modalsOpen,
    onLetter: game.pressLetter,
    onBackspace: game.pressBackspace,
    onEnter: game.submit,
  });

  // Auto-open stats modal when the game ends, after the flip animation finishes.
  const previousStatus = useRef(status);
  useEffect(() => {
    if (previousStatus.current === "IN_PROGRESS" && status !== "IN_PROGRESS") {
      const t = window.setTimeout(openStats, 2400);
      previousStatus.current = status;
      return () => window.clearTimeout(t);
    }
    previousStatus.current = status;
  }, [status, openStats]);

  return (
    <div className="app-shell">
      {header}
      <Toast />

      <main className="flex flex-1 flex-col items-stretch justify-between gap-2 overflow-hidden pt-2 sm:gap-4 sm:pb-2 sm:pt-4">
        <section className="flex flex-1 items-center justify-center px-3">
          <Board flippingRow={game.flippingRow} bouncingRow={game.bouncingRow} />
        </section>

        <GameResult />

        <section className="pb-2 pt-1 sm:pt-2">
          <Keyboard
            onLetter={game.pressLetter}
            onEnter={game.submit}
            onBackspace={game.pressBackspace}
          />
        </section>
      </main>

      {modals}
    </div>
  );
}
