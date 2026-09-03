import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CalendarClock, ShieldCheck, WalletCards } from "lucide-react-native";
import type { GigDashboardDto } from "@superfinz/shared";
import { apiFetch } from "@/lib/api";
import {
  Button,
  Card,
  ErrorState,
  Label,
  Loading,
  Progress,
  Screen,
  ThemeToggle,
  ui,
} from "@/components/ui";
import { colors } from "@/constants/theme";

const money = (value: number) =>
  `₹${Math.round(value).toLocaleString("en-IN")}`;

export default function Today() {
  const [showMath, setShowMath] = useState(false);
  const query = useQuery({
    queryKey: ["gig-dashboard"],
    queryFn: () =>
      apiFetch<{ dashboard: GigDashboardDto }>("/api/gig/dashboard"),
  });
  if (query.isLoading)
    return <Loading label="Calculating what is safe today…" />;
  if (query.isError || !query.data)
    return (
      <ErrorState
        title="Couldn’t build today’s plan"
        body={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => query.refetch()}
      />
    );

  const dashboard = query.data.dashboard;
  const s = dashboard.summary;
  const nextDay = new Date(s.safeUntil).toLocaleDateString("en-IN", {
    weekday: "long",
  });
  const cushionPct = s.cushionTargetDays
    ? (s.protectedDays / s.cushionTargetDays) * 100
    : 0;
  const nextEvents = dashboard.timeline.slice(0, 2);

  return (
    <Screen>
      <View>
        <View style={styles.topRow}>
          <Text style={styles.date}>
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
          <ThemeToggle />
        </View>
        <Text accessibilityRole="header" style={ui.h1}>
          Hello, {dashboard.profile.preferredName}
        </Text>
        <Text style={ui.body}>Here is today&apos;s simple money plan.</Text>
      </View>

      <Card style={styles.hero}>
        <Text style={styles.heroLabel}>You can safely use</Text>
        <Text
          accessibilityLabel={`${money(s.safeToSpend)} safe to use until ${nextDay}`}
          style={styles.safeMoney}
        >
          {money(s.safeToSpend)}
        </Text>
        <Text style={styles.until}>
          until {nextDay}, without touching bills or work money
        </Text>
        <View style={styles.estimate}>
          <Text style={styles.estimateLabel}>Next payout estimate</Text>
          <Text style={styles.estimateValue}>
            {money(s.expectedPayoutMin)}–{money(s.expectedPayoutMax)}
          </Text>
          <Text style={styles.estimateHelp}>Not counted until it arrives</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            showMath
              ? "Hide safe money calculation"
              : "See safe money calculation"
          }
          onPress={() => setShowMath((value) => !value)}
          style={({ pressed }) => [styles.explain, pressed && styles.pressed]}
        >
          <Text style={styles.explainText}>
            {showMath ? "Hide calculation" : "See how this was calculated"}
          </Text>
        </Pressable>
        {showMath && (
          <View accessibilityLiveRegion="polite" style={styles.math}>
            <MoneyLine label="Money available" value={s.availableBalance} />
            <MoneyLine label="Kept aside" value={-s.protectedMoney} />
            <View style={styles.rule} />
            <MoneyLine label="Safe to use now" value={s.safeToSpend} strong />
          </View>
        )}
      </Card>

      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <Button
            title="Add income or cost"
            tone="quiet"
            onPress={() => router.push("/(app)/income")}
          />
        </View>
        <View style={styles.actionButton}>
          <Button title="Plan a payout" onPress={() => router.push("/split")} />
        </View>
      </View>

      <Card style={styles.nextAction}>
        <Label>Best next step</Label>
        <Text style={ui.h2}>{dashboard.recommendation.title}</Text>
        <Text style={ui.body}>{dashboard.recommendation.body}</Text>
        <Button
          title={dashboard.recommendation.action}
          tone="ink"
          onPress={() => router.push("/(app)/plan")}
        />
      </Card>

      <View style={styles.twoCards}>
        <Card style={styles.halfCard}>
          <WalletCards
            accessible={false}
            color={colors.accent as string}
            size={21}
          />
          <Text style={styles.cardLabel}>You kept this week</Text>
          <Text style={styles.cardValue}>{money(s.trueNetIncomeWeek)}</Text>
          <Text style={ui.small}>
            After {money(s.workCostsWeek)} in work costs
          </Text>
        </Card>
        <Card style={styles.halfCard}>
          <ShieldCheck
            accessible={false}
            color={colors.accent as string}
            size={21}
          />
          <Text style={styles.cardLabel}>Emergency cover</Text>
          <Text style={styles.cardValue}>
            {Math.floor(s.protectedDays)}{" "}
            {Math.floor(s.protectedDays) === 1 ? "day" : "days"}
          </Text>
          <Progress
            label={`Emergency cover is ${Math.floor(s.protectedDays)} of ${s.cushionTargetDays} goal days`}
            value={cushionPct}
            tone={colors.green}
          />
          <Text style={ui.small}>Goal: {s.cushionTargetDays} days</Text>
        </Card>
      </View>

      <Card>
        <View style={ui.between}>
          <View>
            <Label>Coming up</Label>
            <Text style={ui.h2}>Your next money events</Text>
          </View>
          <CalendarClock
            accessible={false}
            color={colors.accent as string}
            size={23}
          />
        </View>
        {nextEvents.length ? (
          nextEvents.map((event) => (
            <View
              accessible
              accessibilityLabel={`${event.title}, ${money(event.amountMin)}, ${new Date(event.date).toLocaleDateString("en-IN")}`}
              key={event.id}
              style={styles.event}
            >
              <View style={styles.eventText}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={ui.small}>
                  {new Date(event.date).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                  {event.type === "INCOME" ? " · expected" : " · due"}
                </Text>
              </View>
              <Text style={styles.eventAmount}>
                {event.amountMin === event.amountMax
                  ? money(event.amountMin)
                  : `${money(event.amountMin)}–${money(event.amountMax)}`}
              </Text>
            </View>
          ))
        ) : (
          <Text style={ui.body}>
            Add a payout date or bill to see what comes next.
          </Text>
        )}
      </Card>

      <Text style={styles.note}>
        Forecasts are estimates. SuperFinz is a planning prototype, not a bank
        or lender.
      </Text>
    </Screen>
  );
}

function MoneyLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <View style={styles.moneyLine}>
      <Text style={[styles.mathText, strong && styles.mathStrong]}>
        {label}
      </Text>
      <Text style={[styles.mathValue, strong && styles.mathStrong]}>
        {value < 0 ? "− " : ""}
        {money(Math.abs(value))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  date: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  hero: {
    backgroundColor: colors.actionStrong,
    borderColor: colors.actionStrong,
    gap: 10,
  },
  heroLabel: { color: colors.inverseMuted, fontSize: 14, fontWeight: "600" },
  safeMoney: {
    color: colors.white,
    fontSize: 52,
    lineHeight: 58,
    fontWeight: "700",
    letterSpacing: -2.2,
    fontVariant: ["tabular-nums"],
  },
  until: {
    color: colors.white,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "600",
  },
  estimate: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.inverseBorder,
    borderRadius: 14,
    padding: 13,
    gap: 2,
  },
  estimateLabel: {
    color: colors.inverseMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  estimateValue: {
    color: colors.white,
    fontSize: 19,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  estimateHelp: { color: colors.inverseMuted, fontSize: 12 },
  explain: { minHeight: 46, alignItems: "center", justifyContent: "center" },
  explainText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  pressed: { opacity: 0.7 },
  math: {
    borderTopWidth: 1,
    borderColor: colors.inverseBorder,
    paddingTop: 12,
    gap: 8,
  },
  moneyLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  mathText: { color: colors.inverseMuted, fontSize: 13 },
  mathValue: {
    color: colors.inverseMuted,
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  mathStrong: { color: colors.white, fontWeight: "700" },
  rule: { height: 1, backgroundColor: colors.inverseBorder },
  actions: { flexDirection: "row", gap: 10 },
  actionButton: { flex: 1 },
  nextAction: { backgroundColor: colors.accentSoft },
  twoCards: { flexDirection: "row", alignItems: "stretch", gap: 12 },
  halfCard: { flex: 1, minWidth: 0, padding: 15 },
  cardLabel: { color: colors.inkSoft, fontSize: 13, fontWeight: "600" },
  cardValue: {
    color: colors.ink,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  event: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingVertical: 11,
  },
  eventText: { flex: 1 },
  eventTitle: { color: colors.ink, fontWeight: "600", fontSize: 14 },
  eventAmount: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  note: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
});
