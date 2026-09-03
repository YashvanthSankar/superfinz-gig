import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, Card, Field, Screen } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { colors } from "@/constants/theme";

type Message = { role: "user" | "assistant"; content: string };
const suggestions = [
  "How much can I safely spend today?",
  "What if my payout is late?",
  "How can I grow my cushion?",
  "Explain my resilience score.",
];

export default function Coach() {
  const list = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! Choose a question below, or ask me about your money plan.",
    },
  ]);
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
      title="Coach"
      subtitle="Ask a money question in your own words."
      help={{
        title: "Your Coach",
        body: "Coach explains numbers already in your SuperFinz plan. It does not approve loans or move money. Important decisions should still be checked by you.",
      }}
      scroll={false}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={140}
        style={styles.page}
      >
        <ScrollView
          ref={list}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.messages}
          onContentSizeChange={() =>
            list.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((message, index) => (
            <View
              accessible
              accessibilityLabel={`${message.role === "user" ? "You" : "Coach"}: ${message.content}`}
              key={index}
              style={[
                styles.bubble,
                message.role === "user" ? styles.user : styles.assistant,
              ]}
            >
              <Text
                style={[
                  styles.message,
                  message.role === "user" && { color: colors.white },
                ]}
              >
                {message.content}
              </Text>
            </View>
          ))}
          {sending && (
            <View
              accessibilityLiveRegion="polite"
              style={[styles.bubble, styles.assistant]}
            >
              <Text style={styles.message}>Checking your current plan…</Text>
            </View>
          )}
          {error && (
            <Card
              accessibilityLiveRegion="assertive"
              style={{ borderColor: colors.red }}
            >
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
              {failed && (
                <Button
                  title="Retry"
                  tone="quiet"
                  onPress={() => ask(failed, false)}
                />
              )}
            </Card>
          )}
        </ScrollView>
        {messages.length < 3 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestions}
          >
            {suggestions.map((item) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item}
                key={item}
                onPress={() => ask(item)}
                style={({ pressed }) => [
                  styles.suggestion,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.suggestionText}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <View style={styles.composer}>
          <View style={{ flex: 1 }}>
            <Field
              accessibilityLabel="Ask the financial coach"
              value={text}
              onChangeText={setText}
              placeholder="Ask about your next payout…"
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
const styles = StyleSheet.create({
  page: { flex: 1, marginHorizontal: -18, marginBottom: -18 },
  messages: { padding: 18, gap: 12 },
  bubble: {
    maxWidth: "88%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 13,
  },
  assistant: { alignSelf: "flex-start", backgroundColor: colors.surface },
  user: { alignSelf: "flex-end", backgroundColor: colors.actionStrong },
  message: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  error: { color: colors.red, fontWeight: "700", lineHeight: 20 },
  suggestions: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  suggestion: {
    minHeight: 48,
    maxWidth: 220,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  suggestionText: { color: colors.ink, fontWeight: "700", fontSize: 12 },
  pressed: { opacity: 0.6 },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
  },
});
