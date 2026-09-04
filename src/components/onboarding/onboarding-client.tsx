"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Mic,
  Send,
  ShieldCheck,
  Square,
  Volume2,
} from "lucide-react";
import {
  QUICK_SETUP_PRIORITY_LABELS,
  QUICK_SETUP_QUESTIONS,
  QUICK_SETUP_SPLITS,
  QUICK_SETUP_STAGE_ORDER,
  QUICK_SETUP_WORK_LABELS,
  buildQuickOnboardingPayload,
  quickSetupDraftSchema,
  quickSetupSafetyBuffer,
  type GigPriority,
  type QuickSetupAssistantResponse,
  type QuickSetupDraft,
  type QuickSetupStage,
} from "@superfinz/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatCurrency } from "@/lib/utils";

const STORAGE_KEY = "superfinz-quick-dashboard-setup-v1";
const SETUP_STAGES = QUICK_SETUP_STAGE_ORDER.filter(
  (stage) => stage !== "REVIEW",
);

type Answers = Partial<Record<QuickSetupStage, string>>;
type Assumptions = Partial<Record<QuickSetupStage, string[]>>;
type SavedSetup = {
  stage: QuickSetupStage;
  draft: QuickSetupDraft;
  answers: Answers;
  assumptions: Assumptions;
};

const priorityOrder = Object.keys(
  QUICK_SETUP_PRIORITY_LABELS,
) as GigPriority[];

const money = (value?: number) =>
  value === undefined ? "Not added" : formatCurrency(value);

const displayDate = (value?: string) =>
  value
    ? new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not added";

function stageIndex(stage: QuickSetupStage) {
  return QUICK_SETUP_STAGE_ORDER.indexOf(stage);
}

function nextStage(stage: QuickSetupStage) {
  return QUICK_SETUP_STAGE_ORDER[
    Math.min(QUICK_SETUP_STAGE_ORDER.length - 1, stageIndex(stage) + 1)
  ];
}

function previousStage(stage: QuickSetupStage) {
  return QUICK_SETUP_STAGE_ORDER[Math.max(0, stageIndex(stage) - 1)];
}

function firstMissingStage(draft: QuickSetupDraft): QuickSetupStage | null {
  if (!draft.preferredName || !draft.city) return "ABOUT";
  if (
    !draft.workTypes?.length ||
    !draft.sourceName ||
    !draft.sourceType ||
    !draft.workDaysPerWeek
  )
    return "WORK";
  if (
    draft.lowWeekIncome === undefined ||
    draft.typicalWeekIncome === undefined ||
    draft.goodWeekIncome === undefined ||
    !draft.nextPayoutDate
  )
    return "INCOME";
  if (draft.weeklyWorkCosts === undefined) return "COSTS";
  if (
    draft.openingBalance === undefined ||
    draft.currentCushion === undefined
  )
    return "MONEY";
  if (!draft.commitments) return "BILLS";
  if (!draft.primaryPriority) return "PRIORITY";
  return null;
}

function cleanSavedSetup(value: unknown): SavedSetup | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<SavedSetup>;
  const parsedDraft = quickSetupDraftSchema.safeParse(raw.draft);
  if (!parsedDraft.success) return null;
  const savedStage = QUICK_SETUP_STAGE_ORDER.includes(
    raw.stage as QuickSetupStage,
  )
    ? (raw.stage as QuickSetupStage)
    : "ABOUT";
  const missing = firstMissingStage(parsedDraft.data);
  const safeStage =
    missing && stageIndex(savedStage) > stageIndex(missing) ? missing : savedStage;
  return {
    stage: safeStage,
    draft: parsedDraft.data,
    answers:
      raw.answers && typeof raw.answers === "object" ? raw.answers : {},
    assumptions:
      raw.assumptions && typeof raw.assumptions === "object"
        ? raw.assumptions
        : {},
  };
}

