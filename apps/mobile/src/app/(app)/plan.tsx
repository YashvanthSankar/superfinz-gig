import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Check, Plus, Trash2 } from "lucide-react-native";
import {
  simulateGigScenario,
  type CommitmentDto,
  type CommitmentRecurrence,
  type GigScenarioInput,
} from "@superfinz/shared";
import { apiFetch } from "@/lib/api";
import {
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  ErrorState,
  Expandable,
  Field,
  FormSheet,
  IconButton,
  Label,
  ListRow,
  Loading,
  Notice,
  Screen,
  SectionHeader,
  Stat,
  formatDate,
  formatMoney,
  formatMoneyRange,
  ui,
  type BadgeTone,
} from "@/components/ui";
import { DateField } from "@/components/date-field";
import { colors, space } from "@/constants/theme";
import {
  refreshGigDashboard,
  useGigDashboard,
} from "@/hooks/use-gig-dashboard";

/* ------------------------------------------------------------------ */
/* Scenario presets                                                    */
/* ------------------------------------------------------------------ */

type Scenario =
  "BASELINE" | "LOWER_INCOME" | "PAYOUT_DELAY" | "REPAIR" | "TIME_OFF";

const scenarios: Array<{
  value: Scenario;
  label: string;
  input: GigScenarioInput;
}> = [
  {
    value: "BASELINE",
    label: "Baseline",
    input: {
      incomeChangePct: 0,
      payoutDelayDays: 0,
      surpriseCost: 0,
      workDaysOff: 0,
      workCostChangePct: 0,
    },
  },
  {
    value: "LOWER_INCOME",
    label: "Income −20%",
    input: {
      incomeChangePct: -20,
      payoutDelayDays: 0,
      surpriseCost: 0,
      workDaysOff: 0,
      workCostChangePct: 0,
    },
  },
  {
    value: "PAYOUT_DELAY",
    label: "Payout +2 days",
    input: {
      incomeChangePct: 0,
      payoutDelayDays: 2,
      surpriseCost: 0,
      workDaysOff: 0,
      workCostChangePct: 0,
    },
  },
  {
    value: "REPAIR",
    label: `${formatMoney(2_500)} repair`,
    input: {
      incomeChangePct: 0,
      payoutDelayDays: 0,
      surpriseCost: 2_500,
      workDaysOff: 0,
      workCostChangePct: 0,
    },
  },
  {
    value: "TIME_OFF",
    label: "2 days off",
    input: {
      incomeChangePct: 0,
      payoutDelayDays: 0,
      surpriseCost: 0,
      workDaysOff: 2,
      workCostChangePct: 0,
    },
  },
];

/* ------------------------------------------------------------------ */
/* Label maps                                                          */
/* ------------------------------------------------------------------ */

const recurrenceOptions: Array<{
  value: CommitmentRecurrence;
  label: string;
}> = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Every 3 months" },
  { value: "YEARLY", label: "Yearly" },
  { value: "ONE_TIME", label: "One time" },
];

const recurrenceLabels: Record<CommitmentRecurrence, string> = {
  WEEKLY: "weekly",
  FORTNIGHTLY: "every 2 weeks",
  MONTHLY: "monthly",
  QUARTERLY: "every 3 months",
  YEARLY: "yearly",
  ONE_TIME: "one time",
};

type Priority = "ESSENTIAL" | "FLEXIBLE";

const priorityOptions: Array<{ value: Priority; label: string }> = [
  { value: "ESSENTIAL", label: "Essential bill" },
  { value: "FLEXIBLE", label: "Optional bill" },
];

const priorityLabels: Record<Priority, string> = {
  ESSENTIAL: "essential",
  FLEXIBLE: "optional",
};

type BillStatus = "PAID" | "OVERDUE" | "SOON" | "DUE";

const statusLabels: Record<BillStatus, string> = {
  PAID: "Paid",
  OVERDUE: "Overdue",
  SOON: "Due soon",
  DUE: "Due",
};

const statusBadgeTones: Record<BillStatus, BadgeTone> = {
  PAID: "good",
  OVERDUE: "bad",
  SOON: "warn",
  DUE: "neutral",
};

const statusIconTones: Record<BillStatus, "good" | "bad" | "warn" | "accent"> =
  {
    PAID: "good",
    OVERDUE: "bad",
    SOON: "warn",
    DUE: "accent",
  };

