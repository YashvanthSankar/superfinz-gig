import {
  useEffect,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal as NativeModal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ColorValue,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Info,
  Moon,
  Sun,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  TOUCH,
  colorString,
  colors,
  radius,
  shadow,
  shadowLg,
  space,
} from "@/constants/theme";
import { useAppTheme } from "@/providers/theme-provider";
import { useTabBarInset } from "@/components/tab-bar";

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** ₹12,345 with Indian grouping. `compact` shortens lakhs and crores. */
export function formatMoney(value: number, compact = false) {
  const abs = Math.abs(value);
  if (compact && abs >= 10_000_000)
    return `${value < 0 ? "−" : ""}₹${(abs / 10_000_000).toFixed(1)} Cr`;
  if (compact && abs >= 100_000)
    return `${value < 0 ? "−" : ""}₹${(abs / 100_000).toFixed(1)} L`;
  const formatted = inr.format(Math.round(abs));
  return value < 0 ? `−${formatted}` : formatted;
}

/** Range such as ₹2,100–₹3,400, collapsing to a single figure when equal. */
export function formatMoneyRange(min: number, max: number) {
  return Math.round(min) === Math.round(max)
    ? formatMoney(min)
    : `${formatMoney(min)}–${formatMoney(max)}`;
}

export function formatDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  },
) {
  return new Date(value).toLocaleDateString("en-IN", options);
}

/** True only after `active` has been true for `delay` ms, so quick refetches never flash. */
function useDelayedFlag(active: boolean, delay = 600) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handle = setTimeout(() => setVisible(active), active ? delay : 0);
    return () => clearTimeout(handle);
  }, [active, delay]);
  return visible;
}

/* ------------------------------------------------------------------ */
/* Screen scaffold                                                     */
/* ------------------------------------------------------------------ */