export function OnboardingClient() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [stage, setStage] = useState<QuickSetupStage>("ABOUT");
  const [draft, setDraft] = useState<QuickSetupDraft>({});
  const [answers, setAnswers] = useState<Answers>({});
  const [assumptions, setAssumptions] = useState<Assumptions>({});
  const [answer, setAnswer] = useState("");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [resumeStage, setResumeStage] = useState<QuickSetupStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingTimer = useRef<number | null>(null);
  const discardRecording = useRef(false);

  const currentIndex = stageIndex(stage);
  const progress = Math.round(
    (Math.min(currentIndex + 1, SETUP_STAGES.length) / SETUP_STAGES.length) *
      100,
  );
  const allAssumptions = Object.values(assumptions).flat();
  const currentQuestion =
    stage === "REVIEW" ? null : QUICK_SETUP_QUESTIONS[stage];

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = cleanSavedSetup(JSON.parse(raw));
        if (saved) {
          setStage(saved.stage);
          setDraft(saved.draft);
          setAnswers(saved.answers);
          setAssumptions(saved.assumptions);
        }
      }
    } catch {
      // An unreadable local draft can be safely replaced.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ stage, draft, answers, assumptions }),
      );
    } catch {
      // Private browsing may disable local storage; setup still works.
    }
  }, [answers, assumptions, draft, ready, stage]);

  useEffect(() => {
    if (!ready || stage !== "ABOUT" || answer) return;
    const firstName = session?.user?.name?.trim().split(/\s+/)[0];
    if (firstName) setAnswer(`${firstName}, `);
  }, [answer, ready, session?.user?.name, stage]);

  useEffect(
    () => () => {
      if (recordingTimer.current) window.clearTimeout(recordingTimer.current);
      if (mediaRecorder.current?.state === "recording") {
        discardRecording.current = true;
        mediaRecorder.current.stop();
      }
      mediaStream.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  useEffect(() => {
    if (!ready || stage === "PRIORITY" || stage === "REVIEW") return;
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  }, [ready, stage]);

  const stopRecording = (discard = false) => {
    if (recordingTimer.current) window.clearTimeout(recordingTimer.current);
    recordingTimer.current = null;
    discardRecording.current = discard;
    if (mediaRecorder.current?.state === "recording")
      mediaRecorder.current.stop();
    setRecording(false);
  };

  const transcribe = async (audio: Blob) => {
    setTranscribing(true);
    setError(null);
    setAnnouncement("Transcribing your answer");
    try {
      const extension = audio.type.includes("webm") ? "webm" : "m4a";
      const form = new FormData();
      form.append("audio", audio, `setup-answer.${extension}`);
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
      setAnswer(result.transcript);
      setAnnouncement("Voice answer is ready. Check it, then press Send.");
      window.requestAnimationFrame(() => textareaRef.current?.focus());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Couldn’t understand that recording.",
      );
    } finally {
      setTranscribing(false);
    }
  };

  const startRecording = async () => {
    if (sending || transcribing || recording) return;
    if (!("MediaRecorder" in window) || !navigator.mediaDevices?.getUserMedia) {
      setError("Voice answers are not available in this browser. You can type instead.");
      return;
    }
    setError(null);
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
      setAnnouncement("Listening. Tap Stop when you finish.");
      recordingTimer.current = window.setTimeout(stopRecording, 25_000);
    } catch {
      setError("Microphone access is off. Allow it in your browser, or type instead.");
    }
  };

  const moveTo = (next: QuickSetupStage) => {
    setStage(next);
    setAnswer(answers[next] ?? "");
    setError(null);
    setConfirmation(null);
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  const editStage = (target: QuickSetupStage) => {
    if (stageIndex(stage) > stageIndex(target)) setResumeStage(stage);
    moveTo(target);
  };

  const askAssistant = async (spokenAnswer?: string) => {
    if (stage === "PRIORITY" || stage === "REVIEW" || sending) return;
    const text = (spokenAnswer ?? answer).trim();
    if (!text) {
      setError("Type an answer or use the microphone.");
      textareaRef.current?.focus();
      return;
    }
    setSending(true);
    setError(null);
    setAnnouncement("Understanding your answer");
    try {
      const response = await fetch("/api/gig/onboarding/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, answer: text }),
      });
      const body = (await response.json().catch(() => ({}))) as
        | QuickSetupAssistantResponse
        | { error?: string };
      if (!response.ok)
        throw new Error(
          "error" in body && body.error
            ? body.error
            : "Could not read that answer",
        );
      const result = body as QuickSetupAssistantResponse;
      setAnnouncement(result.confirmation);
      if (!result.accepted) {
        setConfirmation(null);
        setError(result.confirmation);
        return;
      }
      setConfirmation(result.confirmation);
      setDraft((current) => ({ ...current, ...result.patch }));
      setAnswers((current) => ({ ...current, [stage]: text }));
      setAssumptions((current) => ({
        ...current,
        [stage]: result.assumptions,
      }));
      setAnswer("");
      const upcoming = resumeStage ?? nextStage(stage);
      setResumeStage(null);
      window.setTimeout(() => moveTo(upcoming), 350);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Check your connection and try again.",
      );
    } finally {
      setSending(false);
    }
  };

  const choosePriority = (priority: GigPriority) => {
    setResumeStage(null);
    setDraft((current) => ({ ...current, primaryPriority: priority }));
    setAnswers((current) => ({
      ...current,
      PRIORITY: QUICK_SETUP_PRIORITY_LABELS[priority],
    }));
    setConfirmation("Good choice. I’ll make that the focus of your dashboard.");
    window.setTimeout(() => moveTo("REVIEW"), 250);
  };

  const skipBills = () => {
    setAnswer("No bills to add right now");
    void askAssistant("No bills to add right now");
  };

  const submit = async () => {
    if (saving) return;
    const missing = firstMissingStage(draft);
    if (missing) {
      moveTo(missing);
      setError("One answer is missing. Let’s finish it first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/gig/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildQuickOnboardingPayload(draft)),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok)
        throw new Error(body.error ?? "Could not build your dashboard");
      window.localStorage.removeItem(STORAGE_KEY);
      await update({ onboarded: true });
      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Check your connection and try again.",
      );
      setSaving(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void askAssistant();
  };

  if (!ready) {
    return (
      <main className="grid min-h-dvh place-items-center bg-paper px-4">
        <div className="text-center" aria-live="polite">
          <Logo size="lg" className="mx-auto" />
          <p className="mt-4 font-semibold text-ink">Preparing your setup…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-paper px-4 pb-16 pt-5 sm:px-6 sm:pt-7">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div>
              <p className="font-bold tracking-[-0.02em] text-ink">SuperFinz</p>
              <p className="text-xs text-mute">Quick dashboard setup</p>
            </div>
          </div>
          <Badge variant="accent">About 2 minutes</Badge>
        </header>

        <div className="mt-6 flex items-center gap-3">
          {stage !== "ABOUT" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setResumeStage(null);
                moveTo(previousStage(stage));
              }}
              aria-label="Go to the previous setup question"
            >
              <ArrowLeft aria-hidden size={17} />
              Back
            </Button>
          ) : (
            <span className="min-h-11" />
          )}
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-mute">
              <span>
                {stage === "REVIEW"
                  ? "Ready to review"
                  : `Step ${currentIndex + 1} of ${SETUP_STAGES.length}`}
              </span>
              <span>{stage === "REVIEW" ? "100" : progress}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-paper-3"
              role="progressbar"
              aria-label="Dashboard setup progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={stage === "REVIEW" ? 100 : progress}
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${stage === "REVIEW" ? 100 : progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section
            className="overflow-hidden rounded-[1.5rem] border border-line bg-surface shadow-md"
            aria-labelledby="setup-title"
          >
            {stage === "REVIEW" ? (
              <Review
                draft={draft}
                assumptions={allAssumptions}
                saving={saving}
                error={error}
                onEdit={editStage}
                onSubmit={() => void submit()}
              />
            ) : stage === "PRIORITY" ? (
              <div className="p-5 sm:p-8">
                <AssistantHeading
                  title={currentQuestion?.title ?? "Your main goal"}
                  question={
                    currentQuestion?.question ??
                    "What should your dashboard help with first?"
                  }
                />
                <div
                  className="mt-6 grid gap-3"
                  role="radiogroup"
                  aria-label="Main dashboard goal"
                >
                  {priorityOrder.map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      role="radio"
                      aria-checked={draft.primaryPriority === priority}
                      onClick={() => choosePriority(priority)}
                      className={cn(
                        "flex min-h-14 w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left font-semibold transition-colors focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent",
                        draft.primaryPriority === priority
                          ? "border-accent bg-accent-soft text-accent-ink"
                          : "border-line bg-surface text-ink hover:border-line-strong hover:bg-paper-2",
                      )}
                    >
                      <span>{QUICK_SETUP_PRIORITY_LABELS[priority]}</span>
                      <ChevronRight aria-hidden size={18} />
                    </button>
                  ))}
                </div>
                <p className="mt-5 text-sm leading-6 text-mute">
                  This changes what appears first and adjusts your starter payout plan. You can change it later.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit}>
                <div className="border-b border-line bg-accent-soft/60 p-5 sm:p-8">
                  {confirmation && (
                    <div
                      className="mb-4 flex items-start gap-2 rounded-xl bg-surface p-3 text-sm text-ink shadow-sm"
                      role="status"
                    >
                      <CheckCircle2
                        aria-hidden
                        className="mt-0.5 shrink-0 text-good"
                        size={18}
                      />
                      <span>{confirmation}</span>
                    </div>
                  )}
                  <AssistantHeading
                    title={currentQuestion?.title ?? "Quick setup"}
                    question={currentQuestion?.question ?? "Tell me about you."}
                    example={currentQuestion?.example}
                  />
                </div>

                <div className="p-5 sm:p-8">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label
                      htmlFor="quick-answer"
                      className="text-sm font-semibold text-ink"
                    >
                      Your answer
                    </label>
                    <span className="text-xs text-mute">Type or speak</span>
                  </div>
                  <Textarea
                    ref={textareaRef}
                    id="quick-answer"
                    value={answer}
                    onChange={(event) => {
                      setAnswer(event.target.value);
                      if (error) setError(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void askAssistant();
                      }
                    }}
                    rows={3}
                    maxLength={500}
                    placeholder={currentQuestion?.example?.replace(
                      "For example: ",
                      "",
                    )}
                    error={error}
                    disabled={sending || transcribing || recording}
                    className="min-h-28"
                  />

                  {stage === "BILLS" && (
                    <button
                      type="button"
                      onClick={skipBills}
                      disabled={sending || transcribing || recording}
                      className="mt-3 min-h-11 rounded-full border border-line bg-paper-2 px-4 text-sm font-semibold text-ink hover:border-line-strong disabled:opacity-50"
                    >
                      No bills to add
                    </button>
                  )}

                  <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-xs leading-5 text-mute">
                      <ShieldCheck
                        aria-hidden
                        className="shrink-0 text-accent-ink"
                        size={17}
                      />
                      Voice is transcribed, not saved by SuperFinz.
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={recording ? "danger-soft" : "secondary"}
                        size="lg"
                        disabled={sending || transcribing}
                        onClick={() =>
                          recording ? stopRecording() : void startRecording()
                        }
                      >
                        {recording ? (
                          <Square aria-hidden size={18} />
                        ) : (
                          <Mic aria-hidden size={18} />
                        )}
                        {recording
                          ? "Stop"
                          : transcribing
                            ? "Transcribing…"
                            : "Speak"}
                      </Button>
                      <Button
                        type="submit"
                        variant="accent"
                        size="lg"
                        loading={sending || transcribing}
                        loadingLabel={
                          transcribing ? "Transcribing" : "Understanding answer"
                        }
                        disabled={recording || !answer.trim()}
                      >
                        <Send aria-hidden size={18} />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </section>

          <SetupSummary
            stage={stage}
            draft={draft}
            answers={answers}
            onEdit={editStage}
          />
        </div>

        <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-5 text-mute">
          AI only turns your words into setup fields. You review everything before it is saved. SuperFinz does not move real money.
        </p>
        <span className="sr-only" aria-live="polite">
          {announcement}
        </span>
      </div>
    </main>
  );
}

