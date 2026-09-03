import { useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import {
  ChartNoAxesCombined,
  Check,
  Gauge,
  Share2,
  ShieldCheck,
  TriangleAlert,
  WalletCards,
} from "lucide-react-native";
import {
  deriveGigInsights,
  simulateGigScenario,
  type GigScenarioInput,
} from "@superfinz/shared";
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

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const scenarios: Array<{
  id: string;
  label: string;
  detail: string;
  input: GigScenarioInput;
}> = [
  {
    id: "late",
    label: "Payout 3 days late",
    detail: "Check bills and work money during a delay.",
    input: {
      incomeChangePct: 0,
      payoutDelayDays: 3,
      surpriseCost: 0,
      workDaysOff: 0,
      workCostChangePct: 0,
    },
  },
  {
    id: "slow",
    label: "Income falls 30%",
    detail: "See how a weaker month changes the plan.",
    input: {
      incomeChangePct: -30,
      payoutDelayDays: 0,
      surpriseCost: 0,
      workDaysOff: 0,
      workCostChangePct: 0,
    },
  },
  {
    id: "repair",
    label: "₹2,500 repair",
    detail: "Test an urgent earning-related cost.",
    input: {
      incomeChangePct: 0,
      payoutDelayDays: 0,
      surpriseCost: 2_500,
      workDaysOff: 0,
      workCostChangePct: 0,
    },
  },
  {
    id: "rest",
    label: "Take one day off",
    detail: "Check the impact before choosing a rest day.",
    input: {
      incomeChangePct: 0,
      payoutDelayDays: 0,
      surpriseCost: 0,
      workDaysOff: 1,
      workCostChangePct: 0,
    },
  },
];

export default function Insights() {
  const [selectedId, setSelectedId] = useState(scenarios[0].id);
  const query = useGigDashboard();
  if (query.isLoading) return <Loading label="Building your 30-day view…" />;
  if (query.isError || !query.data)
    return (
      <ErrorState
        title="Couldn’t load planning insights"
        body={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => query.refetch()}
      />
    );

  const dashboard = query.data.dashboard;
  const insights = deriveGigInsights(dashboard);
  const selected = scenarios.find((item) => item.id === selectedId)!;
  const scenario = simulateGigScenario(dashboard, selected.input);
  const statusLabel =
    insights.outlook.status === "ON_TRACK"
      ? "Plan holds"
      : insights.outlook.status === "WATCH"
        ? "Watch closely"
        : "Action needed";
  const Icon = scenario.earningTarget > 0 ? TriangleAlert : Check;

  const sharePlan = async () => {
    const summary = [
      "My SuperFinz plan",
      `Safe to spend now: ${money(dashboard.summary.safeToSpend)}`,
      `30-day projected low point: ${money(insights.outlook.lowestBalanceLow)} to ${money(insights.outlook.lowestBalanceHigh)}`,
      `Weekly take-home after work costs: ${money(insights.earnings.net)}`,
      `Emergency cover: ${Math.floor(dashboard.summary.protectedDays)} days`,
      "Forecasts are estimates. SuperFinz plans money but does not move it.",
    ].join("\n");
    try {
      await Share.share({ title: "My SuperFinz plan", message: summary });
    } catch {
      // The system share sheet can be dismissed or unavailable. The user's
      // plan remains private and unchanged in either case.
    }
  };

  return (
    <Screen
      back
      title="Plan ahead"
      subtitle="Deeper tools stay here, so your Today page remains simple."
      help={{
        title: "Planning insights",
        body: "These are estimates built from your saved income range, bills, and work costs. Expected money never increases what is safe today.",
      }}
    >
      <Card style={styles.intro}>
        <View style={styles.iconBox}>
          <ChartNoAxesCombined
            accessible={false}
            color={colors.accent as string}
            size={23}
          />
        </View>
        <View style={styles.introText}>
          <Label>SuperFinz Plus preview</Label>
          <Text style={ui.h2}>See what may happen before it happens.</Text>
          <Text style={ui.body}>
            Your runway, true earnings, and slow-week checks use the same saved
            plan as Today.
          </Text>
        </View>
      </Card>

      <Card style={styles.outlook}>
        <View style={styles.outlookTop}>
          <View style={styles.outlookTitle}>
            <Text style={styles.inverseLabel}>30-day runway</Text>
            <Text style={styles.inverseTitle}>{insights.outlook.title}</Text>
          </View>
          <View accessible accessibilityLabel={`Status: ${statusLabel}`} style={styles.status}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={styles.inverseBody}>{insights.outlook.body}</Text>
        <View style={styles.metricRow}>
          <InverseMetric
            label="Low estimate"
            value={money(insights.outlook.lowestBalanceLow)}
          />
          <InverseMetric
            label="High estimate"
            value={money(insights.outlook.lowestBalanceHigh)}
          />
        </View>
        <InverseMetric
          label="Your safety floor"
          value={money(insights.outlook.safetyFloor)}
        />
        <Text style={styles.inverseNote}>
          {insights.month.confidence.toLowerCase()} confidence · expected money
          is never added to today’s safe amount.
        </Text>
      </Card>

      <Card>
        <View style={styles.sectionTitle}>
          <WalletCards
            accessible={false}
            color={colors.accent as string}
            size={22}
          />
          <Text style={ui.h2}>True earnings lens</Text>
        </View>
        <Text style={ui.body}>For every ₹100 earned</Text>
        <View style={styles.keepLine}>
          <Text style={styles.keepMoney}>
            ₹{Math.max(0, Math.round(insights.earnings.keptPerHundred))}
          </Text>
          <Text style={styles.keepCopy}>stays after work costs</Text>
        </View>
        <Progress
          label={`${Math.round(insights.earnings.keptPerHundred)} rupees of every 100 stays after work costs`}
          value={insights.earnings.keptPerHundred}
          tone={colors.accent}
        />
        <View style={styles.metricRow}>
          <SimpleMetric
            label="Take-home"
            value={money(insights.earnings.net)}
          />
          <SimpleMetric
            label="Work costs"
            value={money(insights.earnings.workCosts)}
          />
        </View>
        <Text style={ui.small}>
          {insights.earnings.basis === "ACTUAL_WEEK"
            ? "Based on settled entries from the last seven days."
            : "Not enough settled income this week, so this uses your typical week."}
        </Text>
      </Card>

      <Card>
        <View style={styles.sectionTitle}>
          <ShieldCheck
            accessible={false}
            color={colors.accent as string}
            size={22}
          />
          <Text style={ui.h2}>Slow-week Shield</Text>
        </View>
        <Text style={ui.body}>
          Pick one situation to recalculate your plan. Nothing is saved or
          moved.
        </Text>
        <View style={styles.scenarios}>
          {scenarios.map((item) => {
            const active = item.id === selectedId;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityHint={item.detail}
                onPress={() => setSelectedId(item.id)}
                style={({ pressed }) => [
                  styles.scenario,
                  active && styles.scenarioActive,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.scenarioTitle}>
                  <Text style={styles.scenarioName}>{item.label}</Text>
                  {active && (
                    <Check
                      accessible={false}
                      color={colors.accent as string}
                      size={18}
                    />
                  )}
                </View>
                <Text style={styles.scenarioDetail}>{item.detail}</Text>
              </Pressable>
            );
          })}
        </View>

        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.result,
            scenario.earningTarget > 0
              ? styles.resultWarning
              : styles.resultGood,
          ]}
        >
          <Label>Result for {selected.label}</Label>
          <View style={styles.resultNumbers}>
            <View style={styles.resultNumber}>
              <Text style={styles.resultLabel}>Safe to spend</Text>
              <Text style={styles.resultMoney}>
                {money(scenario.safeToSpend)}
              </Text>
            </View>
            <View style={styles.resultNumber}>
              <Text style={styles.resultLabel}>Verified gap</Text>
              <Text style={styles.resultMoney}>
                {money(scenario.earningTarget)}
              </Text>
            </View>
          </View>
          <View style={styles.actionLine}>
            <Icon
              accessible={false}
              color={colors.ink as string}
              size={19}
            />
            <Text style={styles.actionText}>{scenario.recommendedAction}</Text>
          </View>
          {scenario.earningTarget > 0 && (
            <Text style={ui.small}>
              Smallest target: {money(scenario.targetPerRemainingWorkday)} per
              remaining workday.
            </Text>
          )}
        </View>
      </Card>

      <Card>
        <View style={styles.sectionTitle}>
          <Share2
            accessible={false}
            color={colors.accent as string}
            size={22}
          />
          <Text style={ui.h2}>Share only when you choose</Text>
        </View>
        <Text style={ui.body}>
          Create a short plan summary for your family or financial counsellor.
          SuperFinz never reads your contacts.
        </Text>
        <Button
          title="Share my summary"
          onPress={() => void sharePlan()}
          accessibilityHint="Opens your phone's private share sheet"
        />
      </Card>

      <View style={styles.note}>
        <Gauge
          accessible={false}
          color={colors.muted as string}
          size={17}
        />
        <Text style={styles.noteText}>
          Forecasts are estimates, not guarantees. SuperFinz does not move
          money or approve credit.
        </Text>
      </View>
    </Screen>
  );
}

function InverseMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.inverseMetric}>
      <Text style={styles.inverseMetricLabel}>{label}</Text>
      <Text style={styles.inverseMetricValue}>{value}</Text>
    </View>
  );
}

function SimpleMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.simpleMetric}>
      <Text style={styles.simpleMetricLabel}>{label}</Text>
      <Text style={styles.simpleMetricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.accentSoft,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  introText: { flex: 1, gap: 6 },
  outlook: {
    gap: 14,
    backgroundColor: colors.actionStrong,
    borderColor: colors.actionStrong,
  },
  outlookTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  outlookTitle: { flex: 1, gap: 4 },
  inverseLabel: { color: colors.inverseMuted, fontSize: 13, fontWeight: "600" },
  inverseTitle: { color: colors.white, fontSize: 23, lineHeight: 29, fontWeight: "700" },
  inverseBody: { color: colors.white, fontSize: 15, lineHeight: 22 },
  inverseNote: { color: colors.inverseMuted, fontSize: 12, lineHeight: 18 },
  status: {
    alignSelf: "flex-start",
    minHeight: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.inverseBorder,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
    gap: 10,
  },
  inverseMetric: {
    flex: 1,
    minWidth: 128,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inverseBorder,
    padding: 12,
    gap: 3,
  },
  inverseMetricLabel: { color: colors.inverseMuted, fontSize: 11, fontWeight: "600" },
  inverseMetricValue: { color: colors.white, fontSize: 18, fontWeight: "700", fontVariant: ["tabular-nums"] },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: 9 },
  keepLine: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 8 },
  keepMoney: { color: colors.ink, fontSize: 40, lineHeight: 46, fontWeight: "700", fontVariant: ["tabular-nums"] },
  keepCopy: { color: colors.inkSoft, fontSize: 14, fontWeight: "600" },
  simpleMetric: {
    flex: 1,
    minWidth: 128,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 3,
  },
  simpleMetricLabel: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  simpleMetricValue: { color: colors.ink, fontSize: 17, fontWeight: "700", fontVariant: ["tabular-nums"] },
  scenarios: { gap: 10 },
  scenario: {
    minHeight: 78,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    justifyContent: "center",
    gap: 5,
  },
  scenarioActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  pressed: { opacity: 0.72 },
  scenarioTitle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  scenarioName: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: "700" },
  scenarioDetail: { color: colors.inkSoft, fontSize: 13, lineHeight: 19 },
  result: { borderRadius: 16, borderWidth: 1, padding: 15, gap: 12 },
  resultWarning: { borderColor: colors.yellow, backgroundColor: colors.paper2 },
  resultGood: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  resultNumbers: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  resultNumber: { flex: 1, minWidth: 128 },
  resultLabel: { color: colors.inkSoft, fontSize: 12, fontWeight: "600" },
  resultMoney: { color: colors.ink, fontSize: 23, lineHeight: 29, fontWeight: "700", fontVariant: ["tabular-nums"] },
  actionLine: { flexDirection: "row", alignItems: "flex-start", gap: 9, borderTopWidth: 1, borderColor: colors.border, paddingTop: 12 },
  actionText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingHorizontal: 8, paddingBottom: 4 },
  noteText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 18 },
});
