import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { File } from "expo-file-system";
import {
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Mic,
  Send,
  ShieldCheck,
  Square,
} from "lucide-react-native";
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
import {
  Button,
  Card,
  Field,
  Label,
  Loading,
  Notice,
  Progress,
  Screen,
  formatDate,
  formatMoney,
  ui,
} from "@/components/ui";
import { apiFetch, apiUpload } from "@/lib/api";
import { colorString, colors, radius, space } from "@/constants/theme";
import { useAuth } from "@/providers/auth-provider";

type Answers = Partial<Record<QuickSetupStage, string>>;
type Assumptions = Partial<Record<QuickSetupStage, string[]>>;
type SavedSetup = {
  stage: QuickSetupStage;
  draft: QuickSetupDraft;
  answers: Answers;
  assumptions: Assumptions;
};

const SETUP_STAGES = QUICK_SETUP_STAGE_ORDER.filter(
  (stage) => stage !== "REVIEW",
);
const priorityOrder = Object.keys(
  QUICK_SETUP_PRIORITY_LABELS,
) as GigPriority[];

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
  return {
    stage:
      missing && stageIndex(savedStage) > stageIndex(missing)
        ? missing
        : savedStage,
    draft: parsedDraft.data,
    answers:
      raw.answers && typeof raw.answers === "object" ? raw.answers : {},
    assumptions:
      raw.assumptions && typeof raw.assumptions === "object"
        ? raw.assumptions
        : {},
  };
}

function dateLabel(value?: string) {
  return value ? formatDate(`${value}T12:00:00`) : "Not added";
}

