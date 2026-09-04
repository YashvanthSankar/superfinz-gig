import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Settings2, ShieldCheck } from "lucide-react-native";
import type { PocketKind } from "@superfinz/shared";
import {
  Badge,
  Card,
  Divider,
  ErrorState,
  Expandable,
  Label,
  ListRow,
  Loading,
  Money,
  Notice,
  Progress,
  Screen,
  Stat,
  formatMoney,
  ui,
  type BadgeTone,
} from "@/components/ui";
import { colorString, colors, radius } from "@/constants/theme";
import { useGigDashboard } from "@/hooks/use-gig-dashboard";

const pocketNames: Record<PocketKind, string> = {
  ESSENTIALS: "Bills and essentials",
  WORK_COSTS: "Work money",
  EMERGENCY_CUSHION: "Emergency cushion",
  LONG_TERM_SAVINGS: "Investment goal",
  FLEXIBLE_SPENDING: "Flexible spending",
};
const mainKinds = new Set<PocketKind>([
  "ESSENTIALS",
  "WORK_COSTS",
  "EMERGENCY_CUSHION",
]);

const statusTone = (score: number): BadgeTone =>
  score >= 70 ? "good" : score >= 40 ? "warn" : "bad";

export default function Safety() {
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
  const coverDays = Math.floor(s.protectedDays);
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
      eyebrow="Protected money"
      title="Safety"
      subtitle="Money kept away from everyday spending."
      help={{
        title: "Safety money",
        body: "These amounts are protected for important bills, work costs and emergencies. They are part of your plan and are not moved by SuperFinz.",
      }}
      refreshing={query.isFetching && Boolean(query.data)}
    >
      <Card tone="navy">
        <View style={ui.between}>
          <View style={styles.heroIcon}>
            <ShieldCheck
              accessible={false}
              color={colorString(colors.onPrimary)}
              size={22}
            />
          </View>
          <Badge
            label={s.resilienceStatus}
            tone={statusTone(s.resilienceScore)}
          />
        </View>
        <View
          accessible
          accessibilityLabel={`${formatMoney(s.protectedMoney)} kept aside. This protects bills, work costs and about ${coverDays} emergency ${coverDays === 1 ? "day" : "days"}.`}
          style={styles.heroCopy}
        >
          <Label tone="onPrimary">Money kept aside</Label>
          <Money size="xl" onPrimary value={s.protectedMoney} />
          <Text style={[ui.body, ui.onPrimarySoft]}>
            This protects bills, work costs and about {coverDays} emergency{" "}
            {coverDays === 1 ? "day" : "days"}.
          </Text>
        </View>
      </Card>

      {mainPockets.map((pocket) => (
        <Pocket key={pocket.id} pocket={pocket} />
      ))}

      {weakest && (
        <Card tone="tint">
          <Label tone="accent">One way to get safer</Label>
          <Text accessibilityRole="header" style={ui.h2}>
            {weakest.label}
          </Text>
          <Text style={ui.body}>{weakest.action}</Text>
          <Text style={ui.small}>{weakest.evidence}</Text>
        </Card>
      )}

      <Card>
        <Expandable
          title="Full safety check"
          summary="Score, factors and other pockets"
        >
          <Stat
            label="Overall safety check"
            value={`${s.resilienceScore}/100`}
            help={s.resilienceStatus}
          />
          <Text style={ui.caption}>
            This is a planning check, not a credit score.
          </Text>
          <Divider />
          {dashboard.resilienceFactors.map((factor) => (
            <Fragment key={factor.key}>
              <View style={styles.factor}>
                <View style={ui.between}>
                  <Text style={[ui.bodyStrong, styles.factorName]}>
                    {factor.label}
                  </Text>
                  <Text style={[ui.bodyStrong, ui.num, styles.factorScore]}>
                    {factor.score}/100
                  </Text>
                </View>
                <Progress
                  label={`${factor.label}: ${factor.score} out of 100`}
                  value={factor.score}
                  tone={factor.score >= 60 ? colors.good : colors.warn}
                />
                <Text style={ui.small}>{factor.evidence}</Text>
              </View>
              <Divider />
            </Fragment>
          ))}
          {otherPockets.length > 0 && (
            <View style={styles.otherPockets}>
              <Label>Other pockets</Label>
              {otherPockets.map((pocket, index) => (
                <Fragment key={pocket.id}>
                  <Pocket pocket={pocket} flat />
                  {index < otherPockets.length - 1 && <Divider />}
                </Fragment>
              ))}
            </View>
          )}
          <Notice tone="info" title="Your private data stays limited">
            SuperFinz does not read contacts, messages, call logs, photos or
            social graphs. Expected payouts stay separate from money already
            received.
          </Notice>
        </Expandable>
      </Card>

      <Card padded={false}>
        <View style={styles.listBody}>
          <ListRow
            icon={Settings2}
            title="Change my safety goal"
            subtitle="Cushion target and buffer"
            onPress={() => router.push("/(app)/profile")}
            last
          />
        </View>
      </Card>

      <Text style={[ui.caption, styles.footer]}>
        SuperFinz plans money but never moves it.
      </Text>
    </Screen>
  );
}

function Pocket({
  pocket,
  flat = false,
}: {
  pocket: {
    id: string;
    kind: PocketKind;
    currentAmount: number;
    targetAmount: number;
  };
  /** Render without its own card, for use inside another card. */
  flat?: boolean;
}) {
  const name = pocketNames[pocket.kind];
  const hasGoal = pocket.targetAmount > 0;
  const progress = hasGoal
    ? (pocket.currentAmount / pocket.targetAmount) * 100
    : 0;
  const onTrack = hasGoal && progress >= 100;
  const badge: { label: string; tone: BadgeTone } = !hasGoal
    ? { label: "No goal", tone: "neutral" }
    : onTrack
      ? { label: "On track", tone: "good" }
      : { label: "Building", tone: "accent" };
  const body = (
    <>
      <View style={ui.between}>
        <Text accessibilityRole="header" style={[ui.h3, styles.pocketName]}>
          {name}
        </Text>
        <Badge label={badge.label} tone={badge.tone} />
      </View>
      <Money size={flat ? "md" : "lg"} value={pocket.currentAmount} />
      {hasGoal ? (
        <>
          <Progress
            label={`${name}: ${formatMoney(pocket.currentAmount)} of ${formatMoney(pocket.targetAmount)} goal`}
            value={progress}
            tone={onTrack ? colors.good : colors.accent}
          />
          <Text style={ui.caption}>Goal {formatMoney(pocket.targetAmount)}</Text>
        </>
      ) : (
        <Text style={ui.caption}>No goal set</Text>
      )}
    </>
  );
  if (flat) return <View style={styles.flatPocket}>{body}</View>;
  return <Card>{body}</Card>;
}

const styles = StyleSheet.create({
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.onPrimaryBorder,
    backgroundColor: colors.onPrimaryPanel,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: { gap: 6 },
  pocketName: { flex: 1, minWidth: 0 },
  flatPocket: { gap: 8, paddingVertical: 4 },
  otherPockets: { gap: 10 },
  factor: { gap: 8, paddingVertical: 2 },
  factorName: { flex: 1, minWidth: 0 },
  factorScore: { textAlign: "right" },
  listBody: { paddingHorizontal: 18 },
  footer: { textAlign: "center", paddingHorizontal: 8, paddingBottom: 4 },
});
