import { AlertTriangle, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadingPanel({
  label = "Loading your plan",
}: {
  label?: string;
}) {
  return (
    <div
      className="brut-card flex min-h-56 items-center justify-center gap-3 p-6"
      role="status"
    >
      <LoaderCircle
        aria-hidden
        className="animate-spin text-accent-ink motion-reduce:animate-none"
        size={22}
      />
      <span className="font-semibold text-ink-soft">{label}…</span>
    </div>
  );
}

export function ErrorPanel({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div className="brut-card border-bad/40 bg-bad-soft p-6" role="alert">
      <AlertTriangle aria-hidden className="text-bad" size={24} />
      <h2 className="brut-display mt-3 text-2xl">
        We could not load this page.
      </h2>
      <p className="mt-2 font-medium text-ink-soft">{message}</p>
      <Button variant="secondary" size="lg" className="mt-5" onClick={retry}>
        <RefreshCw aria-hidden size={17} />
        Try again
      </Button>
    </div>
  );
}

/** Thin "updating" line shown while data refreshes behind a live screen. */
export function RefreshingBar({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-mute shadow-sm"
    >
      <LoaderCircle aria-hidden size={14} className="animate-spin motion-reduce:animate-none" />
      Updating your plan…
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="brut-label text-accent-ink">{eyebrow}</p>
        <h1 className="brut-display mt-2 text-3xl sm:text-[2.65rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-ink-soft">{copy}</p>
      </div>
      {action}
    </header>
  );
}
