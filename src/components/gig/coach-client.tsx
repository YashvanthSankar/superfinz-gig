"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import {
  Bot,
  Check,
  Copy,
  Send,
  ShieldCheck,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  UserRound,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PageHeading } from "./page-state";
import { jsonRequest, useGigDashboard } from "./use-gig-dashboard";

type Message = {
  id: number;
  role: "assistant" | "user";
  text: string;
  source?: string;
  feedback?: "helpful" | "not-helpful";
};
const welcome: Message = {
  id: 1,
  role: "assistant",
  text: "Ask me about your current plan. I use the same settled balance, bills, work costs, and payout range shown elsewhere in SuperFinz.",
};
const suggestions = [
  "How much can I safely spend?",
  "What if my payout is late?",
  "How do I grow my cushion?",
  "Can I handle a ₹2,500 repair?",
  "What should I protect first?",
  "Explain my resilience score",
];

export function CoachClient() {
  const { dashboard } = useGigDashboard();
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const nextId = useRef(2);
  const controller = useRef<AbortController | null>(null);

  const ask = async (question: string) => {
    if (!question.trim() || busy) return;
    const userMessage: Message = {
      id: nextId.current++,
      role: "user",
      text: question.trim(),
    };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setBusy(true);
    setError(null);
    controller.current = new AbortController();
    try {
      const body = await jsonRequest<{ reply: string; source: string }>(
        "/api/gig/coach",
        {
          method: "POST",
          body: JSON.stringify({ message: userMessage.text }),
          signal: controller.current.signal,
        },
      );
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "assistant",
          text: body.reply,
          source: body.source,
        },
      ]);
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === "AbortError"))
        setError(
          cause instanceof Error ? cause.message : "The coach could not answer",
        );
    } finally {
      setBusy(false);
      controller.current = null;
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask(input);
  };
  const copy = async (message: Message) => {
    await navigator.clipboard.writeText(message.text);
    setCopiedId(message.id);
    window.setTimeout(() => setCopiedId(null), 1800);
  };
  const feedback = async (
    messageId: number,
    value: "helpful" | "not-helpful",
  ) => {
    setMessages((current) =>
      current.map((item) =>
        item.id === messageId ? { ...item, feedback: value } : item,
      ),
    );
    await jsonRequest("/api/gig/outcomes", {
      method: "POST",
      body: JSON.stringify({
        type:
          value === "helpful"
            ? "COACH_FEEDBACK_HELPFUL"
            : "COACH_FEEDBACK_NOT_HELPFUL",
      }),
    }).catch(() => undefined);
  };
  const clear = () => {
    controller.current?.abort();
    setMessages([welcome]);
    setError(null);
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Money coach"
        title="Ask in your own words."
        copy="Short answers based on your saved plan. The coach explains numbers; it cannot move money or approve a loan."
        action={
          messages.length > 1 ? (
            <button
              type="button"
              onClick={clear}
              className="brut-btn min-h-11 bg-paper"
            >
              <Trash2 size={16} />
              Clear chat
            </button>
          ) : undefined
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_18rem]">
        <section className="brut-card flex min-h-[36rem] flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b-2 border-ink bg-ink p-4 text-paper">
            <div className="flex h-11 w-11 items-center justify-center border-2 border-paper">
              <Bot aria-hidden size={21} />
            </div>
            <div>
              <p className="font-black">SuperFinz Coach</p>
              <p className="text-xs font-semibold text-paper-2">
                Your calculator stays in charge
              </p>
            </div>
          </div>
          <div className="flex-1 space-y-4 p-4" aria-live="polite">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-ink bg-accent-soft">
                    <Bot aria-hidden size={18} />
                  </div>
                )}
                <div className="max-w-[85%]">
                  <div
                    className={`border-2 border-ink p-4 text-sm font-semibold leading-6 ${message.role === "user" ? "bg-ink text-paper" : "bg-paper-2"}`}
                  >
                    {message.text}
                  </div>
                  {message.role === "assistant" && message.id !== 1 && (
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void copy(message)}
                        aria-label="Copy coach response"
                        className="flex min-h-10 items-center gap-1 px-2 text-[10px] font-black uppercase"
                      >
                        {copiedId === message.id ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                        {copiedId === message.id ? "Copied" : "Copy"}
                      </button>
                      <button
                        type="button"
                        aria-pressed={message.feedback === "helpful"}
                        onClick={() => void feedback(message.id, "helpful")}
                        aria-label="Helpful response"
                        className={`flex h-10 w-10 items-center justify-center ${message.feedback === "helpful" ? "bg-good-soft text-good" : ""}`}
                      >
                        <ThumbsUp size={14} />
                      </button>
                      <button
                        type="button"
                        aria-pressed={message.feedback === "not-helpful"}
                        onClick={() => void feedback(message.id, "not-helpful")}
                        aria-label="Not helpful response"
                        className={`flex h-10 w-10 items-center justify-center ${message.feedback === "not-helpful" ? "bg-bad-soft text-bad" : ""}`}
                      >
                        <ThumbsDown size={14} />
                      </button>
                      {message.source?.startsWith("openai") && (
                        <span className="ml-auto text-[10px] font-bold text-ink-soft">
                          AI words · saved numbers
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-ink bg-good-soft">
                    <UserRound aria-hidden size={18} />
                  </div>
                )}
              </article>
            ))}
            {busy && (
              <div className="flex flex-wrap items-center gap-3" role="status">
                <div className="flex h-10 w-10 items-center justify-center border-2 border-ink bg-accent-soft">
                  <Bot aria-hidden size={18} />
                </div>
                <div className="border-2 border-ink bg-paper-2 p-4 text-sm font-black">
                  Checking your plan…
                </div>
                <button
                  type="button"
                  onClick={() => controller.current?.abort()}
                  className="brut-btn min-h-11 bg-paper"
                >
                  <Square size={14} />
                  Stop
                </button>
              </div>
            )}
            {error && (
              <div
                role="alert"
                className="border-2 border-bad bg-bad-soft p-3 text-sm font-bold text-bad"
              >
                {error}{" "}
                <button
                  type="button"
                  onClick={() =>
                    void ask(
                      messages.at(-1)?.role === "user"
                        ? messages.at(-1)!.text
                        : input,
                    )
                  }
                  className="ml-2 underline"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
          <form
            onSubmit={submit}
            className="flex gap-2 border-t-2 border-ink bg-paper-2 p-3"
          >
            <label className="sr-only" htmlFor="coach-question">
              Ask the money coach
            </label>
            <input
              id="coach-question"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={500}
              placeholder="Can I afford ₹500 for repairs?"
              className="min-h-12 min-w-0 flex-1 border-2 border-ink bg-paper px-3 text-base font-bold outline-none focus:ring-4 focus:ring-accent/30"
            />
            <button
              disabled={busy || !input.trim()}
              aria-label="Send question"
              className="brut-btn min-h-12 bg-accent text-paper"
            >
              <Send aria-hidden size={18} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </section>
        <aside className="space-y-4">
          <section className="brut-card p-5">
            <p className="brut-label">Try asking</p>
            <div className="mt-3 space-y-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={busy}
                  onClick={() => void ask(suggestion)}
                  className="min-h-12 w-full border-2 border-ink bg-paper px-3 text-left text-xs font-black hover:bg-accent-soft"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </section>
          {dashboard && (
            <section className="brut-card p-5">
              <p className="brut-label">Numbers the coach sees</p>
              <dl className="mt-3 space-y-3 text-sm">
                <ContextRow
                  label="Safe now"
                  value={formatCurrency(dashboard.summary.safeToSpend)}
                />
                <ContextRow
                  label="Settled balance"
                  value={formatCurrency(dashboard.summary.availableBalance)}
                />
                <ContextRow
                  label="Expected payout"
                  value={`${formatCurrency(dashboard.summary.expectedPayoutMin)}–${formatCurrency(dashboard.summary.expectedPayoutMax)}`}
                />
              </dl>
              <Link
                href="/dashboard"
                className="mt-4 inline-flex min-h-11 items-center text-xs font-black uppercase underline"
              >
                Check the calculation
              </Link>
            </section>
          )}
          <section className="brut-card bg-good-soft p-5">
            <ShieldCheck aria-hidden size={23} />
            <p className="brut-label mt-4">Honest by design</p>
            <p className="mt-3 text-sm font-semibold leading-6">
              Expected income stays labeled as an estimate. The coach cannot
              approve credit, move money, or invent a balance.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-t border-ink/20 pt-2 first:border-0 first:pt-0">
      <dt className="font-semibold text-ink-soft">{label}</dt>
      <dd className="num text-right font-black">{value}</dd>
    </div>
  );
}
