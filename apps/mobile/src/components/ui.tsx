import type { PropsWithChildren, ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ColorValue,
  type TextInputProps,
  type ViewProps,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, CircleHelp, Moon, Sun } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, shadow } from "@/constants/theme";
import { useAppTheme } from "@/providers/theme-provider";

export function Screen({
  children,
  title,
  subtitle,
  action,
  back = false,
  onBack,
  help,
  scroll = true,
}: PropsWithChildren<{
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  back?: boolean;
  onBack?: () => void;
  help?: { title: string; body: string };
  scroll?: boolean;
}>) {
  const router = useRouter();
  const showHeader = Boolean(title || back || action || help);
  const content = (
    <View style={[styles.content, !scroll && styles.contentFixed]}>
      {showHeader && (
        <View style={styles.pageHeader}>
          <View style={styles.heading}>
            {back ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
                onPress={onBack ?? (() => router.back())}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <ArrowLeft
                  accessible={false}
                  color={colors.ink as string}
                  size={21}
                />
                <Text style={styles.headerButtonText}>Back</Text>
              </Pressable>
            ) : title ? (
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
            ) : (
              <View />
            )}
            <View style={styles.headerActions}>
              {help && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Help with ${help.title}`}
                  accessibilityHint="Opens a short explanation"
                  hitSlop={8}
                  onPress={() =>
                    Alert.alert(help.title, help.body, [{ text: "Got it" }])
                  }
                  style={({ pressed }) => [
                    styles.headerButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <CircleHelp
                    accessible={false}
                    color={colors.ink as string}
                    size={20}
                  />
                  <Text style={styles.headerButtonText}>Help</Text>
                </Pressable>
              )}
              {action}
            </View>
          </View>
          {back && title && (
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
          )}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  );
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
  ...props
}: PropsWithChildren<ViewProps>) {
  return (
    <View {...props} style={[styles.card, style]}>
      {children}
    </View>
  );
}

export function Label({ children }: PropsWithChildren) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Money({
  value,
  compact = false,
}: {
  value: number;
  compact?: boolean;
}) {
  const amount =
    compact && Math.abs(value) >= 100000
      ? `${(value / 100000).toFixed(1)}L`
      : Math.round(value).toLocaleString("en-IN");
  return <Text style={styles.money}>₹{amount}</Text>;
}

export function Progress({
  value,
  tone = colors.accent,
  label = "Progress",
}: {
  value: number;
  tone?: ColorValue;
  label?: string;
}) {
  const normalized = Math.min(100, Math.max(0, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(normalized) }}
      style={styles.track}
    >
      <View
        style={[
          styles.fill,
          { width: `${normalized}%`, backgroundColor: tone },
        ]}
      />
    </View>
  );
}

export function Button({
  title,
  onPress,
  disabled,
  loading = false,
  tone = "accent",
  accessibilityHint,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: "accent" | "ink" | "quiet";
  accessibilityHint?: string;
}) {
  const unavailable = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === "ink" && styles.buttonInk,
        tone === "quiet" && styles.buttonQuiet,
        pressed && styles.buttonPressed,
        unavailable && styles.buttonDisabled,
      ]}
    >
      {loading && (
        <ActivityIndicator
          color={tone === "quiet" ? colors.ink : colors.white}
          size="small"
        />
      )}
      <Text
        style={[styles.buttonText, tone === "quiet" && styles.buttonTextQuiet]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useAppTheme();
  const dark = theme === "dark";
  const Icon = dark ? Sun : Moon;
  const label = dark ? "Use light mode" : "Use dark mode";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Changes the app color theme"
      onPress={toggleTheme}
      hitSlop={8}
      style={({ pressed }) => [
        styles.themeButton,
        pressed && styles.buttonPressed,
      ]}
    >
      <Icon
        accessible={false}
        color={colors.ink as string}
        size={19}
        strokeWidth={2}
      />
      <Text style={styles.themeText}>{dark ? "Light" : "Dark"}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label?: string }) {
  const { label, ...inputProps } = props;
  return (
    <View style={styles.field}>
      {label && <Label>{label}</Label>}
      <TextInput
        accessibilityLabel={props.accessibilityLabel ?? label}
        placeholderTextColor={colors.muted}
        selectionColor={colors.accent}
        {...inputProps}
        style={[styles.input, props.style]}
      />
    </View>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <SafeAreaView accessibilityLiveRegion="polite" style={styles.loadingSafe}>
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.muted}>{label}</Text>
      </View>
    </SafeAreaView>
  );
}

export function ErrorState({
  title,
  body,
  onRetry,
}: {
  title: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <SafeAreaView style={styles.loadingSafe}>
      <View accessibilityLiveRegion="assertive" style={styles.center}>
        <Text accessibilityRole="header" style={styles.emptyTitle}>
          {title}
        </Text>
        {body && <Text style={styles.muted}>{body}</Text>}
        {onRetry && <Button title="Try again" tone="quiet" onPress={onRetry} />}
      </View>
    </SafeAreaView>
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.center}>
      <Text accessibilityRole="header" style={styles.emptyTitle}>
        {title}
      </Text>
      <Text style={styles.muted}>{body}</Text>
    </View>
  );
}

export const ui = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  h1: {
    fontSize: 33,
    lineHeight: 38,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -1.1,
  },
  h2: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  body: { fontSize: 16, color: colors.inkSoft, lineHeight: 24 },
  small: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "500",
    lineHeight: 19,
  },
  gap: { gap: 14 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  loadingSafe: {
    flex: 1,
    backgroundColor: colors.paper,
    justifyContent: "center",
  },
  scroll: { flexGrow: 1, paddingBottom: 104 },
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: 14,
    gap: 16,
  },
  contentFixed: { flex: 1, paddingBottom: 10 },
  pageHeader: { gap: 7, marginBottom: 4 },
  heading: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerButton: {
    minHeight: 48,
    minWidth: 76,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  headerButtonText: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  title: {
    flexShrink: 1,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.8,
  },
  subtitle: {
    maxWidth: 620,
    color: colors.inkSoft,
    fontSize: 16,
    lineHeight: 23,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
    padding: 17,
    gap: 11,
    ...shadow,
  },
  label: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    fontWeight: "700",
    letterSpacing: 0.35,
  },
  money: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.6,
    fontVariant: ["tabular-nums"],
  },
  track: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: colors.paper2,
  },
  fill: { height: "100%", borderRadius: 999 },
  button: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.action,
    borderRadius: 14,
    backgroundColor: colors.action,
    paddingHorizontal: 17,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  buttonInk: {
    borderColor: colors.actionStrong,
    backgroundColor: colors.actionStrong,
  },
  buttonQuiet: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowOpacity: 0,
  },
  buttonPressed: { opacity: 0.76 },
  buttonDisabled: { opacity: 0.45 },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.15,
  },
  buttonTextQuiet: { color: colors.ink },
  themeButton: {
    minHeight: 48,
    minWidth: 76,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  themeText: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  field: { gap: 7 },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.paper,
    color: colors.ink,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  center: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 18,
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 21,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
  },
});