export function Screen({
  children,
  title,
  eyebrow,
  subtitle,
  action,
  back = false,
  onBack,
  help,
  scroll = true,
  refreshing = false,
  padded = true,
}: PropsWithChildren<{
  title?: string;
  /** Small uppercase label above the title. */
  eyebrow?: string;
  subtitle?: string;
  /** Header actions, usually one or two <IconButton>s. */
  action?: ReactNode;
  back?: boolean;
  onBack?: () => void;
  help?: { title: string; body: string };
  scroll?: boolean;
  /** Shows a thin "Updating" line under the header while data refreshes. */
  refreshing?: boolean;
  padded?: boolean;
}>) {
  const router = useRouter();
  const showRefreshing = useDelayedFlag(refreshing);
  const tabBarInset = useTabBarInset();
  const bottomPadding = tabBarInset ? tabBarInset + 20 : 40;
  const showHeader = Boolean(title || back || action || help);
  const content = (
    <View
      style={[
        styles.content,
        !padded && styles.contentFlush,
        !scroll && styles.contentFixed,
        !scroll && { paddingBottom: tabBarInset ? tabBarInset + 8 : 10 },
      ]}
    >
      {showHeader && (
        <View style={styles.pageHeader}>
          <View style={styles.headerRow}>
            {back ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
                onPress={onBack ?? (() => router.back())}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.pressed,
                ]}
              >
                <ArrowLeft
                  accessible={false}
                  color={colorString(colors.ink)}
                  size={20}
                />
                <Text style={styles.backText}>Back</Text>
              </Pressable>
            ) : (
              <View style={styles.headerTitleBlock}>
                {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
                {title && (
                  <Text accessibilityRole="header" style={styles.title}>
                    {title}
                  </Text>
                )}
              </View>
            )}
            <View style={styles.headerActions}>
              {showRefreshing && (
                <View
                  accessibilityLiveRegion="polite"
                  accessibilityLabel="Updating"
                  style={styles.refreshingBox}
                >
                  <ActivityIndicator
                    color={colorString(colors.accent)}
                    size="small"
                  />
                </View>
              )}
              {help && (
                <IconButton
                  icon={CircleHelp}
                  label={`Help with ${help.title}`}
                  hint="Opens a short explanation"
                  onPress={() =>
                    Alert.alert(help.title, help.body, [{ text: "Got it" }])
                  }
                />
              )}
              {action}
            </View>
          </View>
          {back && (eyebrow || title) && (
            <View style={styles.headerTitleBlock}>
              {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
              {title && (
                <Text accessibilityRole="header" style={styles.title}>
                  {title}
                </Text>
              )}
            </View>
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
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: bottomPadding },
          ]}
          scrollIndicatorInsets={{ bottom: tabBarInset }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export type CardTone =
  "default" | "tint" | "navy" | "good" | "warn" | "bad" | "plain";

const cardTones: Record<CardTone, ViewStyle> = {
  default: {},
  tint: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  navy: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadowLg,
  },
  good: { backgroundColor: colors.goodSoft, borderColor: colors.goodSoft },
  warn: { backgroundColor: colors.warnSoft, borderColor: colors.warnSoft },
  bad: { backgroundColor: colors.badSoft, borderColor: colors.badSoft },
  plain: {
    backgroundColor: colors.paper2,
    borderColor: colors.paper2,
    shadowOpacity: 0,
    elevation: 0,
  },
};

export function Card({
  children,
  style,
  tone = "default",
  padded = true,
  ...props
}: PropsWithChildren<ViewProps & { tone?: CardTone; padded?: boolean }>) {
  return (
    <View
      {...props}
      style={[styles.card, cardTones[tone], !padded && styles.cardFlush, style]}
    >
      {children}
    </View>
  );
}

/** Small uppercase label used above values and as a card eyebrow. */
export function Label({
  children,
  tone = "muted",
  style,
}: PropsWithChildren<{
  tone?: "muted" | "accent" | "onPrimary" | "inherit";
  style?: StyleProp<TextStyle>;
}>) {
  return (
    <Text
      style={[
        styles.label,
        tone === "accent" && { color: colors.accent },
        tone === "onPrimary" && { color: colors.onPrimarySoft },
        tone === "inherit" && { color: undefined },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  onPrimary = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  onPrimary?: boolean;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderText}>
        {eyebrow && (
          <Label tone={onPrimary ? "onPrimary" : "muted"}>{eyebrow}</Label>
        )}
        <Text
          accessibilityRole="header"
          style={[ui.h2, onPrimary && { color: colors.onPrimary }]}
        >
          {title}
        </Text>
        {description && (
          <Text
            style={[ui.small, onPrimary && { color: colors.onPrimarySoft }]}
          >
            {description}
          </Text>
        )}
      </View>
      {action}
    </View>
  );
}

export function Divider({ onPrimary = false }: { onPrimary?: boolean }) {
  return (
    <View
      style={[
        styles.divider,
        onPrimary && { backgroundColor: colors.onPrimaryBorder },
      ]}
    />
  );
}

function useReducedMotionEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setEnabled(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setEnabled,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return enabled;
}

/**
 * A focused action surface for short forms and settings. It slides up on
 * phones, remains readable on tablets, avoids the keyboard and keeps the page
 * underneath from jumping.
 */
export function FormSheet({
  visible,
  onClose,
  eyebrow,
  title,
  description,
  busy = false,
  children,
}: PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  description?: string;
  busy?: boolean;
}>) {
  const reduceMotion = useReducedMotionEnabled();
  const close = () => {
    if (!busy) onClose();
  };

  return (
    <NativeModal
      transparent
      visible={visible}
      animationType={reduceMotion ? "none" : "slide"}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View accessibilityViewIsModal style={styles.sheetRoot}>
        <View accessible={false} style={styles.sheetBackdrop} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={8}
          pointerEvents="box-none"
          style={styles.sheetKeyboard}
        >
          <SafeAreaView edges={["bottom"]} style={styles.sheetSurface}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeading}>
                {eyebrow && <Label tone="accent">{eyebrow}</Label>}
                <Text accessibilityRole="header" style={ui.h2}>
                  {title}
                </Text>
                {description && <Text style={ui.small}>{description}</Text>}
              </View>
              <IconButton
                icon={X}
                label={`Close ${title}`}
                hint="Returns to the previous screen"
                disabled={busy}
                onPress={close}
              />
            </View>
            <Divider />
            <ScrollView
              automaticallyAdjustKeyboardInsets
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetBody}
            >
              {children}
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </NativeModal>
  );
}

/* ------------------------------------------------------------------ */
/* Data display                                                        */
/* ------------------------------------------------------------------ */

