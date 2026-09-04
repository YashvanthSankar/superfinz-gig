import { useState } from "react";
import { Share, StyleSheet, Text, View } from "react-native";
import { Check, Share2, TriangleAlert } from "lucide-react-native";
import {
  deriveGigInsights,
  simulateGigScenario,
  type GigInsightsDto,
  type GigScenarioInput,
} from "@superfinz/shared";
import {
  Badge,
  Button,
  Card,
  Chip,
  ErrorState,
  IconButton,
  Label,
  Loading,
  Money,
  Notice,
  Screen,
  SectionHeader,
  Stat,
  formatMoney,
  ui,
  type BadgeTone,
} from "@/components/ui";
import { colorString, colors, radius, space } from "@/constants/theme";
import { useGigDashboard } from "@/hooks/use-gig-dashboard";

/* ------------------------------------------------------------------ */
/* Scenario presets and label maps                                     */
/* ------------------------------------------------------------------ */

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
    label: `${formatMoney(2_500)} repair`,
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

type OutlookStatus = GigInsightsDto["outlook"]["status"];
type Confidence = GigInsightsDto["month"]["confidence"];
type EarningsBasis = GigInsightsDto["earnings"]["basis"];

const statusLabels: Record<OutlookStatus, string> = {
  ON_TRACK: "Plan holds",
  WATCH: "Watch closely",
  AT_RISK: "Action needed",
};

const statusTones: Record<OutlookStatus, BadgeTone> = {
  ON_TRACK: "good",
  WATCH: "warn",
  AT_RISK: "bad",
};

const confidenceLabels: Record<Confidence, string> = {
  LOW: "Low confidence",
  MEDIUM: "Medium confidence",
  HIGH: "High confidence",
};

