import { useRef, useState } from "react";
import {
  ActivityIndicator,
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
  PiggyBank,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react-native";
import { Button, Card, Field, Label, Screen } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { colors, shadow } from "@/constants/theme";

type Message = { role: "user" | "assistant"; content: string };
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

export default function Coach() {
  const list = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = async (question: string, append = true) => {
    const prompt = question.trim();
    if (!prompt || sending) return;
    if (append)
      setMessages((items) => [...items, { role: "user", content: prompt }]);
    setText("");
    setSending(true);
    setFailed(null);
    setError(null);
    try {
      const result = await apiFetch<{ reply: string }>("/api/gig/coach", {
        method: "POST",
        body: JSON.stringify({ message: prompt }),
      });
      setMessages((items) => [
        ...items,
        { role: "assistant", content: result.reply },
      ]);
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

  return (
    <Screen
      title="Money Coach"
      subtitle="Simple answers using your current plan."
      help={{
        title: "Your Money Coach",
        body: "Coach explains the numbers already saved in SuperFinz. It cannot move money, approve loans, or see information outside this app.",
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
                      Ask about spending, payouts, bills, or your safety money.
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
              {messages.map((message, index) => (
                <View
                  key={`${message.role}-${index}`}
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
                    accessibilityLabel={`${message.role === "user" ? "You" : "Coach"}: ${message.content}`}
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
                      {message.content}
                    </Text>
                  </View>
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
          <Button
            title="Send"
            loading={sending}
            disabled={!text.trim()}
            onPress={() => ask(text)}
          />
        </View>
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
  thinking: { flexDirection: "row", alignItems: "center", gap: 10 },
  errorCard: { borderColor: colors.red, shadowOpacity: 0 },
  errorTitle: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  error: { color: colors.red, fontSize: 14, lineHeight: 20 },
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
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
});
