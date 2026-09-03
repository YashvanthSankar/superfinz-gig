import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  CircleHelp,
  Clock3,
  MessageCircle,
  Mic,
  PiggyBank,
  ShieldCheck,
  Square,
  Volume2,
  type LucideIcon,
} from "lucide-react-native";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { File } from "expo-file-system";
import * as Speech from "expo-speech";
import { Button, Card, Field, Label, Screen } from "@/components/ui";
import { apiFetch, apiUpload } from "@/lib/api";
import { colors, shadow } from "@/constants/theme";

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
  const stoppingVoice = useRef(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (stopTimer.current) clearTimeout(stopTimer.current);
      void Speech.stop();
      if (recorder.isRecording) void recorder.stop();
    },
    [recorder],
  );

  const speak = async (content: string, messageId: number) => {
    if (speakingId === messageId) {
      await Speech.stop();
      setSpeakingId(null);
      return;
    }
    await Speech.stop();
    const plain = plainCoachText(content);
    setSpeakingId(messageId);
    Speech.speak(plain, {
      language: speechLanguage(plain),
      rate: 0.9,
      pitch: 1,
      onDone: () => setSpeakingId(null),
      onStopped: () => setSpeakingId(null),
      onError: () => {
        setSpeakingId(null);
        setVoiceError("Couldn’t play that answer aloud.");
      },
    });
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
    if (sending || transcribing || recorder.isRecording) return;
    setVoiceError(null);
    await Speech.stop();
    setSpeakingId(null);
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
      stopTimer.current = setTimeout(() => {
        void stopVoiceAndAsk();
      }, 30_000);
    } catch {
      setVoiceError("Couldn’t start the microphone. You can still type below.");
    }
  };

  const stopVoiceAndAsk = async () => {
    if (stoppingVoice.current || !recorder.isRecording) return;
    stoppingVoice.current = true;
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
      setVoiceError(
        cause instanceof Error
          ? cause.message
          : "Couldn’t understand that. Please try again.",
      );
    } finally {
      stoppingVoice.current = false;
    }
  };

  return (
    <Screen
      title="Money Coach"
      subtitle="Simple answers using your current plan."
      help={{
        title: "Your Money Coach",
        body: "Type or tap the microphone and speak. Coach explains the numbers already saved in SuperFinz. It cannot move money, approve loans, or see information outside this app.",
      }}
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
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => {
            if (messages.length || sending)
              list.current?.scrollToEnd({ animated: true });
          }}
        >
          {!messages.length && !sending ? (
            <View style={styles.start}>
              <Card style={styles.welcome}>
                <View style={styles.welcomeHeading}>
                  <View style={styles.coachIcon}>
                    <MessageCircle
                      accessible={false}
                      color={colors.white}
                      size={23}
                      strokeWidth={2.2}
                    />
                  </View>
                  <View style={styles.welcomeCopy}>
                    <Text
                      accessibilityRole="header"
                      style={styles.welcomeTitle}
                    >
                      What would you like to understand?
                    </Text>
                    <Text style={styles.welcomeBody}>
                      Type or speak about spending, payouts, bills, or your
                      safety money.
                    </Text>
                  </View>
                </View>
                <View style={styles.safetyNote}>
                  <ShieldCheck
                    accessible={false}
                    color={colors.accent as string}
                    size={18}
                    strokeWidth={2.2}
                  />
                  <Text style={styles.safetyText}>
                    Coach gives guidance only. Your question and a small summary
                    of this plan may be sent to our AI provider. It never moves
                    your money.
                  </Text>
                </View>
              </Card>

              <View style={styles.questionSection}>
                <Label>CHOOSE A QUESTION</Label>
                <View style={styles.suggestionList}>
                  {suggestions.map((item) => (
                    <SuggestionButton
                      key={item.title}
                      suggestion={item}
                      disabled={sending}
                      onPress={() => ask(item.prompt)}
                    />
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.conversation}>
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={
                    message.role === "user"
                      ? styles.userMessage
                      : styles.coachMessage
                  }
                >
                  <Text style={styles.speaker}>
                    {message.role === "user" ? "You" : "Coach"}
                  </Text>
                  <View
                    accessible
                    accessibilityLabel={`${message.role === "user" ? "You" : "Coach"}: ${message.role === "assistant" ? plainCoachText(message.content) : message.content}`}
                    style={[
                      styles.bubble,
                      message.role === "user" ? styles.user : styles.assistant,
                    ]}
                  >
                    <Text
                      style={[
                        styles.message,
                        message.role === "user" && styles.userMessageText,
                      ]}
                    >
                      {message.role === "assistant"
                        ? plainCoachText(message.content)
                        : message.content}
                    </Text>
                  </View>
                  {message.role === "assistant" && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        speakingId === message.id
                          ? "Stop reading this answer"
                          : "Read this answer aloud"
                      }
                      accessibilityState={{
                        selected: speakingId === message.id,
                      }}
                      onPress={() => void speak(message.content, message.id)}
                      style={({ pressed }) => [
                        styles.listenButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      {speakingId === message.id ? (
                        <Square
                          accessible={false}
                          color={colors.accent as string}
                          size={15}
                        />
                      ) : (
                        <Volume2
                          accessible={false}
                          color={colors.accent as string}
                          size={17}
                        />
                      )}
                      <Text style={styles.listenText}>
                        {speakingId === message.id ? "Stop voice" : "Listen"}
                      </Text>
                    </Pressable>
                  )}
                </View>
              ))}
              {sending && (
                <View
                  accessibilityLiveRegion="polite"
                  style={styles.coachMessage}
                >
                  <Text style={styles.speaker}>Coach</Text>
                  <View
                    style={[styles.bubble, styles.assistant, styles.thinking]}
                  >
                    <ActivityIndicator color={colors.accent} size="small" />
                    <Text style={styles.message}>
                      Checking your latest plan…
                    </Text>
                  </View>
                </View>
              )}
              {error && (
                <Card
                  accessibilityLiveRegion="assertive"
                  style={styles.errorCard}
                >
                  <Text accessibilityRole="alert" style={styles.errorTitle}>
                    Couldn’t get an answer
                  </Text>
                  <Text style={styles.error}>{error}</Text>
                  {failed && (
                    <Button
                      title="Try again"
                      tone="quiet"
                      onPress={() => ask(failed, false)}
                    />
                  )}
                </Card>
              )}
            </View>
          )}
        </ScrollView>

        {(recorderState.isRecording || transcribing || voiceError) && (
          <View
            accessibilityLiveRegion={voiceError ? "assertive" : "polite"}
            style={[
              styles.voiceStatus,
              voiceError && styles.voiceStatusError,
            ]}
          >
            {transcribing ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : (
              <Mic
                accessible={false}
                color={(voiceError ? colors.red : colors.accent) as string}
                size={18}
              />
            )}
            <Text
              accessibilityRole={voiceError ? "alert" : undefined}
              style={[
                styles.voiceStatusText,
                voiceError && styles.voiceStatusErrorText,
              ]}
            >
              {voiceError
                ? voiceError
                : transcribing
                  ? "Turning your recording into text…"
                  : `Listening… ${Math.min(30, Math.floor(recorderState.durationMillis / 1000))} of 30 seconds`}
            </Text>
          </View>
        )}

        <View style={styles.composer}>
          <View style={styles.inputWrap}>
            <Field
              accessibilityLabel="Ask the money coach"
              accessibilityHint="Type a question about your current money plan"
              value={text}
              onChangeText={setText}
              placeholder="Type your question"
              maxLength={400}
              onSubmitEditing={() => ask(text)}
              returnKeyType="send"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              recorderState.isRecording
                ? "Stop recording and ask"
                : "Start a voice question"
            }
            accessibilityHint="Records for up to 30 seconds and shows the transcript in this chat"
            accessibilityState={{ disabled: sending || transcribing }}
            disabled={sending || transcribing}
            onPress={() =>
              recorderState.isRecording
                ? void stopVoiceAndAsk()
                : void startVoice()
            }
            style={({ pressed }) => [
              styles.micButton,
              recorderState.isRecording && styles.micButtonRecording,
              pressed && styles.pressed,
              (sending || transcribing) && styles.disabled,
            ]}
          >
            {transcribing ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : recorderState.isRecording ? (
              <Square accessible={false} color={colors.white} size={18} />
            ) : (
              <Mic accessible={false} color={colors.white} size={20} />
            )}
          </Pressable>
          <Button
            title="Send"
            loading={sending}
            disabled={!text.trim() || recorderState.isRecording || transcribing}
            onPress={() => ask(text)}
          />
        </View>
        <Text style={styles.voicePrivacy}>
          Voice is sent only for transcription and is not saved by SuperFinz.
        </Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function SuggestionButton({
  suggestion,
  disabled,
  onPress,
}: {
  suggestion: Suggestion;
  disabled: boolean;
  onPress: () => void;
}) {
  const Icon = suggestion.icon;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={suggestion.title}
      accessibilityHint={suggestion.detail}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.suggestion,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.suggestionIcon}>
        <Icon
          accessible={false}
          color={colors.accent as string}
          size={20}
          strokeWidth={2.1}
        />
      </View>
      <View style={styles.suggestionCopy}>
        <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
        <Text style={styles.suggestionDetail}>{suggestion.detail}</Text>
      </View>
      <Text accessible={false} style={styles.chevron}>
        ›
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, gap: 12 },
  messages: { flexGrow: 1, paddingBottom: 8 },
  start: { gap: 20, paddingBottom: 12 },
  welcome: { gap: 16 },
  welcomeHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  coachIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.actionStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeCopy: { flex: 1, gap: 5 },
  welcomeTitle: {
    color: colors.ink,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "700",
    letterSpacing: -0.25,
  },
  welcomeBody: {
    color: colors.inkSoft,
    fontSize: 15,
    lineHeight: 22,
  },
  safetyNote: {
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  safetyText: {
    flex: 1,
    color: colors.inkSoft,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  questionSection: { gap: 10 },
  suggestionList: { gap: 9 },
  suggestion: {
    minHeight: 66,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    ...shadow,
  },
  suggestionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionCopy: { flex: 1, gap: 2 },
  suggestionTitle: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  suggestionDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  chevron: {
    color: colors.muted,
    fontSize: 25,
    lineHeight: 28,
    fontWeight: "500",
  },
  conversation: { gap: 16, paddingVertical: 4 },
  coachMessage: { alignSelf: "flex-start", maxWidth: "92%", gap: 5 },
  userMessage: { alignSelf: "flex-end", maxWidth: "88%", gap: 5 },
  speaker: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  bubble: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  assistant: { backgroundColor: colors.surface },
  user: {
    borderColor: colors.actionStrong,
    backgroundColor: colors.actionStrong,
  },
  message: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 24,
  },
  userMessageText: { color: colors.white },
  listenButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  listenText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  thinking: { flexDirection: "row", alignItems: "center", gap: 10 },
  errorCard: { borderColor: colors.red, shadowOpacity: 0 },
  errorTitle: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  error: { color: colors.red, fontSize: 14, lineHeight: 20 },
  voiceStatus: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 13,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  voiceStatusError: {
    borderColor: colors.red,
    backgroundColor: colors.surface,
  },
  voiceStatusText: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  voiceStatusErrorText: { color: colors.red },
  composer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    backgroundColor: colors.surface,
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    ...shadow,
  },
  inputWrap: { flex: 1 },
  micButton: {
    width: 50,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  micButtonRecording: { backgroundColor: colors.actionStrong },
  voicePrivacy: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
});
