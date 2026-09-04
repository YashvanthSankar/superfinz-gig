import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Bot,
  CircleHelp,
  Clock3,
  Mic,
  PiggyBank,
  RotateCcw,
  Send,
  Share2,
  ShieldCheck,
  Square,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  type LucideIcon,
} from "lucide-react-native";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { File, Paths } from "expo-file-system";
import * as Speech from "expo-speech";
import {
  Button,
  Card,
  Divider,
  Expandable,
  Field,
  IconButton,
  ListRow,
  Notice,
  Screen,
  SectionHeader,
  ui,
} from "@/components/ui";
import { apiBinary, apiFetch, apiUpload } from "@/lib/api";
import { colorString, colors, radius, space } from "@/constants/theme";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};
type Suggestion = {
  title: string;
  detail: string;
  prompt: string;
  icon: LucideIcon;
};
type VoiceNotice = { tone: "warn" | "bad"; text: string };
type Feedback = "up" | "down";

const suggestions: Suggestion[] = [
  {
    title: "What can I safely spend?",
    detail: "Check today’s free money",
    prompt: "How much can I safely spend today?",
    icon: ShieldCheck,
  },
  {
    title: "What if my payout is late?",
    detail: "See what stays protected",
    prompt: "What if my next payout is late?",
    icon: Clock3,
  },
  {
    title: "How do I grow my cushion?",
    detail: "Get one small next step",
    prompt: "What is one simple way to grow my emergency cushion?",
    icon: PiggyBank,
  },
  {
    title: "Why did my safe amount change?",
    detail: "Understand the calculation",
    prompt: "Why did my safe-to-spend amount change?",
    icon: CircleHelp,
  },
];

const plainCoachText = (value: string) =>
  value
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const speechLanguage = (value: string) => {
  if (/\p{Script=Devanagari}/u.test(value)) return "hi-IN";
  if (/\p{Script=Tamil}/u.test(value)) return "ta-IN";
  if (/\p{Script=Telugu}/u.test(value)) return "te-IN";
  if (/\p{Script=Kannada}/u.test(value)) return "kn-IN";
  if (/\p{Script=Malayalam}/u.test(value)) return "ml-IN";
  return "en-IN";
};

