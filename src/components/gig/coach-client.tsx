"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  Copy,
  LoaderCircle,
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
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import { PageHeading } from "./page-state";
import { jsonRequest, useGigDashboard } from "./use-gig-dashboard";

type Message = {
  id: number;
  role: "assistant" | "user";
  text: string;
  source?: string;
  feedback?: "helpful" | "not-helpful";
};
type AskOptions = {
  /** Read the reply aloud once it arrives (voice questions). */
  speakReply?: boolean;
  /** Retry the last question without appending a second user bubble. */
  reuseLast?: boolean;
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
  const { dashboard, loading } = useGigDashboard();
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [voiceLoadingId, setVoiceLoadingId] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const nextId = useRef(2);
  const controller = useRef<AbortController | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingTimer = useRef<number | null>(null);
  const discardRecording = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const voiceRequest = useRef<AbortController | null>(null);
  const audioPlayer = useRef<HTMLAudioElement | null>(null);
  const audioUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (recordingTimer.current) clearTimeout(recordingTimer.current);
      discardRecording.current = true;
      if (mediaRecorder.current?.state === "recording")
        mediaRecorder.current.stop();
      mediaStream.current?.getTracks().forEach((track) => track.stop());
      voiceRequest.current?.abort();
      audioPlayer.current?.pause();
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
      window.speechSynthesis?.cancel();
    },
    [],
  );

  // Keep the newest message (or the typing indicator) in view inside the log.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    list.scrollTo({
      top: list.scrollHeight,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [messages, busy, error]);

  // Clear the live announcement after a moment so repeated states re-announce.
  useEffect(() => {
    if (!announcement) return;
    const timer = window.setTimeout(() => setAnnouncement(""), 4000);
    return () => window.clearTimeout(timer);
  }, [announcement]);

  const stopSpokenReply = () => {
    voiceRequest.current?.abort();
    voiceRequest.current = null;
    audioPlayer.current?.pause();
    audioPlayer.current = null;
    if (audioUrl.current) {
      URL.revokeObjectURL(audioUrl.current);
      audioUrl.current = null;
    }
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
    setVoiceLoadingId(null);
  };

  const speakWithDeviceFallback = (message: Message) => {
    if (!("speechSynthesis" in window)) {
      setVoiceError("Reading aloud is not available in this browser.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(message.text);
    utterance.lang = speechLanguage(message.text);
    utterance.rate = 0.9;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => {
      setSpeakingId(null);
      setVoiceError("Couldn’t play that answer aloud.");
    };
    setVoiceError(
      "Natural voice is unavailable, so this reply is using your device voice.",
    );
    setSpeakingId(message.id);
    window.speechSynthesis.speak(utterance);
  };

  const speak = async (message: Message) => {
    if (speakingId === message.id || voiceLoadingId === message.id) {
      stopSpokenReply();
      return;
    }
    stopSpokenReply();
    const requestController = new AbortController();
    voiceRequest.current = requestController;
    setVoiceError(null);
    setVoiceLoadingId(message.id);
    try {
      const response = await fetch("/api/gig/coach/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: requestController.signal,
        body: JSON.stringify({ text: message.text }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Natural voice is unavailable");
      }
      const url = URL.createObjectURL(await response.blob());
      if (requestController.signal.aborted) {
        URL.revokeObjectURL(url);
        return;
      }
      audioUrl.current = url;
      const player = new Audio(url);
      audioPlayer.current = player;
      player.onended = () => {
        setSpeakingId(null);
        audioPlayer.current = null;
        if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
        audioUrl.current = null;
      };
      player.onerror = () => {
        setSpeakingId(null);
        setVoiceError("Couldn’t play that answer aloud.");
        audioPlayer.current = null;
        if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
        audioUrl.current = null;
      };
      await player.play();
      setVoiceLoadingId(null);
      setSpeakingId(message.id);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      audioPlayer.current?.pause();
      audioPlayer.current = null;
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
      audioUrl.current = null;
      setVoiceLoadingId(null);
      speakWithDeviceFallback(message);
    } finally {
      if (voiceRequest.current === requestController)
        voiceRequest.current = null;
    }
  };

  const ask = async (
    question: string,
    { speakReply = false, reuseLast = false }: AskOptions = {},
  ) => {
    const text = question.trim();
    if (!text || busy) return;
    if (!reuseLast) {
      const userMessage: Message = { id: nextId.current++, role: "user", text };
      setMessages((current) => [...current, userMessage]);
      setInput("");
    }
    setBusy(true);
    setError(null);
    setAnnouncement("Checking your plan");
    controller.current = new AbortController();
    try {
      const body = await jsonRequest<{ reply: string; source: string }>(
        "/api/gig/coach",
        {
          method: "POST",
          body: JSON.stringify({ message: text }),
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
      setAnnouncement("New reply from the coach");
      if (speakReply) void speak(responseMessage);
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

  const retry = () => {
    const last = messages.at(-1);
    if (last?.role === "user") void ask(last.text, { reuseLast: true });
    else void ask(input);
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
    setAnnouncement("Transcribing");
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
      await ask(result.transcript, { speakReply: true });
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
    stopSpokenReply();
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
      setAnnouncement("Listening");
      recordingTimer.current = window.setTimeout(stopVoice, 30_000);
    } catch {
      setVoiceError(
        "Microphone access is off. Allow it in your browser, or type instead.",
      );
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim()) {
      toast.error("Type or say a question first");
      return;
    }
    void ask(input);
  };
  const copy = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      toast.error("Could not copy");
    }
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
    stopSpokenReply();
    setMessages([welcome]);
    setError(null);
    setVoiceError(null);
    setBusy(false);
  };

  const voiceBusy = recording || transcribing || voiceLoadingId !== null;

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Money coach"
        title="Ask in your own words."
        copy="Short answers based on your saved plan. The coach explains numbers; it cannot move money or approve a loan."
        action={
          messages.length > 1 ? (
            <Button variant="secondary" onClick={clear}>
              <Trash2 aria-hidden size={16} />
              Clear chat
            </Button>
          ) : undefined
        }
      />

      <p role="status" className="sr-only">
        {announcement}
      </p>

      <div className="grid gap-5 xl:grid-cols-[1fr_18rem]">
        <section
          className="brut-card flex flex-col overflow-hidden xl:self-start"
          aria-labelledby="coach-title"
        >
          <div className="flex items-center gap-3 bg-primary p-4 text-on-primary">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-on-primary/10 ring-2 ring-on-primary/40">
              <Bot aria-hidden size={21} />
            </div>
            <div className="min-w-0">
              <h2 id="coach-title" className="font-semibold leading-tight">
                SuperFinz Coach
              </h2>
              <p className="mt-0.5 text-xs font-medium text-on-primary-soft">
                Your calculator stays in charge
              </p>
            </div>
          </div>

          <div
            ref={listRef}
            role="log"
            aria-label="Conversation with the coach"
            className="min-h-[18rem] max-h-[60dvh] flex-1 space-y-4 overflow-y-auto p-4"
          >
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <article
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    isUser ? "justify-end" : "justify-start",
                  )}
                >
                  {!isUser && <Avatar kind="bot" />}
                  <div className="min-w-0 max-w-[85%]">
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm font-medium leading-6 whitespace-pre-wrap [overflow-wrap:anywhere]",
                        isUser
                          ? "rounded-br-md bg-primary text-on-primary"
                          : "rounded-bl-md bg-paper-2 text-ink",
                      )}
                    >
                      {message.text}
                    </div>
                    {!isUser && message.id !== welcome.id && (
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void copy(message)}
                          aria-label="Copy coach response"
                        >
                          {copiedId === message.id ? (
                            <Check aria-hidden size={15} />
                          ) : (
                            <Copy aria-hidden size={15} />
                          )}
                          {copiedId === message.id ? "Copied" : "Copy"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void speak(message)}
                          aria-pressed={
                            speakingId === message.id ||
                            voiceLoadingId === message.id
                          }
                          aria-label={
                            speakingId === message.id ||
                            voiceLoadingId === message.id
                              ? "Stop reading coach response"
                              : "Read coach response aloud"
                          }
                        >
                          {voiceLoadingId === message.id ? (
                            <LoaderCircle
                              aria-hidden
                              size={15}
                              className="animate-spin motion-reduce:animate-none"
                            />
                          ) : speakingId === message.id ? (
                            <Square aria-hidden size={15} />
                          ) : (
                            <Volume2 aria-hidden size={16} />
                          )}
                          {voiceLoadingId === message.id
                            ? "Preparing"
                            : speakingId === message.id
                              ? "Stop"
                              : "Listen"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-pressed={message.feedback === "helpful"}
                          onClick={() => void feedback(message.id, "helpful")}
                          aria-label="Helpful response"
                          className={cn(
                            message.feedback === "helpful" &&
                              "bg-good-soft text-good hover:bg-good-soft hover:text-good",
                          )}
                        >
                          <ThumbsUp aria-hidden size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-pressed={message.feedback === "not-helpful"}
                          onClick={() =>
                            void feedback(message.id, "not-helpful")
                          }
                          aria-label="Not helpful response"
                          className={cn(
                            message.feedback === "not-helpful" &&
                              "bg-bad-soft text-bad hover:bg-bad-soft hover:text-bad",
                          )}
                        >
                          <ThumbsDown aria-hidden size={16} />
                        </Button>
                        {message.source?.startsWith("openai") && (
                          <Badge className="ml-auto">
                            AI words · saved numbers
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  {isUser && <Avatar kind="user" />}
                </article>
              );
            })}
            {busy && (
              <div className="flex flex-wrap items-center gap-3">
                <Avatar kind="bot" />
                <div className="rounded-2xl rounded-bl-md bg-paper-2 px-4 py-3 text-sm font-medium text-ink-soft">
                  Checking your plan…
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => controller.current?.abort()}
                >
                  <Square aria-hidden size={14} />
                  Stop
                </Button>
              </div>
            )}
            {error && (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bad/40 bg-bad-soft px-4 py-3 text-sm font-medium text-bad"
              >
                <span className="[overflow-wrap:anywhere]">{error}</span>
                <Button variant="soft" size="sm" onClick={retry}>
                  Retry
                </Button>
              </div>
            )}
          </div>

          {(voiceBusy || voiceError) && (
            <div
              role={voiceError ? "alert" : undefined}
              className={cn(
                "mx-3 mb-3 flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium",
                voiceError
                  ? "border-bad/40 bg-bad-soft text-bad"
                  : "border-accent/40 bg-accent-soft text-accent-ink",
              )}
            >
              {transcribing || voiceLoadingId !== null ? (
                <LoaderCircle
                  aria-hidden
                  size={17}
                  className="shrink-0 animate-spin motion-reduce:animate-none"
                />
              ) : (
                <Mic aria-hidden size={17} className="shrink-0" />
              )}
              <span>
                {voiceError
                  ? voiceError
                  : transcribing
                    ? "Turning your recording into text…"
                    : voiceLoadingId !== null
                      ? "Preparing a natural voice…"
                    : "Listening (up to 30 seconds)… tap Stop when you finish."}
              </span>
            </div>
          )}

          <form onSubmit={submit} className="border-t border-line bg-paper-2 p-3">
            <div className="flex gap-2">
              <Input
                aria-label="Ask the money coach"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={500}
                placeholder="Ask by voice or type here"
                autoComplete="off"
                wrapperClassName="min-w-0 flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant={recording ? "primary" : "accent"}
                className="h-12 w-12"
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
              >
                {recording ? (
                  <Square aria-hidden size={18} />
                ) : (
                  <Mic aria-hidden size={19} />
                )}
              </Button>
              <Button
                type="submit"
                variant="accent"
                className="min-h-12"
                disabled={busy || voiceBusy}
                aria-label="Send question"
              >
                <Send aria-hidden size={18} />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </div>
            <p className="mt-2 text-center text-xs leading-5 text-mute">
              Spoken replies use an AI-generated voice. Recordings and generated
              audio are processed on demand and are not saved by SuperFinz.
            </p>
          </form>
        </section>

        <aside className="space-y-4">
          <section className="brut-card p-5" aria-labelledby="try-asking">
            <h2 id="try-asking" className="brut-label">
              Try asking
            </h2>
            <div className="mt-3 space-y-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  block
                  disabled={busy}
                  onClick={() => void ask(suggestion)}
                  className="h-auto min-h-12 justify-start whitespace-normal py-3 text-left"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </section>

          <section
            className="brut-card min-h-[15.5rem] p-5"
            aria-labelledby="coach-numbers"
            aria-busy={loading || undefined}
          >
            <h2 id="coach-numbers" className="brut-label">
              Numbers the coach sees
            </h2>
            {loading ? (
              <div className="mt-3" aria-hidden>
                <div className="space-y-3">
                  {[0, 1, 2].map((row) => (
                    <div
                      key={row}
                      className="flex justify-between gap-2 border-t border-line pt-2 first:border-0 first:pt-0"
                    >
                      <span className="h-5 w-28 animate-pulse rounded-md bg-paper-2 motion-reduce:animate-none" />
                      <span className="h-5 w-20 animate-pulse rounded-md bg-paper-2 motion-reduce:animate-none" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-11 w-48 animate-pulse rounded-xl bg-paper-2 motion-reduce:animate-none" />
              </div>
            ) : dashboard ? (
              <>
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
                <Button asChild variant="soft" size="sm" className="mt-4">
                  <Link href="/dashboard">
                    Check the calculation
                    <ArrowRight aria-hidden size={16} />
                  </Link>
                </Button>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-ink-soft">
                Your plan numbers are unavailable right now. The coach still
                answers from your saved plan.
              </p>
            )}
          </section>

          <section
            className="rounded-[1.25rem] border border-line bg-good-soft p-5 shadow-sm"
            aria-labelledby="honest-title"
          >
            <ShieldCheck aria-hidden size={23} className="text-good" />
            <h2 id="honest-title" className="brut-label mt-4">
              Honest by design
            </h2>
            <p className="mt-3 text-sm font-medium leading-6 text-ink">
              Expected income stays labeled as an estimate. The coach cannot
              approve credit, move money, or invent a balance.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Avatar({ kind }: { kind: "bot" | "user" }) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        kind === "bot"
          ? "bg-accent-soft text-accent-ink"
          : "bg-good-soft text-good",
      )}
    >
      {kind === "bot" ? (
        <Bot aria-hidden size={18} />
      ) : (
        <UserRound aria-hidden size={18} />
      )}
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-t border-line pt-2 first:border-0 first:pt-0">
      <dt className="font-medium text-ink-soft">{label}</dt>
      <dd className="num text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}
