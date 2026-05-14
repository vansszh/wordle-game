"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useToastStore } from "@/store/toastStore";

/**
 * Toast container. Sits at the top of the viewport, below the header.
 * Uses an aria-live region so screen readers announce new toasts.
 */
export function Toast() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-[60px] z-40 flex -translate-x-1/2 flex-col items-center gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className="toast pointer-events-auto"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
