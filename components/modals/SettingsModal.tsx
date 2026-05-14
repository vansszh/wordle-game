"use client";

import { Modal } from "./Modal";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useToastStore } from "@/store/toastStore";
import { AuthButton } from "@/components/auth/AuthButton";
import type { ThemePreference } from "@/types";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}

function Toggle({ label, description, checked, disabled, onChange }: ToggleProps) {
  return (
    <label className="flex items-start justify-between gap-3 py-3">
      <span className="flex flex-col">
        <span className="text-sm font-medium text-[var(--c-text-primary)]">{label}</span>
        {description ? (
          <span className="mt-0.5 text-xs text-[var(--c-text-secondary)]">{description}</span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50"
        style={{
          backgroundColor: checked ? "var(--c-accent)" : "var(--c-border-subtle)",
        }}
      >
        <span
          className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
          style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
        />
      </button>
    </label>
  );
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const highContrast = useSettingsStore((s) => s.highContrast);
  const setHighContrast = useSettingsStore((s) => s.setHighContrast);
  const hardMode = useSettingsStore((s) => s.hardMode);
  const setHardMode = useSettingsStore((s) => s.setHardMode);
  const game = useGameStore((s) => s.current);
  const pushToast = useToastStore((s) => s.push);

  const anyGuessed = game.evaluations.some((e) => e !== null);
  const canChangeHardMode = !anyGuessed || game.gameStatus !== "IN_PROGRESS";

  const handleHardMode = (next: boolean) => {
    if (!canChangeHardMode) {
      pushToast("Hard Mode can only be changed before any guesses", 1800);
      return;
    }
    setHardMode(next);
  };

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: "system", label: "System" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="divide-y divide-[var(--c-border-subtle)]">
        <Toggle
          label="Hard Mode"
          description="Any revealed hints must be used in subsequent guesses."
          checked={hardMode}
          disabled={!canChangeHardMode}
          onChange={handleHardMode}
        />

        <div className="flex items-center justify-between gap-3 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[var(--c-text-primary)]">Theme</span>
            <span className="mt-0.5 text-xs text-[var(--c-text-secondary)]">
              System uses your OS preference.
            </span>
          </div>
          <div className="flex rounded-md bg-[var(--c-bg-surface)] p-0.5">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className="rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  backgroundColor:
                    theme === opt.value ? "var(--c-bg-elevated)" : "transparent",
                  color:
                    theme === opt.value
                      ? "var(--c-text-primary)"
                      : "var(--c-text-secondary)",
                }}
                aria-pressed={theme === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Toggle
          label="High Contrast Mode"
          description="Use orange and blue tile colors for improved color vision accessibility."
          checked={highContrast}
          onChange={setHighContrast}
        />
      </div>

      <hr className="my-4 border-t border-[var(--c-border-subtle)]" />

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider">Account</p>
        <AuthButton fullWidth />
      </div>

      <hr className="my-4 border-t border-[var(--c-border-subtle)]" />

      <div className="text-center text-xs text-[var(--c-text-muted)]">
        <p className="font-medium uppercase tracking-wider">Wordle</p>
        <p className="mt-1">A faithful clone for learning, with sync.</p>
      </div>
    </Modal>
  );
}
