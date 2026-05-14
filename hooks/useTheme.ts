"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import type { ThemePreference } from "@/types";

/** Resolve "system" to either "dark" or "light" using the OS preference. */
function resolveTheme(pref: ThemePreference): "dark" | "light" {
  if (pref === "dark" || pref === "light") return pref;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/**
 * Reflects the chosen theme + high-contrast preference to the <html> element
 * via data-attributes. Returns the active resolved theme.
 */
export function useTheme(): {
  theme: ThemePreference;
  resolved: "dark" | "light";
  highContrast: boolean;
  setTheme: (t: ThemePreference) => void;
  setHighContrast: (v: boolean) => void;
} {
  const theme = useSettingsStore((s) => s.theme);
  const highContrast = useSettingsStore((s) => s.highContrast);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setHighContrast = useSettingsStore((s) => s.setHighContrast);

  const resolved = resolveTheme(theme);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-theme", resolveTheme(theme));
    root.setAttribute("data-high-contrast", String(highContrast));
  }, [theme, highContrast]);

  // Listen for system theme changes when user chose "system".
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      document.documentElement.setAttribute(
        "data-theme",
        mq.matches ? "light" : "dark",
      );
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return { theme, resolved, highContrast, setTheme, setHighContrast };
}
