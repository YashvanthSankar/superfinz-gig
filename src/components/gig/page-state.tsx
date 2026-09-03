import { AlertTriangle, LoaderCircle, RefreshCw } from "lucide-react";

export function LoadingPanel({ label = "Loading your plan" }: { label?: string }) {
  return <div className="brut-card flex min-h-56 items-center justify-center gap-3 p-6" role="status"><LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" size={22} /><span className="font-black">{label}…</span></div>;
}

export function ErrorPanel({ message, retry }: { message: string; retry: () => void }) {
  return <div className="brut-card bg-bad-soft p-6" role="alert"><AlertTriangle aria-hidden size={24} /><h2 className="brut-display mt-3 text-2xl">We could not load this page.</h2><p className="mt-2 font-semibold text-ink-soft">{message}</p><button type="button" onClick={retry} className="brut-btn mt-5 min-h-12 bg-paper"><RefreshCw aria-hidden size={17} />Try again</button></div>;
}

export function PageHeading({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="brut-label text-accent">{eyebrow}</p><h1 className="brut-display mt-1 text-4xl sm:text-5xl">{title}</h1><p className="mt-3 max-w-2xl font-semibold leading-7 text-ink-soft">{copy}</p></div>{action}</header>;
}
