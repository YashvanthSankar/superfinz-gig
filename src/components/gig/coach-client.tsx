"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Bot,
  Check,
  Copy,
  Mic,
  Send,
  ShieldCheck,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  UserRound,
  Volume2,
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

const speechLanguage = (value: string) => {
  if (/\p{Script=Devanagari}/u.test(value)) return "hi-IN";
  if (/\p{Script=Tamil}/u.test(value)) return "ta-IN";
  if (/\p{Script=Telugu}/u.test(value)) return "te-IN";
  if (/\p{Script=Kannada}/u.test(value)) return "kn-IN";
  if (/\p{Script=Malayalam}/u.test(value)) return "ml-IN";
  return "en-IN";
};

export function CoachClient() {
  const { dashboard } = useGigDashboard();
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const nextId = useRef(2);
  const controller = useRef<AbortController | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingTimer = useRef<number | null>(null);
  const discardRecording = useRef(false);

  useEffect(
    () => () => {
      if (recordingTimer.current) clearTimeout(recordingTimer.current);
      discardRecording.current = true;
      if (mediaRecorder.current?.state === "recording")
        mediaRecorder.current.stop();
      mediaStream.current?.getTracks().forEach((track) => track.stop());
      window.speechSynthesis?.cancel();
    },
    [],
  );

  const speak = (message: Message) => {
    if (!("speechSynthesis" in window)) {
      setVoiceError("Reading aloud is not available in this browser.");
      return;
    }
    if (speakingId === message.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.text);
    utterance.lang = speechLanguage(message.text);
    utterance.rate = 0.9;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => {
      setSpeakingId(null);
      setVoiceError("Couldn’t play that answer aloud.");
    };
    setSpeakingId(message.id);
    window.speechSynthesis.speak(utterance);
  };

  const ask = async (question: string, speakReply = false) => {
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
      const responseMessage: Message = {
        id: nextId.current++,
        role: "assistant",
        text: body.reply,
        source: body.source,
      };
      setMessages((current) => [...current, responseMessage]);
      if (speakReply) speak(responseMessage);
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

  const stopVoice = (discard = false) => {
    if (recordingTimer.current) clearTimeout(recordingTimer.current);
    recordingTimer.current = null;
    discardRecording.current = discard;
    if (mediaRecorder.current?.state === "recording")
      mediaRecorder.current.stop();
    setRecording(false);
  };

  const transcribe = async (audio: Blob) => {
    setTranscribing(true);
    setVoiceError(null);
    try {
      const extension = audio.type.includes("webm") ? "webm" : "m4a";
      const form = new FormData();
      form.append("audio", audio, `question.${extension}`);
      const response = await fetch("/api/gig/coach/transcribe", {
        method: "POST",
        body: form,
      });
      const result = (await response.json().catch(() => ({}))) as {
        transcript?: string;
        error?: string;
      };
      if (!response.ok || !result.transcript)
        throw new Error(result.error ?? "Couldn’t understand that recording.");
      setTranscribing(false);
      await ask(result.transcript, true);
    } catch (cause) {
      setTranscribing(false);
      setVoiceError(
        cause instanceof Error
          ? cause.message
          : "Couldn’t understand that recording.",
      );
    }
  };

  const startVoice = async () => {
    if (busy || transcribing || recording) return;
    if (!("MediaRecorder" in window) || !navigator.mediaDevices?.getUserMedia) {
      setVoiceError("Voice questions are not available in this browser.");
      return;
    }
    setVoiceError(null);
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredType = MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus",
      )
        ? "audio/webm;codecs=opus"
        : "";
      const recorder = new MediaRecorder(
        stream,
        preferredType ? { mimeType: preferredType } : undefined,
      );
      mediaStream.current = stream;
      mediaRecorder.current = recorder;
      audioChunks.current = [];
      discardRecording.current = false;
      recorder.ondataavailable = (event) => {
        if (event.data.size) audioChunks.current.push(event.data);
      };
      recorder.onstop = () => {
        const audio = new Blob(audioChunks.current, {
          type: recorder.mimeType || "audio/webm",
        });
        stream.getTracks().forEach((track) => track.stop());
        mediaStream.current = null;
        mediaRecorder.current = null;
        if (discardRecording.current) {
          discardRecording.current = false;
          return;
        }
        void transcribe(audio);
      };
      recorder.start();
      setRecording(true);
      recordingTimer.current = window.setTimeout(stopVoice, 30_000);
    } catch {
      setVoiceError(
        "Microphone access is off. Allow it in your browser, or type instead.",
      );
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
    stopVoice(true);
    window.speechSynthesis?.cancel();
    setMessages([welcome]);
    setError(null);
    setVoiceError(null);
    setSpeakingId(null);
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
                        onClick={() => speak(message)}
                        aria-pressed={speakingId === message.id}
                        aria-label={
                          speakingId === message.id
                            ? "Stop reading coach response"
                            : "Read coach response aloud"
                        }
                        className="flex min-h-10 items-center gap-1 px-2 text-[10px] font-black uppercase"
                      >
                        {speakingId === message.id ? (
                          <Square aria-hidden size={14} />
                        ) : (
                          <Volume2 aria-hidden size={15} />
                        )}
                        {speakingId === message.id ? "Stop" : "Listen"}
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
          {(recording || transcribing || voiceError) && (
            <div
              role={voiceError ? "alert" : "status"}
              className={`mx-3 mb-3 flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold ${voiceError ? "border-bad bg-bad-soft text-bad" : "border-accent bg-accent-soft text-ink"}`}
            >
              {transcribing ? (
                <span
                  aria-hidden
                  className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent motion-reduce:animate-none"
                />
              ) : (
                <Mic aria-hidden size={17} />
              )}
              {voiceError
                ? voiceError
                : transcribing
                  ? "Turning your recording into text…"
                  : "Listening… tap Stop when you finish."}
            </div>
          )}
          <form
            onSubmit={submit}
            className="border-t-2 border-ink bg-paper-2 p-3"
          >
            <div className="flex gap-2">
              <label className="sr-only" htmlFor="coach-question">
                Ask the money coach
              </label>
              <input
                id="coach-question"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={500}
                placeholder="Ask by voice or type here"
                className="min-h-12 min-w-0 flex-1 border-2 border-ink bg-paper px-3 text-base font-bold outline-none focus:ring-4 focus:ring-accent/30"
              />
              <button
                type="button"
                disabled={busy || transcribing}
                onClick={
                  recording ? () => stopVoice() : () => void startVoice()
                }
                aria-label={
                  recording
                    ? "Stop recording and ask"
                    : "Start a voice question"
                }
                aria-pressed={recording}
                className={`flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-xl text-paper disabled:cursor-not-allowed disabled:opacity-45 ${recording ? "bg-ink" : "bg-accent"}`}
              >
                {recording ? (
                  <Square aria-hidden size={18} />
                ) : (
                  <Mic aria-hidden size={19} />
                )}
              </button>
              <button
                disabled={busy || recording || transcribing || !input.trim()}
                aria-label="Send question"
                className="brut-btn min-h-12 bg-accent text-paper"
              >
                <Send aria-hidden size={18} />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] leading-4 text-mute">
              Voice is sent only for transcription and is not saved by
              SuperFinz.
            </p>
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