export function Money({
  value,
  compact = false,
  size = "md",
  onPrimary = false,
  style,
}: {
  value: number;
  compact?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  onPrimary?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      style={[
        styles.money,
        size === "sm" && styles.moneySm,
        size === "lg" && styles.moneyLg,
        size === "xl" && styles.moneyXl,
        onPrimary && { color: colors.onPrimary },
        style,
      ]}
    >
      {formatMoney(value, compact)}
    </Text>
  );
}

/** Label + big value + optional help line. */
export function Stat({
  label,
  value,
  help,
  tone = "default",
  onPrimary = false,
  style,
}: {
  label: string;
  value: string;
  help?: string;
  tone?: "default" | "good" | "warn" | "bad" | "accent";
  onPrimary?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const valueColor =
    tone === "good"
      ? colors.good
      : tone === "warn"
        ? colors.warn
        : tone === "bad"
          ? colors.bad
          : tone === "accent"
            ? onPrimary
              ? colors.accentOnPrimary
              : colors.accent
            : onPrimary
              ? colors.onPrimary
              : colors.ink;
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}${help ? `. ${help}` : ""}`}
      style={[styles.stat, onPrimary && styles.statOnPrimary, style]}
    >
      <Label tone={onPrimary ? "onPrimary" : "muted"}>{label}</Label>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      {help && (
        <Text style={[ui.small, onPrimary && { color: colors.onPrimarySoft }]}>
          {help}
        </Text>
      )}
    </View>
  );
}

export function Progress({
  value,
  tone = colors.accent,
  label = "Progress",
  onPrimary = false,
}: {
  value: number;
  tone?: ColorValue;
  label?: string;
  onPrimary?: boolean;
}) {
  const normalized = Math.min(
    100,
    Math.max(0, Number.isFinite(value) ? value : 0),
  );
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(normalized) }}
      style={[
        styles.track,
        onPrimary && { backgroundColor: colors.onPrimaryPanel },
      ]}
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

export type BadgeTone = "neutral" | "accent" | "good" | "warn" | "bad" | "ink";

const badgeTones: Record<BadgeTone, { bg: ColorValue; fg: ColorValue }> = {
  neutral: { bg: colors.paper2, fg: colors.inkSoft },
  accent: { bg: colors.accentSoft, fg: colors.accent },
  good: { bg: colors.goodSoft, fg: colors.good },
  warn: { bg: colors.warnSoft, fg: colors.warn },
  bad: { bg: colors.badSoft, fg: colors.bad },
  ink: { bg: colors.primary, fg: colors.onPrimary },
};

export function Badge({
  label,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  tone?: BadgeTone;
  icon?: LucideIcon;
}) {
  const palette = badgeTones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      {Icon && (
        <Icon
          accessible={false}
          color={colorString(palette.fg)}
          size={13}
          strokeWidth={2.4}
        />
      )}
      <Text style={[styles.badgeText, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const noticeMeta = {
  info: {
    icon: Info,
    bg: colors.accentSoft,
    fg: colors.accent,
    text: colors.ink,
  },
  good: {
    icon: CircleCheck,
    bg: colors.goodSoft,
    fg: colors.good,
    text: colors.ink,
  },
  warn: {
    icon: TriangleAlert,
    bg: colors.warnSoft,
    fg: colors.warn,
    text: colors.ink,
  },
  bad: {
    icon: CircleAlert,
    bg: colors.badSoft,
    fg: colors.bad,
    text: colors.ink,
  },
} as const;

/** Inline callout with an icon; use for warnings, confirmations and disclaimers. */
export function Notice({
  tone = "info",
  title,
  children,
  live = false,
}: PropsWithChildren<{
  tone?: keyof typeof noticeMeta;
  title?: string;
  live?: boolean;
}>) {
  const meta = noticeMeta[tone];
  const Icon = meta.icon;
  return (
    <View
      accessibilityLiveRegion={live ? "polite" : "none"}
      accessibilityRole={tone === "bad" ? "alert" : undefined}
      style={[styles.notice, { backgroundColor: meta.bg }]}
    >
      <Icon
        accessible={false}
        color={colorString(meta.fg)}
        size={18}
        strokeWidth={2.2}
      />
      <View style={styles.noticeBody}>
        {title && (
          <Text style={[styles.noticeTitle, { color: meta.text }]}>
            {title}
          </Text>
        )}
        {typeof children === "string" ? (
          <Text style={[styles.noticeText, { color: meta.text }]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Controls                                                            */
/* ------------------------------------------------------------------ */

export type ButtonTone =
  | "accent"
  | "ink"
  | "quiet"
  | "soft"
  | "ghost"
  | "danger"
  | "dangerSoft"
  | "onPrimary";

const buttonTones: Record<
  ButtonTone,
  { container: ViewStyle; text: TextStyle; spinner: ColorValue }
> = {
  accent: {
    container: {
      backgroundColor: colors.action,
      borderColor: colors.action,
      ...shadow,
    },
    text: { color: colors.onAction },
    spinner: colors.onAction,
  },
  ink: {
    container: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      ...shadow,
    },
    text: { color: colors.onPrimary },
    spinner: colors.onPrimary,
  },
  quiet: {
    container: {
      backgroundColor: colors.surface,
      borderColor: colors.borderStrong,
    },
    text: { color: colors.ink },
    spinner: colors.ink,
  },
  soft: {
    container: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accentSoft,
    },
    text: { color: colors.accent },
    spinner: colors.accent,
  },
  ghost: {
    container: { backgroundColor: "transparent", borderColor: "transparent" },
    text: { color: colors.accent },
    spinner: colors.accent,
  },
  danger: {
    container: { backgroundColor: colors.bad, borderColor: colors.bad },
    text: { color: colors.onBad },
    spinner: colors.onBad,
  },
  dangerSoft: {
    container: { backgroundColor: colors.badSoft, borderColor: colors.badSoft },
    text: { color: colors.bad },
    spinner: colors.bad,
  },
  onPrimary: {
    container: {
      backgroundColor: colors.onPrimaryPanel,
      borderColor: colors.onPrimaryBorder,
    },
    text: { color: colors.onPrimary },
    spinner: colors.onPrimary,
  },
};

export function Button({
  title,
  onPress,
  disabled,
  loading = false,
  tone = "accent",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  inline = false,
  accessibilityHint,
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: ButtonTone;
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  /** Hug content instead of stretching to the container width. */
  inline?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const unavailable = disabled || loading;
  const palette = buttonTones[tone];
  const iconColor = colorString(palette.text.color as ColorValue);
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
        size === "sm" && styles.buttonSm,
        size === "lg" && styles.buttonLg,
        inline && styles.buttonInline,
        palette.container,
        pressed && styles.pressed,
        unavailable && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colorString(palette.spinner)} size="small" />
      ) : (
        Icon && (
          <Icon
            accessible={false}
            color={iconColor}
            size={size === "sm" ? 16 : 18}
            strokeWidth={2.2}
          />
        )
      )}
      <Text
        numberOfLines={1}
        style={[
          styles.buttonText,
          size === "sm" && styles.buttonTextSm,
          size === "lg" && styles.buttonTextLg,
          palette.text,
        ]}
      >
        {title}
      </Text>
      {IconRight && (
        <IconRight
          accessible={false}
          color={iconColor}
          size={size === "sm" ? 16 : 18}
          strokeWidth={2.2}
        />
      )}
    </Pressable>
  );
}

/** 44pt square icon-only button. `label` is required and read by screen readers. */
export function IconButton({
  icon: Icon,
  label,
  hint,
  onPress,
  tone = "quiet",
  active = false,
  disabled = false,
  size = 20,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  onPress: () => void;
  tone?: "quiet" | "ghost" | "accent" | "onPrimary" | "danger";
  active?: boolean;
  disabled?: boolean;
  size?: number;
}) {
  const fg =
    tone === "accent"
      ? colors.onAction
      : tone === "onPrimary"
        ? colors.onPrimary
        : tone === "danger"
          ? colors.bad
          : active
            ? colors.accent
            : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled, selected: active || undefined }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        tone === "quiet" && styles.iconButtonQuiet,
        tone === "accent" && {
          backgroundColor: colors.action,
          borderColor: colors.action,
        },
        tone === "onPrimary" && {
          backgroundColor: colors.onPrimaryPanel,
          borderColor: colors.onPrimaryBorder,
        },
        tone === "danger" && {
          backgroundColor: colors.badSoft,
          borderColor: colors.badSoft,
        },
        active &&
          tone === "quiet" && {
            backgroundColor: colors.accentSoft,
            borderColor: colors.accent,
          },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Icon
        accessible={false}
        color={colorString(fg)}
        size={size}
        strokeWidth={2.1}
      />
    </Pressable>
  );
}

/** Selectable pill. Pass `role="radio"` for single choice or `role="checkbox"` for multi. */
export function Chip({
  label,
  selected = false,
  onPress,
  icon: Icon,
  role = "button",
  disabled = false,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: LucideIcon;
  role?: "button" | "radio" | "checkbox";
  disabled?: boolean;
}) {
  const fg = selected ? colors.accent : colors.ink;
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{
        selected,
        checked: role === "button" ? undefined : selected,
        disabled,
      }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {Icon && (
        <Icon
          accessible={false}
          color={colorString(fg)}
          size={15}
          strokeWidth={2.2}
        />
      )}
      <Text style={[styles.chipText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/** Tappable list row: icon, title, subtitle, trailing value/badge, chevron. */
export function ListRow({
  icon: Icon,
  iconTone = "accent",
  title,
  subtitle,
  value,
  badge,
  onPress,
  chevron,
  destructive = false,
  last = false,
  accessibilityHint,
  children,
}: PropsWithChildren<{
  icon?: LucideIcon;
  iconTone?: "accent" | "good" | "warn" | "bad" | "muted";
  title: string;
  subtitle?: string;
  value?: string;
  badge?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  last?: boolean;
  accessibilityHint?: string;
}>) {
  const iconFg =
    iconTone === "good"
      ? colors.good
      : iconTone === "warn"
        ? colors.warn
        : iconTone === "bad"
          ? colors.bad
          : iconTone === "muted"
            ? colors.muted
            : colors.accent;
  const iconBg =
    iconTone === "good"
      ? colors.goodSoft
      : iconTone === "warn"
        ? colors.warnSoft
        : iconTone === "bad"
          ? colors.badSoft
          : iconTone === "muted"
            ? colors.paper2
            : colors.accentSoft;
  const showChevron = chevron ?? Boolean(onPress);
  const body = (
    <>
      {Icon && (
        <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
          <Icon
            accessible={false}
            color={colorString(iconFg)}
            size={19}
            strokeWidth={2}
          />
        </View>
      )}
      <View style={styles.rowText}>
        <Text
          numberOfLines={2}
          style={[styles.rowTitle, destructive && { color: colors.bad }]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text numberOfLines={2} style={styles.rowSubtitle}>
            {subtitle}
          </Text>
        )}
        {children}
      </View>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {badge}
      {showChevron && (
        <ChevronRight
          accessible={false}
          color={colorString(colors.muted)}
          size={18}
          strokeWidth={2.2}
        />
      )}
    </>
  );
  if (!onPress) {
    return <View style={[styles.row, last && styles.rowLast]}>{body}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ""}${value ? `, ${value}` : ""}`}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        last && styles.rowLast,
        pressed && styles.rowPressed,
      ]}
    >
      {body}
    </Pressable>
  );
}

