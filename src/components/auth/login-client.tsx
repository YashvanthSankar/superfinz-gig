"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  ArrowRight,
  CircleGauge,
  ShieldCheck,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const FEATURES: Array<{ icon: LucideIcon; text: string }> = [
  { icon: CircleGauge, text: "Know today’s safe amount" },
  { icon: ShieldCheck, text: "Protect essentials and earning costs" },
  { icon: WalletCards, text: "Prepare for low-income weeks" },
];

/** Friendly copy for the `?error=` codes NextAuth appends after a failed sign-in. */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "This email is already linked to another sign-in method. Use the method you signed up with, or open the demo instead.",
  AccessDenied:
    "Sign-in was cancelled or access was denied. You can try again or open the demo without an account.",
  Configuration:
    "Sign-in is temporarily unavailable. Please try again in a few minutes, or open the demo.",
  Callback: "Google did not finish signing you in. Please try again.",
};
const DEFAULT_AUTH_ERROR = "Google sign-in did not complete. Please try again.";

function describeAuthError(code: string | null): string | null {
  if (!code) return null;
  return AUTH_ERROR_MESSAGES[code] ?? DEFAULT_AUTH_ERROR;
}

export function LoginClient() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authErrorDismissed, setAuthErrorDismissed] = useState(false);

  const authError = authErrorDismissed
    ? null
    : describeAuthError(searchParams.get("error"));
  const message = error ?? authError;

  // Back-navigation from Google restores this page from the bfcache with the
  // old state, so make sure the button is not left spinning.
  useEffect(() => {
    const reset = () => setLoading(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  const go = async () => {
    setLoading(true);
    setError(null);
    setAuthErrorDismissed(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError(
        "Google sign-in could not start. You can retry or open the demo without an account.",
      );
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-paper p-4 sm:p-8">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-5xl items-center gap-10 lg:grid-cols-2">
        <section>
          <Link
            href="/"
            aria-label="SuperFinz home"
            className="inline-flex items-center gap-3 rounded-xl"
          >
            <Logo size="lg" />
            <span className="text-2xl font-bold tracking-[-0.02em]">SuperFinz</span>
          </Link>
          <p className="brut-stamp mt-8 inline-flex bg-accent-soft text-accent-ink">
            Salary layer for irregular earners
          </p>
          <h1 className="brut-display mt-5 text-5xl sm:text-6xl">
            Know what is safe today.
          </h1>
          <p className="mt-5 text-lg leading-8 text-ink-soft">
            Sign in to build a live plan, or enter the Ravi demo immediately—no
            setup and no bank account required.
          </p>
          <ul className="mt-7 grid gap-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-paper-2 px-4 font-semibold text-ink"
              >
                <Icon aria-hidden size={19} className="shrink-0 text-accent-ink" />
                {text}
              </li>
            ))}
          </ul>
        </section>

        <section className="brut-card-lg p-6 sm:p-8">
          <p className="brut-label">Welcome to SuperFinz</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.02em]">
            Your earnings vary. Your plan adapts.
          </h2>
          <Button
            size="xl"
            block
            loading={loading}
            loadingLabel="Opening Google sign-in"
            onClick={go}
            className="mt-7"
            aria-describedby={message ? "login-error" : undefined}
          >
            Continue with Google
          </Button>
          <Button asChild variant="secondary" size="xl" block className="mt-3">
            <Link href="/demo">
              Continue as Ravi
              <ArrowRight aria-hidden size={18} />
            </Link>
          </Button>
          {message && (
            <p
              id="login-error"
              role="alert"
              className="mt-4 rounded-xl border border-bad/40 bg-bad-soft px-4 py-3 text-sm font-medium text-bad"
            >
              {message}
            </p>
          )}
          <div className="mt-6 border-t border-line pt-5">
            <p className="text-sm leading-6 text-ink-soft">
              Only your basic Google identity is used for sign-in. The demo uses
              clearly labeled prototype data. No account connection, money
              transfer, or credit request occurs.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