const basisLabels: Record<EarningsBasis, string> = {
  ACTUAL_WEEK: "Based on settled entries from the last seven days.",
  TYPICAL_WEEK:
    "Not enough settled income this week, so this uses your typical week.",
};

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function Insights() {
  const [selectedId, setSelectedId] = useState(scenarios[0].id);
  const [sharing, setSharing] = useState(false);
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
  const selected =
    scenarios.find((item) => item.id === selectedId) ?? scenarios[0];
  const scenario = simulateGigScenario(dashboard, selected.input);
  const planHolds = scenario.earningTarget <= 0;
  const ResultIcon = planHolds ? Check : TriangleAlert;
  const kept = Math.min(
    100,
    Math.max(0, Math.round(insights.earnings.keptPerHundred)),
  );
  const workCostShare = 100 - kept;

  const sharePlan = async () => {
    if (sharing) return;
    const summary = [
      "My SuperFinz plan",
      `Safe to spend now: ${formatMoney(dashboard.summary.safeToSpend)}`,
      `30-day projected low point: ${formatMoney(insights.outlook.lowestBalanceLow)} to ${formatMoney(insights.outlook.lowestBalanceHigh)}`,
      `Weekly take-home after work costs: ${formatMoney(insights.earnings.net)}`,
      `Emergency cover: ${Math.floor(dashboard.summary.protectedDays)} days`,
      "Forecasts are estimates. SuperFinz plans money but does not move it.",
    ].join("\n");
    setSharing(true);
    try {
      await Share.share({ title: "My SuperFinz plan", message: summary });
    } catch {
      // The system share sheet can be dismissed or unavailable. The user's
      // plan remains private and unchanged in either case.
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen
      back
      eyebrow="Plan ahead"
      title="Plan further than today."
      subtitle="Your runway, true earnings and slow-week checks use the same saved plan as Today."
      refreshing={query.isFetching && Boolean(query.data)}
      help={{
        title: "Planning insights",
        body: "These are estimates built from your saved income range, bills, and work costs. Expected money never increases what is safe today.",
      }}
      action={
        <IconButton
          icon={Share2}
          label="Share summary"
          hint="Opens your phone’s private share sheet"
          disabled={sharing}
          onPress={() => void sharePlan()}
        />
      }
    >
      <Notice tone="info">
        Expected money is never added to today’s safe amount.
      </Notice>

      <Card tone="navy">
        <View style={ui.between}>
          <Label tone="onPrimary">30-day runway</Label>
          <Badge
            label={statusLabels[insights.outlook.status]}
            tone={statusTones[insights.outlook.status]}
          />
        </View>
        <Text accessibilityRole="header" style={[ui.h2, ui.onPrimary]}>
          {insights.outlook.title}
        </Text>
        <Text style={[ui.body, ui.onPrimarySoft]}>{insights.outlook.body}</Text>
        <View style={styles.tiles}>
          <Stat
            onPrimary
            label="Low estimate"
            value={formatMoney(insights.outlook.lowestBalanceLow)}
            style={styles.tile}
          />
          <Stat
            onPrimary
            label="High estimate"
            value={formatMoney(insights.outlook.lowestBalanceHigh)}
            style={styles.tile}
          />
          <Stat
            onPrimary
            label="Safety floor"
            value={formatMoney(insights.outlook.safetyFloor)}
            style={styles.tile}
          />
        </View>
        <Text style={[ui.caption, ui.onPrimarySoft]}>
          {confidenceLabels[insights.month.confidence]} · lowest point across
          the next 30 days.
        </Text>
      </Card>

      <Card>
        <SectionHeader
          eyebrow="True earnings"
          title={`For every ${formatMoney(100)} earned`}
        />
        <Money size="lg" value={kept} />
        <Text style={ui.body}>stays after work costs</Text>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`${formatMoney(kept)} of every ${formatMoney(100)} stays after work costs`}
          accessibilityValue={{ min: 0, max: 100, now: kept }}
          style={styles.bar}
        >
          <View
            style={[
              styles.barSegment,
              { flexGrow: kept, backgroundColor: colors.action },
            ]}
          />
          <View
            style={[
              styles.barSegment,
              { flexGrow: workCostShare, backgroundColor: colors.warn },
            ]}
          />
        </View>
        <View style={styles.legend}>
          <View style={ui.row}>
            <View style={[styles.swatch, { backgroundColor: colors.action }]} />
            <Text style={ui.small}>Take-home {kept}%</Text>
          </View>
          <View style={ui.row}>
            <View style={[styles.swatch, { backgroundColor: colors.warn }]} />
            <Text style={ui.small}>Work costs {workCostShare}%</Text>
          </View>
        </View>
        <View style={styles.pair}>
          <Stat
            label="Take-home"
            value={formatMoney(insights.earnings.net)}
            help="This week"
            style={styles.pairItem}
          />
          <Stat
            label="Work costs"
            value={formatMoney(insights.earnings.workCosts)}
            help="This week"
            style={styles.pairItem}
          />
        </View>
        <Text style={ui.caption}>{basisLabels[insights.earnings.basis]}</Text>
      </Card>

      <Card>
        <SectionHeader
          eyebrow="Slow-week shield"
          title="Test a change before it happens."
          description="Pick one situation to recalculate your plan. Nothing is saved or moved."
        />
        <View style={ui.wrap}>
          {scenarios.map((item) => (
            <Chip
              key={item.id}
              role="radio"
              label={item.label}
              selected={item.id === selectedId}
              onPress={() => setSelectedId(item.id)}
            />
          ))}
        </View>
        <Text style={ui.small}>{selected.detail}</Text>

        <Card
          tone={planHolds ? "good" : "warn"}
          accessibilityLiveRegion="polite"
          style={styles.flat}
        >
          <Label>
            {planHolds ? "Result · gap covered" : "Result · action needed"}
          </Label>
          <View style={styles.pair}>
            <Stat
              label="Safe to spend"
              value={formatMoney(scenario.safeToSpend)}
              style={styles.pairItem}
            />
            <Stat
              label="Verified gap"
              value={formatMoney(scenario.earningTarget)}
              tone={planHolds ? "default" : "warn"}
              style={styles.pairItem}
            />
          </View>
          <View style={styles.actionLine}>
            <ResultIcon
              accessible={false}
              color={colorString(planHolds ? colors.good : colors.warn)}
              size={18}
              strokeWidth={2.2}
            />
            <Text style={styles.actionText}>{scenario.recommendedAction}</Text>
          </View>
          {!planHolds && (
            <Text style={ui.small}>
              Smallest target: {formatMoney(scenario.targetPerRemainingWorkday)}{" "}
              per remaining workday.
            </Text>
          )}
        </Card>
      </Card>

      <Card>
        <SectionHeader
          eyebrow="Share"
          title="Share only when you choose"
          description="Create a short plan summary for your family or financial counsellor."
        />
        <Button
          title="Share my summary"
          tone="quiet"
          icon={Share2}
          loading={sharing}
          onPress={() => void sharePlan()}
          accessibilityHint="Opens your phone’s private share sheet"
        />
        <Text style={ui.caption}>
          SuperFinz never reads your contacts. Nothing leaves your phone until
          you choose where to send it.
        </Text>
      </Card>

      <Text style={styles.footer}>
        Forecasts are estimates, not guarantees. SuperFinz does not move money
        or approve credit.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  tile: { flex: 1, minWidth: 120 },
  pair: { flexDirection: "row", gap: space.md },
  pairItem: { flex: 1 },
  bar: {
    flexDirection: "row",
    height: 10,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: colors.paper2,
    gap: 2,
  },
  barSegment: { flexBasis: 0, height: "100%" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: space.lg },
  swatch: { width: 10, height: 10, borderRadius: radius.pill },
  flat: { shadowOpacity: 0, elevation: 0 },
  actionLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.sm,
  },
  actionText: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  footer: {
    ...ui.caption,
    textAlign: "center",
    paddingHorizontal: space.sm,
  },
});