const DAY_MS = 86_400_000;

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function billStatus(item: CommitmentDto, today: Date): BillStatus {
  if (item.status === "PAID") return "PAID";
  const daysUntil = Math.ceil(
    (new Date(item.dueDate).getTime() - today.getTime()) / DAY_MS,
  );
  if (daysUntil < 0) return "OVERDUE";
  if (daysUntil <= 7) return "SOON";
  return "DUE";
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

type FormErrors = { title?: string; amount?: string };

export default function Plan() {
  const client = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(
    () => new Date(Date.now() + 7 * DAY_MS),
  );
  const [priority, setPriority] = useState<Priority>("ESSENTIAL");
  const [recurrence, setRecurrence] = useState<CommitmentRecurrence>("MONTHLY");
  const [errors, setErrors] = useState<FormErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario>("BASELINE");
  const query = useGigDashboard();
  const refresh = () => refreshGigDashboard(client);
  const essential = priority === "ESSENTIAL";

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6_000);
    return () => clearTimeout(timer);
  }, [notice]);

  const closeForm = () => {
    setShowForm(false);
    setErrors({});
  };

  const create = useMutation({
    mutationFn: () =>
      apiFetch("/api/gig/commitments", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          category: title.trim(),
          amount: Number(amount),
          dueDate: dueDate.toISOString(),
          recurrence,
          essential,
          priority: essential ? 1 : 3,
          autopay: false,
        }),
      }),
    onSuccess: async () => {
      const savedTitle = title.trim();
      setTitle("");
      setAmount("");
      closeForm();
      setNotice(
        essential
          ? `${savedTitle} is now protected in your plan.`
          : `${savedTitle} was added as optional. It will not reduce Safe to Spend.`,
      );
      await refresh();
    },
    onError: (cause) =>
      Alert.alert(
        "Couldn’t save bill",
        cause instanceof Error ? cause.message : "Try again",
      ),
  });

  const markPaid = useMutation({
    mutationFn: (item: { id: string; title: string }) =>
      apiFetch<{ commitment: { dueDate: string; status: string } }>(
        "/api/gig/commitments",
        {
          method: "PATCH",
          body: JSON.stringify({ id: item.id, status: "PAID" }),
        },
      ),
    onSuccess: async (
      result: { commitment: { dueDate: string; status: string } },
      item,
    ) => {
      await refresh();
      setNotice(
        result.commitment.status === "DUE"
          ? `${item.title} recorded as paid. Next due ${formatDate(result.commitment.dueDate)}. No payment was sent.`
          : `${item.title} recorded as paid. No payment was sent.`,
      );
    },
    onError: (cause) =>
      Alert.alert(
        "Couldn’t update bill",
        cause instanceof Error ? cause.message : "Try again",
      ),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch("/api/gig/commitments", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      }),
    onSuccess: refresh,
    onError: (cause) =>
      Alert.alert(
        "Couldn’t delete bill",
        cause instanceof Error ? cause.message : "Try again",
      ),
  });

  const submit = () => {
    const next: FormErrors = {};
    if (!title.trim()) next.title = "Give this bill a name.";
    const value = Number(amount);
    if (!amount.trim() || !Number.isFinite(value) || value <= 0)
      next.amount = "Enter an amount above zero.";
    setErrors(next);
    if (next.title || next.amount) return;
    create.mutate();
  };

  const confirmMarkPaid = (item: CommitmentDto) =>
    Alert.alert(
      "Mark this bill as paid?",
      `Your plan balance will reduce by ${formatMoney(item.amount)}. No payment is sent.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark paid",
          onPress: () => markPaid.mutate({ id: item.id, title: item.title }),
        },
      ],
    );

  const confirmDelete = (item: CommitmentDto) =>
    Alert.alert(
      "Delete this bill?",
      "It will no longer be protected in your plan.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => remove.mutate(item.id),
        },
      ],
    );

  if (query.isLoading) return <Loading label="Building your plan…" />;
  if (query.isError || !query.data)
    return (
      <ErrorState
        title="Couldn’t load your plan"
        body={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => query.refetch()}
      />
    );

  const dashboard = query.data.dashboard;
  const summary = dashboard.summary;
  const commitments = dashboard.commitments;
  const today = startOfToday();
  const unpaid = commitments.filter((item) => item.status !== "PAID");
  const unpaidTotal = unpaid.reduce((sum, item) => sum + item.amount, 0);
  const nextDue = [...unpaid].sort(
    (a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate),
  )[0];

  const scenarioInput =
    scenarios.find((item) => item.value === scenario)?.input ??
    scenarios[0].input;
  const result = simulateGigScenario(dashboard, scenarioInput);
  const hasGap = result.earningTarget > 0;
  const protectedDays = Math.floor(result.protectedDays);
  const busy = markPaid.isPending || remove.isPending;

  return (
    <Screen
      eyebrow="Bills and commitments"
      title="Plan"
      subtitle="Protect essentials and keep optional subscriptions visible."
      refreshing={query.isFetching && Boolean(query.data)}
      help={{
        title: "Your bill plan",
        body: "Essential bills reduce Safe to Spend. Optional bills and subscriptions stay visible but are not protected. Repeating bills move to their next due date after you mark them paid.",
      }}
      action={
        <IconButton
          icon={Plus}
          label="Add a bill"
          hint="Opens a short form in a sheet"
          onPress={() => setShowForm(true)}
        />
      }
    >
      {notice && (
        <Notice tone="good" live>
          {notice}
        </Notice>
      )}

      <FormSheet
        visible={showForm}
        onClose={closeForm}
        eyebrow="New bill"
        title="Add a bill"
        description="Add essentials like rent or school fees, or optional items like OTT subscriptions."
        busy={create.isPending}
      >
        <Field
          label="Bill name"
          required
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            if (errors.title)
              setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          placeholder="Mobile bill"
          autoCapitalize="sentences"
          returnKeyType="next"
          error={errors.title}
        />
        <Field
          label="Amount"
          required
          prefix="₹"
          value={amount}
          onChangeText={(value) => {
            setAmount(value);
            if (errors.amount)
              setErrors((prev) => ({ ...prev, amount: undefined }));
          }}
          keyboardType="decimal-pad"
          placeholder="500"
          error={errors.amount}
        />
        <DateField
          label="Due date"
          value={dueDate}
          onChange={(value) => value && setDueDate(value)}
        />
        <View style={styles.group}>
          <Label>How often</Label>
          <View style={ui.wrap}>
            {recurrenceOptions.map((option) => (
              <Chip
                key={option.value}
                role="radio"
                label={option.label}
                selected={recurrence === option.value}
                onPress={() => setRecurrence(option.value)}
              />
            ))}
          </View>
        </View>
        <View style={styles.group}>
          <Label>Bill type</Label>
          <View style={ui.wrap}>
            {priorityOptions.map((option) => (
              <Chip
                key={option.value}
                role="radio"
                label={option.label}
                selected={priority === option.value}
                onPress={() => setPriority(option.value)}
              />
            ))}
          </View>
          <Text style={ui.caption}>
            Essential bills are protected first. Optional bills do not reduce Safe to Spend.
          </Text>
        </View>
        <View style={styles.formActions}>
          <Button
            title="Cancel"
            tone="ghost"
            inline
            disabled={create.isPending}
            onPress={closeForm}
          />
          <Button
            title="Save bill"
            tone="accent"
            icon={Check}
            loading={create.isPending}
            onPress={submit}
            style={styles.submit}
          />
        </View>
      </FormSheet>

      {commitments.length > 0 && (
        <Card>
          <View style={styles.summaryRow}>
            <Stat
              label="Still to pay"
              value={formatMoney(unpaidTotal)}
              help={plural(unpaid.length, "bill unpaid", "bills unpaid")}
              style={styles.summaryStat}
            />
            <Stat
              label="Next due"
              value={nextDue ? formatDate(nextDue.dueDate) : "Nothing due"}
              help={nextDue ? nextDue.title : "Every bill is paid"}
              style={styles.summaryStat}
            />
          </View>
        </Card>
      )}

      {commitments.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No bills yet"
          body="Add essentials like rent and electricity, or optional subscriptions like OTT."
          action={{ title: "Add a bill", onPress: () => setShowForm(true) }}
        />
      ) : (
        <Card padded={false}>
          <View style={styles.listHeader}>
            <SectionHeader
              eyebrow="Payment calendar"
              title="Upcoming bills"
              action={
                <Badge label={plural(commitments.length, "bill", "bills")} />
              }
            />
          </View>
          <View style={styles.list}>
            {commitments.map((item, index) => {
              const status = billStatus(item, today);
              const isMarking =
                markPaid.isPending && markPaid.variables?.id === item.id;
              return (
                <ListRow
                  key={item.id}
                  icon={CalendarClock}
                  iconTone={statusIconTones[status]}
                  title={item.title}
                  subtitle={`Due ${formatDate(item.dueDate)} · ${recurrenceLabels[item.recurrence]} · ${priorityLabels[item.essential ? "ESSENTIAL" : "FLEXIBLE"]}`}
                  value={formatMoney(item.amount)}
                  badge={
                    <Badge
                      label={statusLabels[status]}
                      tone={statusBadgeTones[status]}
                    />
                  }
                  last={index === commitments.length - 1}
                >
                  <View style={styles.rowActions}>
                    {item.status !== "PAID" && (
                      <Button
                        title="Mark paid"
                        size="sm"
                        tone="quiet"
                        icon={Check}
                        inline
                        loading={isMarking}
                        disabled={busy && !isMarking}
                        onPress={() => confirmMarkPaid(item)}
                      />
                    )}
                    <IconButton
                      icon={Trash2}
                      tone="danger"
                      label={`Delete ${item.title}`}
                      hint="Asks you to confirm first"
                      disabled={busy}
                      onPress={() => confirmDelete(item)}
                    />
                  </View>
                </ListRow>
              );
            })}
          </View>
        </Card>
      )}

      <Card>
        <Expandable
          title="What if income changes?"
          summary="Test a slow week or a late payout"
        >
          <Label>Try one change</Label>
          <View style={ui.wrap}>
            {scenarios.map((item) => (
              <Chip
                key={item.value}
                role="radio"
                label={item.label}
                selected={scenario === item.value}
                onPress={() => setScenario(item.value)}
              />
            ))}
          </View>

          <Card
            tone="navy"
            accessibilityLiveRegion="polite"
            style={styles.flat}
          >
            <Label tone="onPrimary">
              {scenario === "BASELINE" ? "Today’s plan" : "After this change"}
            </Label>
            <View style={styles.tiles}>
              <Stat
                onPrimary
                label="Safe to spend"
                value={formatMoney(result.safeToSpend)}
                style={styles.tile}
              />
              <Stat
                onPrimary
                label="Lowest balance"
                value={formatMoney(result.lowestProjectedBalance)}
                style={styles.tile}
              />
              <Stat
                onPrimary
                label="Protected days"
                value={plural(protectedDays, "day", "days")}
                style={styles.tile}
              />
            </View>
            <Text style={styles.recommendation}>
              {result.recommendedAction}
            </Text>
            {hasGap && (
              <Text style={[ui.small, ui.onPrimarySoft]}>
                Try to earn {formatMoney(result.targetPerRemainingWorkday)} net
                per remaining workday.
              </Text>
            )}
          </Card>

          {result.atRiskCommitments.length ? (
            <Notice
              tone="warn"
              title={`${plural(result.atRiskCommitments.length, "important bill", "important bills")} may be at risk`}
            >
              <View style={styles.noticeList}>
                {result.atRiskCommitments.map((item) => (
                  <Text key={item.id} style={styles.noticeLine}>
                    {item.title} · {formatMoney(item.amount)} · due{" "}
                    {formatDate(item.dueDate)}
                  </Text>
                ))}
              </View>
            </Notice>
          ) : (
            <Notice tone="good">No important bills are at risk.</Notice>
          )}

          {hasGap && result.nonCreditAlternatives.length > 0 && (
            <Notice tone="info" title="Try these before borrowing">
              <View style={styles.noticeList}>
                {result.nonCreditAlternatives.map((item, index) => (
                  <Text key={item} style={styles.noticeLine}>
                    {index + 1}. {item}
                  </Text>
                ))}
              </View>
            </Notice>
          )}

          <Divider />
          <Label>Next 30 days · estimate</Label>
          <Text style={[ui.h3, ui.num]}>
            {formatMoneyRange(
              result.forecastIncomeLow30d,
              result.forecastIncomeHigh30d,
            )}
          </Text>
          <View style={styles.summaryRow}>
            <Stat
              label="Bills"
              value={formatMoney(summary.committedOutflow30d)}
              style={styles.summaryStat}
            />
            <Stat
              label="Work costs"
              value={formatMoney(summary.estimatedWorkCosts30d)}
              style={styles.summaryStat}
            />
          </View>
          <Text style={ui.caption}>
            Expected money is not counted as money you already have.
          </Text>
        </Expandable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  formActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: space.sm,
    marginTop: space.xs,
  },
  submit: { flex: 1 },
  summaryRow: { flexDirection: "row", gap: space.md },
  summaryStat: { flex: 1 },
  listHeader: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: space.sm,
  },
  list: { paddingHorizontal: 18, paddingBottom: space.sm },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginTop: space.sm,
  },
  flat: { shadowOpacity: 0, elevation: 0 },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  tile: { flex: 1, minWidth: 120 },
  recommendation: {
    color: colors.accentOnPrimary,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  noticeList: { gap: space.xs },
  noticeLine: { color: colors.ink, fontSize: 14, lineHeight: 20 },
});
