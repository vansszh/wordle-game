import Link from "next/link";
import { LoginButton } from "./LoginButton";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-[var(--c-border-subtle)] bg-[var(--c-bg-elevated)] p-8 text-center">
        <h1 className="text-2xl font-extrabold uppercase tracking-[0.15em]">Wordle</h1>
        <p className="mt-2 text-sm text-[var(--c-text-secondary)]">
          Sign in to sync your progress across devices.
        </p>

        <div className="mt-6">
          <LoginButton />
        </div>

        <hr className="my-6 border-t border-[var(--c-border-subtle)]" />
        <Link
          href="/"
          className="text-xs font-medium text-[var(--c-text-secondary)] hover:text-[var(--c-text-primary)]"
        >
          Continue without signing in →
        </Link>
      </div>
    </main>
  );
}
