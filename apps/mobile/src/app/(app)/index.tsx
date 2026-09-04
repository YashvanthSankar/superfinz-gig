import { useRef } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { QUICK_SETUP_DASHBOARD_COPY } from "@superfinz/shared";
import {
  ArrowRight,
  CalendarClock,
  ChartNoAxesCombined,
  HandCoins,
  Plus,
  Settings2,
  WalletCards,
} from "lucide-react-native";
import {
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Expandable,
  IconButton,
  Label,
  ListRow,
  Loading,
  Money,
  Progress,
  Screen,
  SectionHeader,
  Stat,
  formatDate,
  formatMoney,
  formatMoneyRange,
  ui,
} from "@/components/ui";
import { colorString, colors, radius } from "@/constants/theme";
import { useGigDashboard } from "@/hooks/use-gig-dashboard";
import { apiFetch } from "@/lib/api";

export default function Today() {
  const checkedOnce = useRef(false);
  const query = useGigDashboard();
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
  const noPayoutDate =
    s.payoutStatus === "NO_ACTIVE_SOURCE" || s.payoutStatus === "UNSCHEDULED";
  const nextDay = formatDate(s.safeUntil, { weekday: "long" });
  const safeWindow =
    s.payoutStatus === "OVERDUE"
      ? "for the next 7 days while your payout is overdue"
      : noPayoutDate
        ? "for the next 7 days while no payout date is set"
        : `until ${nextDay}`;
  const coverDays = Math.floor(s.protectedDays);
  const cushionPct = s.cushionTargetDays
    ? (s.protectedDays / s.cushionTargetDays) * 100
    : 0;
  const nextEvents = dashboard.timeline.slice(0, 2);
  const recentEntries = dashboard.entries
    .filter((entry) => ["SETTLED", "PAID"].includes(entry.status))
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime() ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 3);
  const today = formatDate(new Date(), {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const personalized =
    QUICK_SETUP_DASHBOARD_COPY[dashboard.profile.primaryPriority];

  const handleCalculationToggle = (open: boolean) => {
    if (!open || checkedOnce.current) return;
    checkedOnce.current = true;
    void apiFetch("/api/gig/outcomes", {
      method: "POST",
      body: JSON.stringify({
        type: "SAFE_TO_SPEND_CHECKED",
        value: s.safeToSpend,
      }),
    }).catch(() => undefined);
  };

  return (
    <Screen
      eyebrow={today}
      title="Today"
      subtitle={`Hello, ${dashboard.profile.preferredName}. ${personalized.introduction}`}
      action={
        <IconButton
          icon={Settings2}
          label="Open settings"
          onPress={() => router.push("/(app)/profile")}
        />
      }
      help={{
        title: "Your Today page",
        body: "Start with the safe-to-use figure. It is money left after protecting your bills, work costs and safety savings.",
      }}
      refreshing={query.isFetching && Boolean(query.data)}
    >
      <View style={styles.focusPill} accessible accessibilityLabel={`Your dashboard focus is ${personalized.focus}`}>
        <Text style={styles.focusText}>Your focus · {personalized.focus}</Text>
      </View>
      <Card tone="navy">
        <View
          accessible
          accessibilityLabel={`${formatMoney(s.safeToSpend)} safe to use ${safeWindow}, without touching bills or work money`}
          style={styles.heroCopy}
        >
          <Label tone="onPrimary">You can safely use</Label>
          <Money size="xl" onPrimary value={s.safeToSpend} />
          <Text style={[ui.body, ui.onPrimarySoft]}>
            {safeWindow}, without touching bills or work money
          </Text>
        </View>
        <Stat
          onPrimary
          label={
            s.payoutStatus === "OVERDUE" ? "Payout overdue" : "Next payout estimate"
          }
          value={
            noPayoutDate
              ? "No payout date set"
              : formatMoneyRange(s.expectedPayoutMin, s.expectedPayoutMax)
          }
          help={
            s.payoutStatus === "OVERDUE"
              ? "Expected date passed · not counted until it arrives"
              : "Not counted until it arrives"
          }
        />
        <Expandable
          onPrimary
          title="How this was calculated"
          onToggle={handleCalculationToggle}
        >
          <MoneyLine label="Total money now" value={s.availableBalance} />
          <MoneyLine label="Bills, work and savings" value={-s.protectedMoney} />
          <Divider onPrimary />
          <MoneyLine label="Safe to spend" value={s.safeToSpend} strong />
        </Expandable>
      </Card>

      <View style={styles.actions}>
        <Button
          title="Add a cost"
          tone="quiet"
          icon={Plus}
          style={styles.actionButton}
          onPress={() => router.push("/(app)/income")}
        />
        <Button
          title="Plan a payout"
          tone="accent"
          icon={WalletCards}
          style={styles.actionButton}
          onPress={() => router.push("/split")}
        />
      </View>

      <Card padded={false}>
        <View style={styles.listHeader}>
          <SectionHeader
            eyebrow="Just recorded"
            title="Latest money activity"
            description="New payouts and costs appear here as soon as they are saved."
          />
        </View>
        <View style={styles.listBody}>
          {recentEntries.length ? (
            recentEntries.map((entry, index) => {
              const income = entry.kind === "INCOME";
              return (
                <ListRow
                  key={entry.id}
                  icon={income ? HandCoins : WalletCards}
                  iconTone={income ? "good" : "warn"}
                  title={
                    income
                      ? `${entry.sourceName ?? "Income"} received`
                      : entry.category
                  }
                  subtitle={`${formatDate(entry.date, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })} · ${entry.category}`}
                  value={`${income ? "+" : "−"}${formatMoney(entry.amount)}`}
                  last={index === recentEntries.length - 1}
                />
              );
            })
          ) : (
            <EmptyState
              icon={HandCoins}
              title="No money activity yet"
              body="Record your first payout or cost and it will appear here."
            />
          )}
        </View>
      </Card>

      <Card tone="tint">
        <Label tone="accent">Best next step</Label>
        <Text accessibilityRole="header" style={ui.h2}>
          {dashboard.recommendation.title}
        </Text>
        <Text style={ui.body}>{dashboard.recommendation.body}</Text>
        <Button
          title={dashboard.recommendation.action}
          tone="ink"
          size="sm"
          inline
          iconRight={ArrowRight}
          onPress={() => router.push("/(app)/plan")}
        />
      </Card>

      <Card>
        <View style={styles.stats}>
          <Stat
            label="Net work earnings"
            value={formatMoney(s.trueNetIncomeWeek)}
            help={`This week, after ${formatMoney(s.workCostsWeek)} in work costs`}
            style={styles.stat}
          />
          <View style={[styles.stat, styles.statStack]}>
            <Stat
              label="Emergency cover"
              value={`${coverDays} ${coverDays === 1 ? "day" : "days"}`}
              help={`Goal ${s.cushionTargetDays} days`}
            />
            <Progress
              label={`Emergency cover is ${coverDays} of ${s.cushionTargetDays} goal days`}
              value={cushionPct}
              tone={colors.good}
            />
          </View>
        </View>
      </Card>

      <Card tone="tint">
        <View style={ui.row}>
          <View style={styles.iconTile}>
            <ChartNoAxesCombined
              accessible={false}
              color={colorString(colors.accent)}
              size={22}
            />
          </View>
          <View style={styles.grow}>
            <SectionHeader eyebrow="Plan ahead" title="See the next 30 days" />
          </View>
        </View>
        <Text style={ui.body}>
          Check your runway, true take-home earnings and common slow-week
          situations on one page.
        </Text>
        <Button
          title="Open insights"
          tone="quiet"
          inline
          iconRight={ArrowRight}
          onPress={() => router.push("/insights")}
        />
      </Card>

      <Card padded={false}>
        <View style={styles.listHeader}>
          <SectionHeader eyebrow="Coming up" title="Your next money events" />
        </View>
        <View style={styles.listBody}>
          {nextEvents.length ? (
            nextEvents.map((event, index) => {
              const income = event.type === "INCOME";
              const status = income
                ? event.status === "OVERDUE"
                  ? "overdue"
                  : "expected"
                : "due";
              return (
                <ListRow
                  key={event.id}
                  icon={income ? WalletCards : CalendarClock}
                  iconTone={income ? "accent" : "warn"}
                  title={event.title}
                  subtitle={`${formatDate(event.date, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })} · ${status}`}
                  value={formatMoneyRange(event.amountMin, event.amountMax)}
                  last={index === nextEvents.length - 1}
                />
              );
            })
          ) : (
            <EmptyState
              icon={CalendarClock}
              title="Nothing scheduled yet"
              body="Add a payout date or bill to see what comes next."
            />
          )}
        </View>
      </Card>

      <Text style={[ui.caption, styles.footer]}>
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
    <View
      accessible
      accessibilityLabel={`${label}: ${formatMoney(value)}`}
      style={styles.moneyLine}
    >
      <Text style={[styles.moneyLineLabel, strong && styles.moneyLineStrong]}>
        {label}
      </Text>
      <Text
        style={[styles.moneyLineValue, ui.num, strong && styles.moneyLineStrong]}
      >
        {formatMoney(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  focusPill: {
    alignSelf: "flex-start",
    minHeight: 32,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
  },
  focusText: {
    color: colors.accent,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  heroCopy: { gap: 6 },
  moneyLine: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  moneyLineLabel: {
    flex: 1,
    color: colors.onPrimarySoft,
    fontSize: 14,
    lineHeight: 20,
  },
  moneyLineValue: {
    color: colors.onPrimarySoft,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "right",
  },
  moneyLineStrong: { color: colors.onPrimary, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 10 },
  actionButton: { flex: 1, alignSelf: "auto" },
  stats: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  stat: { flex: 1, minWidth: 0 },
  statStack: { gap: 8 },
  grow: { flex: 1, minWidth: 0 },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  listHeader: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 4 },
  listBody: { paddingHorizontal: 18, paddingBottom: 8 },
  footer: { textAlign: "center", paddingHorizontal: 8, paddingBottom: 4 },
});
