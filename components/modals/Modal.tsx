"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  closable?: boolean;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, description, children, closable = true }: ModalProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const focusTimer = window.setTimeout(() => {
      cardRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }, 50);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !cardRef.current) return;
      const items = Array.from(cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            ref={cardRef}
            className="modal-card thin-scrollbar relative max-h-[90vh] w-full max-w-[480px] overflow-y-auto p-7 sm:max-w-[540px] sm:p-9"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {closable ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--c-text-secondary)] hover:bg-[var(--c-bg-surface)]"
              >
                <X size={18} aria-hidden="true" />
              </button>
            ) : null}

            <h2 className="pr-10 text-xl font-bold uppercase tracking-wider">{title}</h2>
            {description ? (
              <p className="mt-2 text-sm text-[var(--c-text-secondary)]">{description}</p>
            ) : null}

            <div className="mt-5 space-y-4 text-sm leading-relaxed text-[var(--c-text-primary)]">
              {children}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