function AssistantHeading({
  title,
  question,
  example,
}: {
  title: string;
  question: string;
  example?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-on-primary shadow-sm">
        <Bot aria-hidden size={21} />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-accent-ink">
          {title}
        </p>
        <h1
          id="setup-title"
          className="mt-1 text-2xl font-bold tracking-[-0.03em] text-ink sm:text-3xl"
        >
          {question}
        </h1>
        {example && (
          <p className="mt-3 text-sm leading-6 text-ink-soft">{example}</p>
        )}
      </div>
    </div>
  );
}

function SetupSummary({
  stage,
  draft,
  answers,
  onEdit,
}: {
  stage: QuickSetupStage;
  draft: QuickSetupDraft;
  answers: Answers;
  onEdit: (stage: QuickSetupStage) => void;
}) {
  const rows: Array<{ stage: QuickSetupStage; label: string; value: string }> = [
    {
      stage: "ABOUT",
      label: "You",
      value: [draft.preferredName, draft.city].filter(Boolean).join(" · "),
    },
    {
      stage: "WORK",
      label: "Work",
      value:
        draft.workTypes
          ?.map((type) => QUICK_SETUP_WORK_LABELS[type])
          .join(", ") ?? "",
    },
    {
      stage: "INCOME",
      label: "Normal week",
      value:
        draft.typicalWeekIncome === undefined
          ? ""
          : money(draft.typicalWeekIncome),
    },
    {
      stage: "COSTS",
      label: "Weekly work costs",
      value:
        draft.weeklyWorkCosts === undefined
          ? ""
          : money(draft.weeklyWorkCosts),
    },
    {
      stage: "MONEY",
      label: "Available today",
      value:
        draft.openingBalance === undefined ? "" : money(draft.openingBalance),
    },
    {
      stage: "BILLS",
      label: "Important bills",
      value: draft.commitments ? `${draft.commitments.length} added` : "",
    },
    {
      stage: "PRIORITY",
      label: "Main goal",
      value: draft.primaryPriority
        ? QUICK_SETUP_PRIORITY_LABELS[draft.primaryPriority]
        : "",
    },
  ];

  return (
    <aside
      className="rounded-[1.25rem] border border-line bg-surface p-5 shadow-sm"
      aria-label="Setup summary"
    >
      <div className="flex items-center gap-2">
        <Volume2 aria-hidden className="text-accent-ink" size={18} />
        <h2 className="font-bold tracking-[-0.02em] text-ink">
          Your dashboard so far
        </h2>
      </div>
      <div className="mt-4 divide-y divide-line">
        {rows.map((row, index) => {
          const complete = Boolean(answers[row.stage] || row.value);
          const active = stage === row.stage;
          return (
            <button
              key={row.stage}
              type="button"
              onClick={() => complete && onEdit(row.stage)}
              disabled={!complete}
              className={cn(
                "flex min-h-14 w-full items-center gap-3 py-3 text-left",
                complete ? "hover:text-accent-ink" : "cursor-default",
              )}
              aria-label={
                complete
                  ? `Change ${row.label}`
                  : `${row.label} not completed`
              }
            >
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full border",
                  complete
                    ? "border-accent bg-accent-soft text-accent-ink"
                    : active
                      ? "border-line-strong bg-paper-2 text-ink"
                      : "border-line bg-paper text-mute",
                )}
              >
                {complete ? (
                  <Check aria-hidden size={15} />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-mute">
                  {row.label}
                </span>
                <span className="block truncate text-sm font-semibold text-ink">
                  {row.value || (active ? "Current question" : "Not answered")}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function Review({
  draft,
  assumptions,
  saving,
  error,
  onEdit,
  onSubmit,
}: {
  draft: QuickSetupDraft;
  assumptions: string[];
  saving: boolean;
  error: string | null;
  onEdit: (stage: QuickSetupStage) => void;
  onSubmit: () => void;
}) {
  const split = draft.primaryPriority
    ? QUICK_SETUP_SPLITS[draft.primaryPriority]
    : null;
  return (
    <div className="p-5 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-good-soft text-good">
          <CheckCircle2 aria-hidden size={22} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-good">
            Review
          </p>
          <h1
            id="setup-title"
            className="mt-1 text-2xl font-bold tracking-[-0.03em] text-ink sm:text-3xl"
          >
            Your starter dashboard is ready.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
            Check the few numbers below. Nothing is saved until you choose Build my dashboard.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <ReviewCard title="You and your work" onEdit={() => onEdit("ABOUT")}>
          <p className="font-semibold text-ink">
            {draft.preferredName} · {draft.city}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {draft.workTypes
              ?.map((type) => QUICK_SETUP_WORK_LABELS[type])
              .join(", ")} · {draft.sourceName} · {draft.workDaysPerWeek} days/week
          </p>
        </ReviewCard>
        <ReviewCard title="Weekly take-home" onEdit={() => onEdit("INCOME")}>
          <p className="font-semibold text-ink">
            {money(draft.lowWeekIncome)} – {money(draft.goodWeekIncome)}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Normal week {money(draft.typicalWeekIncome)} · next payout {displayDate(draft.nextPayoutDate)}
          </p>
        </ReviewCard>
        <ReviewCard title="Protected first" onEdit={() => onEdit("COSTS")}>
          <p className="font-semibold text-ink">
            {money(draft.weeklyWorkCosts)} work costs/week
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {draft.typicalWeekIncome
              ? money(quickSetupSafetyBuffer(draft.typicalWeekIncome))
              : "—"} starter forgotten-expense buffer
          </p>
        </ReviewCard>
        <ReviewCard title="Money now" onEdit={() => onEdit("MONEY")}>
          <p className="font-semibold text-ink">
            {money(draft.openingBalance)} available
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {money(draft.currentCushion)} already kept for emergencies
          </p>
        </ReviewCard>
        <ReviewCard title="Important bills" onEdit={() => onEdit("BILLS")}>
          {draft.commitments?.length ? (
            <div className="space-y-1 text-sm">
              {draft.commitments.map((bill) => (
                <p key={`${bill.title}-${bill.dueDate}`} className="text-ink">
                  <span className="font-semibold">{bill.title}</span> · {money(bill.amount)} · {displayDate(bill.dueDate)}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-soft">
              None added. You can add bills later.
            </p>
          )}
        </ReviewCard>
        <ReviewCard
          title="Dashboard focus"
          onEdit={() => onEdit("PRIORITY")}
        >
          <p className="font-semibold text-ink">
            {draft.primaryPriority
              ? QUICK_SETUP_PRIORITY_LABELS[draft.primaryPriority]
              : "Not chosen"}
          </p>
          {split && (
            <p className="mt-1 text-sm text-ink-soft">
              Starter split: {split.essentialsPct}% needs · {split.workCostsPct}% work · {split.emergencyPct}% emergency · {split.longTermPct}% investment · {split.flexiblePct}% flexible
            </p>
          )}
        </ReviewCard>
      </div>

      {assumptions.length > 0 && (
        <div className="mt-5 rounded-xl border border-line bg-paper-2 p-4">
          <p className="text-sm font-bold text-ink">Starter estimates we made</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-ink-soft">
            {assumptions.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-mute">You can change these after setup.</p>
        </div>
      )}

      {error && (
        <p
          className="mt-5 rounded-xl bg-bad-soft p-3 text-sm font-semibold text-bad"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-xs leading-5 text-mute">
          This creates a planning dashboard only. Future payouts remain estimates and no money is moved.
        </p>
        <Button
          variant="accent"
          size="xl"
          loading={saving}
          loadingLabel="Building dashboard"
          onClick={onSubmit}
        >
          <ShieldCheck aria-hidden size={19} />
          Build my dashboard
        </Button>
      </div>
    </div>
  );
}

function ReviewCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-paper p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-mute">
          {title}
        </h2>
        <button
          type="button"
          onClick={onEdit}
          className="min-h-11 px-2 text-sm font-semibold text-accent-ink hover:underline"
        >
          Change
        </button>
      </div>
      {children}
    </section>
  );
}