export default function Onboarding() {
  const { user, reloadUser } = useAuth();
  const draftKey = useMemo(
    () => `superfinz:quick-dashboard-setup:v1:${user?.id ?? "pending"}`,
    [user?.id],
  );
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 100);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppingVoice = useRef(false);
  const recordingActive = useRef(false);
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
  const [startingVoice, setStartingVoice] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const currentIndex = stageIndex(stage);
  const currentQuestion =
    stage === "REVIEW" ? null : QUICK_SETUP_QUESTIONS[stage];
  const progress = Math.round(
    (Math.min(currentIndex + 1, SETUP_STAGES.length) / SETUP_STAGES.length) *
      100,
  );
  const allAssumptions = Object.values(assumptions).flat();
  const busy = sending || startingVoice || transcribing || saving;
  const recording = recorderState.isRecording;

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(draftKey)
      .then((raw) => {
        if (!active || !raw) return;
        const saved = cleanSavedSetup(JSON.parse(raw));
        if (!saved) return;
        setStage(saved.stage);
        setDraft(saved.draft);
        setAnswers(saved.answers);
        setAssumptions(saved.assumptions);
        setAnswer(saved.answers[saved.stage] ?? "");
      })
      .catch(() => undefined)
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, [draftKey]);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      AsyncStorage.setItem(
        draftKey,
        JSON.stringify({ stage, draft, answers, assumptions }),
      ).catch(() => undefined);
    }, 200);
    return () => clearTimeout(timer);
  }, [answers, assumptions, draft, draftKey, ready, stage]);

  useEffect(() => {
    if (!ready || stage !== "ABOUT" || answer) return;
    const firstName = user?.name?.trim().split(/\s+/)[0];
    if (firstName) setAnswer(`${firstName}, `);
  }, [answer, ready, stage, user?.name]);

  useEffect(
    () => () => {
      if (stopTimer.current) clearTimeout(stopTimer.current);
    },
    [],
  );

  const moveTo = useCallback(
    (target: QuickSetupStage) => {
      setStage(target);
      setAnswer(answers[target] ?? "");
      setConfirmation(null);
      setError(null);
    },
    [answers],
  );

  const goBack = useCallback(() => {
    if (stage === "ABOUT") return;
    setResumeStage(null);
    moveTo(previousStage(stage));
  }, [moveTo, stage]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (stage === "ABOUT") return false;
          goBack();
          return true;
        },
      );
      return () => subscription.remove();
    }, [goBack, stage]),
  );

  const editStage = (target: QuickSetupStage) => {
    if (stageIndex(stage) > stageIndex(target)) setResumeStage(stage);
    moveTo(target);
  };

  const askAssistant = async (voiceAnswer?: string) => {
    if (stage === "PRIORITY" || stage === "REVIEW" || busy) return;
    const text = (voiceAnswer ?? answer).trim();
    if (!text) {
      setError("Type an answer or use the microphone.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const result = await apiFetch<QuickSetupAssistantResponse>(
        "/api/gig/onboarding/assistant",
        {
          method: "POST",
          body: JSON.stringify({ stage, answer: text }),
        },
      );
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
      setTimeout(() => moveTo(upcoming), 300);
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

  const startVoice = async () => {
    if (busy || recordingActive.current) return;
    setStartingVoice(true);
    setError(null);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError("Microphone access is off. Allow it in Settings, or type instead.");
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      recordingActive.current = true;
      stopTimer.current = setTimeout(() => void stopVoice(), 25_000);
    } catch {
      recordingActive.current = false;
      setError("Couldn’t start the microphone. You can still type your answer.");
    } finally {
      setStartingVoice(false);
    }
  };

  const stopVoice = async () => {
    if (stoppingVoice.current || !recordingActive.current) return;
    stoppingVoice.current = true;
    recordingActive.current = false;
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = null;
    setError(null);
    try {
      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      if (!recorder.uri) throw new Error("No recording was created");
      setTranscribing(true);
      const form = new FormData();
      const audioFile = new File(recorder.uri);
      form.append(
        "audio",
        {
          name: "setup-answer.m4a",
          type: "audio/mp4",
          bytes: () => audioFile.bytes(),
        } as unknown as Blob,
      );
      const result = await apiUpload<{ transcript: string }>(
        "/api/gig/coach/transcribe",
        form,
      );
      setAnswer(result.transcript);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Couldn’t understand that. Please try again.",
      );
    } finally {
      setTranscribing(false);
      stoppingVoice.current = false;
    }
  };

  const choosePriority = (priority: GigPriority) => {
    setResumeStage(null);
    setDraft((current) => ({ ...current, primaryPriority: priority }));
    setAnswers((current) => ({
      ...current,
      PRIORITY: QUICK_SETUP_PRIORITY_LABELS[priority],
    }));
    setTimeout(() => moveTo("REVIEW"), 200);
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
      await apiFetch("/api/gig/onboarding", {
        method: "POST",
        body: JSON.stringify(buildQuickOnboardingPayload(draft)),
      });
      await AsyncStorage.removeItem(draftKey);
      await reloadUser();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Check your connection and try again.",
      );
      setSaving(false);
    }
  };

  if (!ready) return <Loading label="Preparing your quick setup…" />;

  const stepLabel =
    stage === "REVIEW"
      ? "Ready to review"
      : `Step ${currentIndex + 1} of ${SETUP_STAGES.length}`;

  return (
    <Screen
      eyebrow={stepLabel}
      title="Quick dashboard setup"
      subtitle="Answer in your own words. Type or use the microphone."
      back={stage !== "ABOUT"}
      onBack={goBack}
      help={{
        title: "Quick dashboard setup",
        body: "The assistant only turns your answers into setup fields. Check everything before saving. Voice recordings are transcribed and are not saved by SuperFinz.",
      }}
    >
      <View style={styles.progressBlock}>
        <Progress
          label={`${stepLabel}: dashboard setup`}
          value={stage === "REVIEW" ? 100 : progress}
        />
        <Text style={ui.caption}>Your progress is saved on this device.</Text>
      </View>

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
        <Card>
          <AssistantQuestion
            title={currentQuestion?.title ?? "Your main goal"}
            question={currentQuestion?.question ?? "What should come first?"}
          />
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Main dashboard goal"
            style={styles.priorityList}
          >
            {priorityOrder.map((priority) => {
              const selected = draft.primaryPriority === priority;
              return (
                <Pressable
                  key={priority}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => choosePriority(priority)}
                  style={({ pressed }) => [
                    styles.priority,
                    selected && styles.prioritySelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      selected && { color: colors.accent },
                    ]}
                  >
                    {QUICK_SETUP_PRIORITY_LABELS[priority]}
                  </Text>
                  <ChevronRight
                    accessible={false}
                    color={colorString(selected ? colors.accent : colors.muted)}
                    size={19}
                  />
                </Pressable>
              );
            })}
          </View>
          <Text style={ui.small}>
            This changes what appears first and adjusts your starter payout plan. You can change it later.
          </Text>
        </Card>
      ) : (
        <>
          {confirmation && (
            <Notice tone="good" live>
              {confirmation}
            </Notice>
          )}
          <Card tone="tint">
            <AssistantQuestion
              title={currentQuestion?.title ?? "Quick setup"}
              question={currentQuestion?.question ?? "Tell me about you."}
              example={currentQuestion?.example}
            />
          </Card>

          <Card>
            <Field
              label="Your answer"
              accessibilityLabel="Your answer"
              accessibilityHint={currentQuestion?.example}
              value={answer}
              onChangeText={(value) => {
                setAnswer(value);
                if (error) setError(null);
              }}
              placeholder={currentQuestion?.example?.replace(
                "For example: ",
                "",
              )}
              multiline
              numberOfLines={4}
              maxLength={500}
              editable={!busy && !recording}
              textAlignVertical="top"
              style={styles.answerInput}
              error={error}
            />

            {stage === "BILLS" && (
              <Button
                title="No bills or subscriptions"
                tone="soft"
                size="sm"
                inline
                disabled={busy || recording}
                onPress={() =>
                  void askAssistant("No bills or subscriptions to add right now")
                }
              />
            )}

            <View style={styles.actions}>
              <Button
                title={
                  recording
                    ? "Stop"
                    : startingVoice
                      ? "Starting…"
                      : transcribing
                        ? "Transcribing…"
                        : "Speak"
                }
                icon={recording ? Square : Mic}
                tone={recording ? "dangerSoft" : "quiet"}
                style={styles.action}
                disabled={sending || startingVoice || transcribing || saving}
                onPress={() => (recording ? void stopVoice() : void startVoice())}
              />
              <Button
                title="Send"
                icon={Send}
                tone="accent"
                style={styles.action}
                loading={sending}
                disabled={
                  startingVoice || recording || transcribing || !answer.trim()
                }
                onPress={() => void askAssistant()}
              />
            </View>

            <View style={styles.privacyRow}>
              <ShieldCheck
                accessible={false}
                color={colorString(colors.accent)}
                size={17}
              />
              <Text style={[ui.caption, styles.privacyText]}>
                Voice is transcribed, not saved by SuperFinz.
              </Text>
            </View>
          </Card>
        </>
      )}

      <Notice tone="info">
        AI only fills this setup from your words. It cannot move money, and you review everything before saving.
      </Notice>
    </Screen>
  );
}

