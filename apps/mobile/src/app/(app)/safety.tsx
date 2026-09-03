import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { LockKeyhole, ShieldCheck } from "lucide-react-native";
import type { PocketKind } from "@superfinz/shared";
import {
  Button,
  Card,
  ErrorState,
  Label,
  Loading,
  Progress,
  Screen,
  ui,
} from "@/components/ui";
import { colors } from "@/constants/theme";
import { useGigDashboard } from "@/hooks/use-gig-dashboard";

const pocketNames: Record<PocketKind, string> = {
  ESSENTIALS: "Bills and essentials",
  WORK_COSTS: "Work money",
  EMERGENCY_CUSHION: "Emergency cushion",
  LONG_TERM_SAVINGS: "Long-term savings",
  FLEXIBLE_SPENDING: "Flexible spending",
};
const mainKinds = new Set<PocketKind>([
  "ESSENTIALS",
  "WORK_COSTS",
  "EMERGENCY_CUSHION",
]);
const money = (value: number) =>
  `₹${Math.round(value).toLocaleString("en-IN")}`;

export default function Safety() {
  const [showMore, setShowMore] = useState(false);
  const query = useGigDashboard();
  if (query.isLoading) return <Loading label="Checking your safety money…" />;
  if (query.isError || !query.data)
    return (
      <ErrorState
        title="Couldn’t load safety money"
        body={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => query.refetch()}
      />
    );

  const dashboard = query.data.dashboard;
  const s = dashboard.summary;
  const mainPockets = dashboard.pockets.filter((pocket) =>
    mainKinds.has(pocket.kind),
  );
  const otherPockets = dashboard.pockets.filter(
    (pocket) => !mainKinds.has(pocket.kind),
  );
  const weakest = [...dashboard.resilienceFactors].sort(
    (a, b) => a.score - b.score,
  )[0];

  return (
    <Screen
      title="Safety"
      subtitle="Money kept away from everyday spending."
      help={{
        title: "Safety money",
        body: "These amounts are protected for important bills, work costs, and emergencies. They are part of your plan and are not moved by SuperFinz.",
      }}
    >
      <Card style={styles.hero}>
        <ShieldCheck
          accessible={false}
          color={colors.green as string}
          size={26}
        />
        <Text style={styles.heroLabel}>Money kept aside</Text>
        <Text
          accessibilityLabel={`${money(s.protectedMoney)} kept aside`}
          style={styles.heroMoney}
        >
          {money(s.protectedMoney)}
        </Text>
        <Text style={styles.heroText}>
          This protects bills, work costs, and about{" "}
          {Math.floor(s.protectedDays)} emergency{" "}
          {Math.floor(s.protectedDays) === 1 ? "day" : "days"}.
        </Text>
      </Card>

      <View style={styles.pockets}>
        {mainPockets.map((pocket) => (
          <Pocket key={pocket.id} pocket={pocket} />
        ))}
      </View>

      {weakest && (
        <Card style={styles.nextStep}>
          <Label>One way to get safer</Label>
          <Text style={ui.h2}>{weakest.label}</Text>
          <Text style={ui.body}>{weakest.action}</Text>
          <Text style={ui.small}>{weakest.evidence}</Text>
        </Card>
      )}

      <Button
        title={showMore ? "Hide full safety check" : "See full safety check"}
        tone="quiet"
        onPress={() => setShowMore((value) => !value)}
      />

      {showMore && (
        <View style={styles.more}>
          <Card>
            <Label>Overall safety check</Label>
            <Text style={styles.score}>{s.resilienceScore}/100</Text>
            <Text style={ui.h2}>{s.resilienceStatus}</Text>
            <Text style={ui.small}>
              This is a planning check, not a credit score or loan decision.
            </Text>
            {dashboard.resilienceFactors.map((factor) => (
              <View key={factor.key} style={styles.factor}>
                <View style={ui.between}>
                  <Text style={styles.factorName}>{factor.label}</Text>
                  <Text style={styles.factorScore}>{factor.score}/100</Text>
                </View>
                <Progress
                  label={`${factor.label}: ${factor.score} out of 100`}
                  value={factor.score}
                  tone={factor.score >= 60 ? colors.green : colors.yellow}
                />
                <Text style={ui.small}>{factor.evidence}</Text>
              </View>
            ))}
          </Card>

          {otherPockets.map((pocket) => (
            <Pocket key={pocket.id} pocket={pocket} />
          ))}

          <Card>
            <View style={styles.privacyTitle}>
              <LockKeyhole
                accessible={false}
                color={colors.accent as string}
                size={21}
              />
              <Text style={ui.h2}>Your private data stays limited</Text>
            </View>
            <Text style={ui.body}>
              SuperFinz does not read contacts, messages, call logs, photos, or
              social graphs. Expected payouts stay separate from money already
              received.
            </Text>
          </Card>
        </View>
      )}

      <Button
        title="Change my safety goal"
        tone="quiet"
        onPress={() => router.push("/(app)/profile")}
      />
      <Text style={styles.note}>SuperFinz plans money but never moves it.</Text>
    </Screen>
  );
}

function Pocket({
  pocket,
}: {
  pocket: {
    id: string;
    kind: PocketKind;
    currentAmount: number;
    targetAmount: number;
  };
}) {
  const progress = pocket.targetAmount
    ? (pocket.currentAmount / pocket.targetAmount) * 100
    : 100;
  return (
    <Card>
      <Text style={styles.pocketName}>{pocketNames[pocket.kind]}</Text>
      <Text style={styles.pocketMoney}>{money(pocket.currentAmount)}</Text>
      <Progress
        label={`${pocketNames[pocket.kind]}: ${money(pocket.currentAmount)} of ${money(pocket.targetAmount)}`}
        value={progress}
        tone={colors.green}
      />
      <Text style={ui.small}>Goal {money(pocket.targetAmount)}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.actionStrong,
    borderColor: colors.actionStrong,
  },
  heroLabel: { color: colors.inverseMuted, fontSize: 14, fontWeight: "600" },
  heroMoney: {
    color: colors.white,
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "700",
    letterSpacing: -1.8,
    fontVariant: ["tabular-nums"],
  },
  heroText: {
    color: colors.white,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
  },
  pockets: { gap: 12 },
  pocketName: { color: colors.inkSoft, fontSize: 14, fontWeight: "600" },
  pocketMoney: {
    color: colors.ink,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  nextStep: { backgroundColor: colors.accentSoft },
  more: { gap: 12 },
  score: {
    color: colors.ink,
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  factor: {
    gap: 8,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 12,
  },
  factorName: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: "600" },
  factorScore: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  privacyTitle: { flexDirection: "row", alignItems: "center", gap: 9 },
  note: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    paddingBottom: 4,
  },
});
