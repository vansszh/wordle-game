"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * SSR-safe useLocalStorage. Reads from localStorage on mount; writes
 * synchronously when the setter is called. Handles JSON serialization
 * and gracefully degrades when storage is unavailable (private mode).
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial);

  // Hydrate from storage once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // storage disabled or parse error — keep initial value
    }
  }, [key]);

  const setter = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // ignore quota / disabled errors
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, setter];
}
