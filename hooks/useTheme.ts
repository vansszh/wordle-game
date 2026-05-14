"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import type { ThemePreference } from "@/types";

function resolve(pref: ThemePreference): "dark" | "light" {
  if (pref === "dark" || pref === "light") return pref;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function useTheme() {
  const theme = useSettingsStore((s) => s.theme);
  const highContrast = useSettingsStore((s) => s.highContrast);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setHighContrast = useSettingsStore((s) => s.setHighContrast);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", resolve(theme));
    root.setAttribute("data-high-contrast", String(highContrast));
  }, [theme, highContrast]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => document.documentElement.setAttribute("data-theme", mq.matches ? "light" : "dark");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return { theme, resolved: resolve(theme), highContrast, setTheme, setHighContrast };
}