function AssistantQuestion({
  title,
  question,
  example,
}: {
  title: string;
  question: string;
  example?: string;
}) {
  return (
    <View style={styles.questionRow}>
      <View style={styles.botTile}>
        <Bot
          accessible={false}
          color={colorString(colors.onPrimary)}
          size={21}
        />
      </View>
      <View style={styles.grow}>
        <Label tone="accent">{title}</Label>
        <Text accessibilityRole="header" style={ui.h2}>
          {question}
        </Text>
        {example && <Text style={ui.small}>{example}</Text>}
      </View>
    </View>
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
    <View style={ui.gap}>
      <Card tone="good">
        <View style={styles.questionRow}>
          <View style={styles.doneTile}>
            <CheckCircle2
              accessible={false}
              color={colorString(colors.good)}
              size={22}
            />
          </View>
          <View style={styles.grow}>
            <Label>Review</Label>
            <Text accessibilityRole="header" style={ui.h2}>
              Your starter dashboard is ready
            </Text>
            <Text style={ui.small}>
              Check these details. Nothing is saved until you build the dashboard.
            </Text>
          </View>
        </View>
      </Card>

      <ReviewRow title="You and your work" onEdit={() => onEdit("ABOUT")}>
        <Text style={ui.bodyStrong}>
          {draft.preferredName} · {draft.city}
        </Text>
        <Text style={ui.small}>
          {draft.workTypes
            ?.map((type) => QUICK_SETUP_WORK_LABELS[type])
            .join(", ")} · {draft.sourceName} · {draft.workDaysPerWeek} days/week
        </Text>
      </ReviewRow>
      <ReviewRow title="Weekly take-home" onEdit={() => onEdit("INCOME")}>
        <Text style={ui.bodyStrong}>
          {formatMoney(draft.lowWeekIncome ?? 0)}–
          {formatMoney(draft.goodWeekIncome ?? 0)}
        </Text>
        <Text style={ui.small}>
          Normal {formatMoney(draft.typicalWeekIncome ?? 0)} · next payout {dateLabel(draft.nextPayoutDate)}
        </Text>
      </ReviewRow>
      <ReviewRow title="Protected first" onEdit={() => onEdit("COSTS")}>
        <Text style={ui.bodyStrong}>
          {formatMoney(draft.weeklyWorkCosts ?? 0)} work costs/week
        </Text>
        <Text style={ui.small}>
          {formatMoney(
            draft.typicalWeekIncome
              ? quickSetupSafetyBuffer(draft.typicalWeekIncome)
              : 0,
          )} forgotten-expense buffer
        </Text>
      </ReviewRow>
      <ReviewRow title="Money now" onEdit={() => onEdit("MONEY")}>
        <Text style={ui.bodyStrong}>
          {formatMoney(draft.openingBalance ?? 0)} available
        </Text>
        <Text style={ui.small}>
          {formatMoney(draft.currentCushion ?? 0)} already kept for emergencies
        </Text>
      </ReviewRow>
      <ReviewRow title="Bills and subscriptions" onEdit={() => onEdit("BILLS")}>
        {draft.commitments?.length ? (
          draft.commitments.map((bill) => (
            <Text key={`${bill.title}-${bill.dueDate}`} style={ui.small}>
              {bill.title} · {formatMoney(bill.amount)} · {dateLabel(bill.dueDate)} · {bill.essential ? "Essential" : "Optional"}
            </Text>
          ))
        ) : (
          <Text style={ui.small}>None added. You can add bills later.</Text>
        )}
      </ReviewRow>
      <ReviewRow
        title="Dashboard focus"
        onEdit={() => onEdit("PRIORITY")}
      >
        <Text style={ui.bodyStrong}>
          {draft.primaryPriority
            ? QUICK_SETUP_PRIORITY_LABELS[draft.primaryPriority]
            : "Not chosen"}
        </Text>
        {split && (
          <Text style={ui.small}>
            {split.essentialsPct}% needs · {split.workCostsPct}% work · {split.emergencyPct}% emergency · {split.longTermPct}% investment · {split.flexiblePct}% flexible
          </Text>
        )}
      </ReviewRow>

      {assumptions.length > 0 && (
        <Card tone="plain">
          <Text style={ui.bodyStrong}>Starter estimates we made</Text>
          {assumptions.map((item) => (
            <Text key={item} style={ui.small}>• {item}</Text>
          ))}
          <Text style={ui.caption}>You can change these after setup.</Text>
        </Card>
      )}

      {error && (
        <Notice tone="bad" live>
          {error}
        </Notice>
      )}

      <Button
        title="Build my dashboard"
        icon={ShieldCheck}
        tone="accent"
        size="lg"
        loading={saving}
        onPress={onSubmit}
      />
      <Text style={[ui.caption, styles.centerText]}>
        This creates a plan only. Future payouts stay estimates and no real money is moved.
      </Text>
    </View>
  );
}

function ReviewRow({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <Card>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewTitleRow}>
          <Check
            accessible={false}
            color={colorString(colors.good)}
            size={17}
          />
          <Label>{title}</Label>
        </View>
        <Button
          title="Change"
          tone="ghost"
          size="sm"
          inline
          onPress={onEdit}
        />
      </View>
      <View style={ui.gapSm}>{children}</View>
    </Card>
  );
}

const styles = StyleSheet.create({
  progressBlock: { gap: space.sm },
  questionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
  },
  botTile: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  doneTile: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  grow: { flex: 1, gap: 6 },
  answerInput: { minHeight: 112, paddingTop: 13 },
  actions: { flexDirection: "row", gap: space.sm },
  action: { flex: 1 },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  privacyText: { flex: 1 },
  priorityList: { gap: space.sm },
  priority: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  prioritySelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  priorityText: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  pressed: { opacity: 0.72 },
  reviewHeader: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
  },
  reviewTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  centerText: { textAlign: "center" },
});