export default function Coach() {
  const list = useRef<ScrollView>(null);
  const nextMessageId = useRef(1);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppingVoice = useRef(false);
  const recordingActive = useRef(false);
  const voiceRequest = useRef(0);
  const voiceFile = useRef<File | null>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const voicePlayer = useAudioPlayer(null, { updateInterval: 250 });
  const voicePlayerState = useAudioPlayerStatus(voicePlayer);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [voiceLoadingId, setVoiceLoadingId] = useState<number | null>(null);
  const [voiceError, setVoiceError] = useState<VoiceNotice | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emptyWarning, setEmptyWarning] = useState(false);
  const [feedback, setFeedback] = useState<
    Record<number, Feedback | undefined>
  >({});

  useEffect(
    () => () => {
      if (stopTimer.current) clearTimeout(stopTimer.current);
      if (warnTimer.current) clearTimeout(warnTimer.current);
      voiceRequest.current += 1;
      void Speech.stop();
      const cachedVoice = voiceFile.current;
      voiceFile.current = null;
      if (cachedVoice) {
        try {
          cachedVoice.delete();
        } catch {
          // The OS can clear cache files before this cleanup runs.
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!voicePlayerState.didJustFinish || speakingId === null) return;
    setSpeakingId(null);
    const cachedVoice = voiceFile.current;
    voiceFile.current = null;
    if (cachedVoice) {
      try {
        cachedVoice.delete();
      } catch {
        // Cache cleanup is best-effort.
      }
    }
  }, [speakingId, voicePlayer, voicePlayerState.didJustFinish]);

  useEffect(() => {
    if (!voicePlayerState.error || speakingId === null) return;
    const cachedVoice = voiceFile.current;
    voiceFile.current = null;
    if (cachedVoice) {
      try {
        cachedVoice.delete();
      } catch {
        // Cache cleanup is best-effort.
      }
    }
    setSpeakingId(null);
    setVoiceError({ tone: "bad", text: "Couldn’t play that answer aloud." });
  }, [speakingId, voicePlayer, voicePlayerState.error]);

  const stopSpokenReply = async () => {
    voiceRequest.current += 1;
    try {
      voicePlayer.pause();
    } catch {
      // Expo owns the native player lifecycle during navigation and refresh.
    }
    await Speech.stop();
    const cachedVoice = voiceFile.current;
    voiceFile.current = null;
    if (cachedVoice) {
      try {
        cachedVoice.delete();
      } catch {
        // Cache cleanup is best-effort.
      }
    }
    setSpeakingId(null);
    setVoiceLoadingId(null);
  };

  const speakWithDeviceFallback = (plain: string, messageId: number) => {
    setVoiceError({
      tone: "warn",
      text: "Natural voice is unavailable, so this reply is using your device voice.",
    });
    setSpeakingId(messageId);
    Speech.speak(plain, {
      language: speechLanguage(plain),
      rate: 0.9,
      pitch: 1,
      onDone: () => setSpeakingId(null),
      onStopped: () => setSpeakingId(null),
      onError: () => {
        setSpeakingId(null);
        setVoiceError({ tone: "bad", text: "Couldn’t play that answer aloud." });
      },
    });
  };

  const speak = async (content: string, messageId: number) => {
    if (speakingId === messageId || voiceLoadingId === messageId) {
      await stopSpokenReply();
      return;
    }
    await stopSpokenReply();
    const plain = plainCoachText(content);
    const requestId = ++voiceRequest.current;
    setVoiceError(null);
    setVoiceLoadingId(messageId);
    try {
      const audio = await apiBinary("/api/gig/coach/speak", {
        method: "POST",
        body: JSON.stringify({ text: plain }),
      });
      if (requestId !== voiceRequest.current) return;

      const cachedVoice = new File(
        Paths.cache,
        `superfinz-coach-${Date.now()}.mp3`,
      );
      cachedVoice.create({ overwrite: true, intermediates: true });
      cachedVoice.write(new Uint8Array(audio));
      voiceFile.current = cachedVoice;
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      voicePlayer.replace(cachedVoice.uri);
      voicePlayer.play();
      setVoiceLoadingId(null);
      setSpeakingId(messageId);
    } catch {
      if (requestId !== voiceRequest.current) return;
      setVoiceLoadingId(null);
      speakWithDeviceFallback(plain, messageId);
    }
  };

  const ask = async (
    question: string,
    append = true,
    speakReply = false,
  ) => {
    const prompt = question.trim();
    if (!prompt || sending) return;
    if (append) {
      const userId = nextMessageId.current++;
      setMessages((items) => [
        ...items,
        { id: userId, role: "user", content: prompt },
      ]);
    }
    setText("");
    setSending(true);
    setFailed(null);
    setError(null);
    try {
      const result = await apiFetch<{ reply: string }>("/api/gig/coach", {
        method: "POST",
        body: JSON.stringify({ message: prompt }),
      });
      const assistantId = nextMessageId.current++;
      setMessages((items) => [
        ...items,
        { id: assistantId, role: "assistant", content: result.reply },
      ]);
      if (speakReply) await speak(result.reply, assistantId);
    } catch (cause) {
      setFailed(prompt);
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
    if (sending || transcribing || recordingActive.current) return;
    setVoiceError(null);
    await stopSpokenReply();
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Microphone is off",
          "Allow microphone access in Settings, or type your question instead.",
        );
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      recordingActive.current = true;
      stopTimer.current = setTimeout(() => {
        void stopVoiceAndAsk();
      }, 30_000);
    } catch {
      recordingActive.current = false;
      setVoiceError({
        tone: "bad",
        text: "Couldn’t start the microphone. You can still type below.",
      });
    }
  };

  const stopVoiceAndAsk = async () => {
    if (stoppingVoice.current || !recordingActive.current) return;
    stoppingVoice.current = true;
    recordingActive.current = false;
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = null;
    setVoiceError(null);
    try {
      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      const uri = recorder.uri;
      if (!uri) throw new Error("No recording was created");
      setTranscribing(true);
      const form = new FormData();
      const audioFile = new File(uri);
      // Expo's native fetch consumes file-backed parts through a bytes method.
      form.append(
        "audio",
        {
          name: "question.m4a",
          type: "audio/mp4",
          bytes: () => audioFile.bytes(),
        } as unknown as Blob,
      );
      const result = await apiUpload<{ transcript: string }>(
        "/api/gig/coach/transcribe",
        form,
      );
      setTranscribing(false);
      await ask(result.transcript, true, true);
    } catch (cause) {
      setTranscribing(false);
      setVoiceError({
        tone: "bad",
        text:
          cause instanceof Error
            ? cause.message
            : "Couldn’t understand that. Please try again.",
      });
    } finally {
      stoppingVoice.current = false;
    }
  };

  const submit = () => {
    if (!text.trim()) {
      setEmptyWarning(true);
      if (warnTimer.current) clearTimeout(warnTimer.current);
      warnTimer.current = setTimeout(() => setEmptyWarning(false), 3000);
      return;
    }
    void ask(text);
  };

  const changeText = (value: string) => {
    setText(value);
    if (emptyWarning) setEmptyWarning(false);
  };

  const shareAnswer = async (content: string) => {
    try {
      await Share.share({ message: plainCoachText(content) });
    } catch {
      // The share sheet was dismissed or is unavailable; nothing to recover.
    }
  };

  const rate = (id: number, value: Feedback) =>
    setFeedback((current) => ({
      ...current,
      [id]: current[id] === value ? undefined : value,
    }));

  const clearConversation = () => {
    Alert.alert(
      "Clear this conversation?",
      "The messages on this screen will be removed.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            void stopSpokenReply();
            setMessages([]);
            setFeedback({});
            setFailed(null);
            setError(null);
            setVoiceError(null);
          },
        },
      ],
    );
  };

  const recording = recorderState.isRecording;
  const hasConversation = messages.length > 0;
  const status = recording
    ? "Listening… tap Stop when you finish (up to 30 seconds)"
    : transcribing
      ? "Transcribing…"
      : voiceLoadingId !== null
        ? "Preparing the voice…"
        : sending
          ? "Checking your plan…"
          : null;

  return (
    <Screen
      eyebrow="Money coach"
      title="Coach"
      subtitle="Simple answers using your current plan."
      help={{
        title: "Coach",
        body: "Type or tap the microphone and speak. The coach explains the numbers already saved in SuperFinz. It cannot move money, approve loans or see information outside this app.",
      }}
      action={
        hasConversation ? (
          <IconButton
            icon={RotateCcw}
            label="Clear conversation"
            hint="Removes the messages on this screen"
            disabled={sending}
            onPress={clearConversation}
          />
        ) : undefined
      }
      scroll={false}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.page}
      >
        <ScrollView
          ref={list}
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.thread}
          onContentSizeChange={() => {
            if (hasConversation) list.current?.scrollToEnd({ animated: true });
          }}
        >
          {hasConversation ? (
            <View style={styles.conversation}>
              {messages.map((message) =>
                message.role === "user" ? (
                  <View
                    key={message.id}
                    accessible
                    accessibilityLabel={`You: ${message.content}`}
                    style={styles.userBubble}
                  >
                    <Text style={[ui.body, ui.num, styles.userText]}>
                      {message.content}
                    </Text>
                  </View>
                ) : (
                  <CoachMessage
                    key={message.id}
                    content={message.content}
                    reading={
                      speakingId === message.id ||
                      voiceLoadingId === message.id
                    }
                    feedback={feedback[message.id]}
                    onSpeak={() => void speak(message.content, message.id)}
                    onShare={() => void shareAnswer(message.content)}
                    onRate={(value) => rate(message.id, value)}
                  />
                ),
              )}
              <Expandable
                title="More questions"
                summary="Pick another common question"
              >
                <SuggestionList onPick={(prompt) => void ask(prompt)} />
              </Expandable>
            </View>
          ) : (
            <View style={styles.start}>
              <Card tone="tint">
                <SectionHeader
                  eyebrow="Ask anything"
                  title="What would you like to understand?"
                  description="Type or speak about spending, payouts, bills or your safety money."
                />
                <Divider />
                <Notice tone="info">
                  Your question and a short summary of your plan may be sent to
                  our AI provider; the coach never moves your money.
                </Notice>
              </Card>
              <View style={styles.section}>
                <SectionHeader eyebrow="Try asking" title="Common questions" />
                <SuggestionList onPick={(prompt) => void ask(prompt)} />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {error && (
            <Notice tone="bad" title="Couldn’t get an answer">
              <View style={styles.noticeStack}>
                <Text style={styles.noticeText}>{error}</Text>
                {failed && (
                  <Button
                    title="Retry"
                    size="sm"
                    tone="soft"
                    inline
                    loading={sending}
                    onPress={() => void ask(failed, false)}
                  />
                )}
              </View>
            </Notice>
          )}
          {voiceError && (
            <Notice tone={voiceError.tone}>{voiceError.text}</Notice>
          )}
          {emptyWarning && (
            <Notice tone="warn" live>
              Type or say a question first.
            </Notice>
          )}
          {status && (
            <Notice tone="info" live>
              {status}
            </Notice>
          )}
          <View style={styles.composer}>
            <Field
              containerStyle={styles.input}
              accessibilityLabel="Ask the money coach"
              accessibilityHint="Type a question about your current money plan"
              value={text}
              onChangeText={changeText}
              placeholder="Ask a question"
              maxLength={400}
              onSubmitEditing={submit}
              returnKeyType="send"
            />
            <IconButton
              icon={recording ? Square : Mic}
              tone={recording ? "danger" : "accent"}
              label={recording ? "Stop recording" : "Ask by voice"}
              hint="Records for up to 30 seconds and shows the transcript here"
              disabled={sending || transcribing}
              onPress={() =>
                recording ? void stopVoiceAndAsk() : void startVoice()
              }
            />
            <Button
              title="Send"
              tone="accent"
              icon={Send}
              size="md"
              inline
              loading={sending}
              disabled={recording || transcribing}
              onPress={submit}
              style={styles.send}
            />
          </View>
          <Text style={[ui.caption, styles.disclosure]}>
            Replies are read by an AI voice. Recordings are not saved.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function CoachMessage({
  content,
  reading,
  feedback,
  onSpeak,
  onShare,
  onRate,
}: {
  content: string;
  reading: boolean;
  feedback: Feedback | undefined;
  onSpeak: () => void;
  onShare: () => void;
  onRate: (value: Feedback) => void;
}) {
  const plain = plainCoachText(content);
  return (
    <View style={styles.coachRow}>
      <View accessible={false} style={styles.avatar}>
        <Bot
          accessible={false}
          color={colorString(colors.onPrimary)}
          size={16}
          strokeWidth={2.2}
        />
      </View>
      <View style={styles.coachColumn}>
        <View
          accessible
          accessibilityLabel={`Coach: ${plain}`}
          style={styles.coachBubble}
        >
          <Text style={[ui.body, ui.num, styles.coachText]}>{plain}</Text>
        </View>
        <View style={styles.actions}>
          <IconButton
            icon={reading ? Square : Volume2}
            tone="ghost"
            label={reading ? "Stop reading" : "Listen"}
            hint="Reads this answer aloud"
            active={reading}
            size={18}
            onPress={onSpeak}
          />
          <IconButton
            icon={Share2}
            tone="ghost"
            label="Share answer"
            hint="Opens the share sheet, where you can copy the text"
            size={18}
            onPress={onShare}
          />
          <IconButton
            icon={ThumbsUp}
            tone="ghost"
            label="Helpful"
            active={feedback === "up"}
            size={18}
            onPress={() => onRate("up")}
          />
          <IconButton
            icon={ThumbsDown}
            tone="ghost"
            label="Not helpful"
            active={feedback === "down"}
            size={18}
            onPress={() => onRate("down")}
          />
          {feedback && (
            <Text style={styles.actionNote}>Thanks for the feedback</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function SuggestionList({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <Card padded={false}>
      <View style={styles.listBody}>
        {suggestions.map((item, index) => (
          <ListRow
            key={item.title}
            icon={item.icon}
            title={item.title}
            subtitle={item.detail}
            chevron
            last={index === suggestions.length - 1}
            accessibilityHint="Sends this question to the coach"
            onPress={() => onPick(item.prompt)}
          />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, gap: space.md },
  thread: { flexGrow: 1, paddingBottom: space.sm },
  start: { gap: space.xl, paddingBottom: space.md },
  section: { gap: space.md },
  listBody: { paddingHorizontal: 18, paddingVertical: space.xs },
  conversation: { gap: space.lg, paddingVertical: space.xs },
  coachRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.sm,
    maxWidth: "92%",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  coachColumn: { flex: 1, minWidth: 0, gap: space.xs },
  coachBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.paper2,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  coachText: { color: colors.ink },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userText: { color: colors.onPrimary },
  actions: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 2,
    marginLeft: -6,
  },
  actionNote: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    fontWeight: "500",
    paddingHorizontal: space.sm,
  },
  footer: { gap: space.sm, paddingTop: space.xs },
  noticeStack: { gap: space.sm },
  noticeText: { fontSize: 14, lineHeight: 20, color: colors.ink },
  composer: { flexDirection: "row", alignItems: "center", gap: space.sm },
  input: { flex: 1 },
  send: { alignSelf: "center" },
  disclosure: { textAlign: "center", paddingHorizontal: space.sm },
});