/** Disclosure: a tappable header that reveals its children. */
export function Expandable({
  title,
  summary,
  defaultOpen = false,
  onPrimary = false,
  onToggle,
  children,
}: PropsWithChildren<{
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  onPrimary?: boolean;
  onToggle?: (open: boolean) => void;
}>) {
  const [open, setOpen] = useState(defaultOpen);
  const fg = onPrimary ? colors.onPrimary : colors.ink;
  return (
    <View style={styles.expandable}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        onPress={() => {
          const next = !open;
          setOpen(next);
          onToggle?.(next);
        }}
        style={({ pressed }) => [
          styles.expandableHeader,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.rowText}>
          <Text style={[styles.expandableTitle, { color: fg }]}>{title}</Text>
          {summary && !open && (
            <Text
              style={[ui.small, onPrimary && { color: colors.onPrimarySoft }]}
            >
              {summary}
            </Text>
          )}
        </View>
        <ChevronDown
          accessible={false}
          color={colorString(onPrimary ? colors.onPrimarySoft : colors.muted)}
          size={20}
          style={open ? styles.chevronOpen : undefined}
        />
      </Pressable>
      {open && <View style={styles.expandableBody}>{children}</View>}
    </View>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useAppTheme();
  if (Platform.OS !== "ios") return null;
  const dark = theme === "dark";
  return (
    <IconButton
      icon={dark ? Sun : Moon}
      label={dark ? "Switch to light mode" : "Switch to dark mode"}
      hint="Changes the app colour theme"
      onPress={toggleTheme}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Forms                                                               */
/* ------------------------------------------------------------------ */

export function Field(
  props: TextInputProps & {
    label?: string;
    hint?: string;
    error?: string | null;
    required?: boolean;
    /** Text shown inside the field on the left, for example "₹". */
    prefix?: string;
    /** Text shown inside the field on the right, for example "%" or "days". */
    suffix?: string;
    containerStyle?: StyleProp<ViewStyle>;
  },
) {
  const {
    label,
    hint,
    error,
    required,
    prefix,
    suffix,
    containerStyle,
    style,
    ...inputProps
  } = props;
  return (
    <View style={[styles.field, containerStyle]}>
      {label && (
        <View style={styles.fieldLabelRow}>
          <Label>{label}</Label>
          {required && <Text style={styles.required}>*</Text>}
        </View>
      )}
      <View style={styles.inputWrap}>
        {prefix && <Text style={styles.affix}>{prefix}</Text>}
        <TextInput
          accessibilityLabel={props.accessibilityLabel ?? label}
          accessibilityHint={props.accessibilityHint ?? hint}
          accessibilityState={{
            ...(props.editable === false ? { disabled: true } : {}),
          }}
          placeholderTextColor={colorString(colors.muted)}
          selectionColor={colorString(colors.accent)}
          {...inputProps}
          style={[
            styles.input,
            Boolean(prefix) && styles.inputWithPrefix,
            Boolean(suffix) && styles.inputWithSuffix,
            Boolean(error) && styles.inputError,
            style,
          ]}
        />
        {suffix && (
          <Text style={[styles.affix, styles.affixRight]}>{suffix}</Text>
        )}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.fieldError}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <SafeAreaView accessibilityLiveRegion="polite" style={styles.loadingSafe}>
      <View style={styles.center}>
        <ActivityIndicator color={colorString(colors.accent)} size="large" />
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
        <View style={[styles.stateIcon, { backgroundColor: colors.badSoft }]}>
          <CircleAlert
            accessible={false}
            color={colorString(colors.bad)}
            size={24}
          />
        </View>
        <Text accessibilityRole="header" style={styles.emptyTitle}>
          {title}
        </Text>
        {body && <Text style={styles.muted}>{body}</Text>}
        {onRetry && (
          <Button title="Try again" tone="quiet" inline onPress={onRetry} />
        )}
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

/** Empty list placeholder with an optional icon and call to action. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: { title: string; onPress: () => void };
}) {
  return (
    <View style={styles.emptyState}>
      {Icon && (
        <View style={styles.stateIcon}>
          <Icon
            accessible={false}
            color={colorString(colors.accent)}
            size={22}
          />
        </View>
      )}
      <Text accessibilityRole="header" style={styles.emptyTitle}>
        {title}
      </Text>
      {body && <Text style={styles.muted}>{body}</Text>}
      {action && (
        <Button
          title={action.title}
          tone="soft"
          size="sm"
          inline
          onPress={action.onPress}
        />
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Shared text and layout styles                                       */
/* ------------------------------------------------------------------ */

export const ui = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  display: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -1.4,
    fontVariant: ["tabular-nums"],
  },
  h1: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.9,
  },
  h2: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  body: { fontSize: 16, color: colors.inkSoft, lineHeight: 24 },
  bodyStrong: {
    fontSize: 16,
    color: colors.ink,
    lineHeight: 24,
    fontWeight: "600",
  },
  small: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "500",
    lineHeight: 19,
  },
  caption: { fontSize: 12, color: colors.muted, lineHeight: 17 },
  onPrimary: { color: colors.onPrimary },
  onPrimarySoft: { color: colors.onPrimarySoft },
  gap: { gap: 14 },
  gapSm: { gap: 8 },
  gapLg: { gap: 20 },
  num: { fontVariant: ["tabular-nums"] },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  loadingSafe: {
    flex: 1,
    backgroundColor: colors.paper,
    justifyContent: "center",
  },
  scroll: { flexGrow: 1 },
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.lg,
  },
  contentFlush: { paddingHorizontal: 0 },
  contentFixed: { flex: 1 },
  pageHeader: { gap: 6, marginBottom: 2 },
  headerRow: {
    minHeight: TOUCH,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerTitleBlock: { flex: 1, gap: 4, paddingTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  backButton: {
    minHeight: TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingRight: 8,
    marginLeft: -4,
  },
  backText: { color: colors.ink, fontSize: 16, fontWeight: "600" },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.9,
  },
  subtitle: {
    maxWidth: 620,
    color: colors.inkSoft,
    fontSize: 16,
    lineHeight: 23,
  },
  refreshingBox: {
    width: TOUCH,
    height: TOUCH,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 10,
    ...shadow,
  },
  cardFlush: { padding: 0, gap: 0, overflow: "hidden" },
  label: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionHeaderText: { flex: 1, gap: 3 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  sheetRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    position: "absolute",
    inset: 0,
    backgroundColor: colors.overlay,
  },
  sheetKeyboard: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheetSurface: {
    width: "100%",
    maxWidth: 760,
    maxHeight: "92%",
    overflow: "hidden",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadowLg,
  },
  sheetHeader: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.md,
  },
  sheetHeading: { flex: 1, minWidth: 0, gap: 3 },
  sheetBody: {
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xl,
  },

  money: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.6,
    fontVariant: ["tabular-nums"],
  },
  moneySm: { fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  moneyLg: { fontSize: 32, lineHeight: 38, letterSpacing: -1 },
  moneyXl: { fontSize: 48, lineHeight: 54, letterSpacing: -2 },
  stat: { gap: 4, minWidth: 0, flexShrink: 1 },
  statOnPrimary: {
    borderWidth: 1,
    borderColor: colors.onPrimaryBorder,
    backgroundColor: colors.onPrimaryPanel,
    borderRadius: radius.md,
    padding: 12,
  },
  statValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: colors.paper2,
  },
  fill: { height: "100%", borderRadius: radius.pill },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    minHeight: 24,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 12, lineHeight: 16, fontWeight: "600" },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: radius.md,
    padding: 12,
  },
  noticeBody: { flex: 1, gap: 2 },
  noticeTitle: { fontSize: 14, lineHeight: 20, fontWeight: "700" },
  noticeText: { fontSize: 14, lineHeight: 20 },

  button: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  buttonSm: { minHeight: TOUCH, paddingHorizontal: 12 },
  buttonLg: { minHeight: 54, paddingHorizontal: 20, borderRadius: 14 },
  buttonInline: { alignSelf: "flex-start" },
  buttonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    letterSpacing: -0.15,
  },
  buttonTextSm: { fontSize: 14 },
  buttonTextLg: { fontSize: 16 },
  iconButton: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonQuiet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  chip: {
    minHeight: TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  chipText: { fontSize: 14, fontWeight: "600" },

  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowPressed: { opacity: 0.7 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "600",
  },
  rowSubtitle: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  rowValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },

  expandable: { gap: 0 },
  expandableHeader: {
    minHeight: TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  expandableTitle: { fontSize: 16, lineHeight: 21, fontWeight: "600" },
  expandableBody: { paddingTop: 8, gap: 10 },
  chevronOpen: { transform: [{ rotate: "180deg" }] },

  field: { gap: 6 },
  fieldLabelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  required: { color: colors.bad, fontSize: 13, fontWeight: "700" },
  inputWrap: { position: "relative", justifyContent: "center" },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.ink,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  inputWithPrefix: { paddingLeft: 30 },
  inputWithSuffix: { paddingRight: 56 },
  inputError: { borderColor: colors.bad, backgroundColor: colors.badSoft },
  affix: {
    position: "absolute",
    left: 13,
    color: colors.muted,
    fontSize: 16,
    fontWeight: "600",
    zIndex: 1,
  },
  affixRight: { left: undefined, right: 13, fontSize: 14 },
  fieldHint: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  fieldError: {
    color: colors.bad,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },

  center: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 18,
  },
  emptyState: {
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    backgroundColor: colors.paper2,
    paddingVertical: 26,
    paddingHorizontal: 18,
  },
  stateIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
    marginBottom: 4,
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 320,
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
});
