"use client";

import type { ReactNode } from "react";
import { BarChart3, HelpCircle, Settings as SettingsIcon } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";

interface HeaderProps {
  onOpenHelp: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--c-text-primary)] transition-[background-color,transform] duration-200 hover:bg-[var(--c-bg-surface)] active:scale-95 sm:h-10 sm:w-10"
    >
      {children}
    </button>
  );
}

export function Header({ onOpenHelp, onOpenStats, onOpenSettings }: HeaderProps) {
  return (
    <header
      className="relative flex h-[50px] w-full items-center justify-between border-b border-[var(--c-border-subtle)] px-3 sm:h-[56px] sm:px-4"
      role="banner"
    >
      <div className="flex items-center gap-1">
        <IconButton label="Open help" onClick={onOpenHelp}>
          <HelpCircle size={22} aria-hidden="true" />
        </IconButton>
      </div>

      <h1
        className="absolute left-1/2 -translate-x-1/2 select-none text-[1.5rem] font-extrabold uppercase tracking-[0.15em] text-[var(--c-text-primary)] sm:text-[1.75rem] sm:tracking-[0.18em]"
        aria-label="Wordle"
      >
        Wordle
      </h1>

      <div className="flex items-center gap-1">
        <IconButton label="Open statistics" onClick={onOpenStats}>
          <BarChart3 size={22} aria-hidden="true" />
        </IconButton>
        <IconButton label="Open settings" onClick={onOpenSettings}>
          <SettingsIcon size={22} aria-hidden="true" />
        </IconButton>
        <UserMenu />
      </div>
    </header>
  );
}
