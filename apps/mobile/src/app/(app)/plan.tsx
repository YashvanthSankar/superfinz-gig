import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  simulateGigScenario,
  type CommitmentRecurrence,
  type GigScenarioInput,
} from "@superfinz/shared";
import { apiFetch } from "@/lib/api";
import {
  Button,
  Card,
  Empty,
  ErrorState,
  Field,
  Label,
  Loading,
  Screen,
  ui,
} from "@/components/ui";
import { DateField } from "@/components/date-field";
import { colors } from "@/constants/theme";
import {
  refreshGigDashboard,
  useGigDashboard,
} from "@/hooks/use-gig-dashboard";

type Scenario =
  "BASELINE" | "LOWER_INCOME" | "PAYOUT_DELAY" | "REPAIR" | "TIME_OFF";
const scenarios: Array<{
  value: Scenario;
  label: string;
  input: GigScenarioInput;
}> = [
  {
    value: "BASELINE",
    label: "Current plan",
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
    label: "Income drops 20%",
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
    label: "Payout is 2 days late",
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
    label: "₹2,500 work repair",
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
    label: "Take 2 days off",
    input: {
      incomeChangePct: 0,
      payoutDelayDays: 0,
      surpriseCost: 0,
      workDaysOff: 2,
      workCostChangePct: 0,
    },
  },
];
const money = (value: number) =>
  `₹${Math.round(value).toLocaleString("en-IN")}`;
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

export default function Plan() {
  const client = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(
    () => new Date(Date.now() + 7 * 86_400_000),
  );
  const [essential, setEssential] = useState(true);
  const [recurrence, setRecurrence] = useState<CommitmentRecurrence>("MONTHLY");
  const [scenario, setScenario] = useState<Scenario>("BASELINE");
  const query = useGigDashboard();
  const refresh = () => refreshGigDashboard(client);
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
      setTitle("");
      setAmount("");
      setShowForm(false);
      await refresh();
    },
    onError: (cause) =>
      Alert.alert(
        "Couldn’t save bill",
        cause instanceof Error ? cause.message : "Try again",
      ),
  });
  const markPaid = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ commitment: { dueDate: string; status: string } }>(
        "/api/gig/commitments",
        {
          method: "PATCH",
          body: JSON.stringify({ id, status: "PAID" }),
        },
      ),
    onSuccess: async (result: {
      commitment: { dueDate: string; status: string };
    }) => {
      await refresh();
      Alert.alert(
        "Bill recorded as paid",
        result.commitment.status === "DUE"
          ? `Your plan balance was reduced. No payment was sent. Next due ${new Date(result.commitment.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}.`
          : "Your plan balance was reduced. No payment was sent.",
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
  const s = dashboard.summary;
  const scenarioInput =
    scenarios.find((item) => item.value === scenario)?.input ??
    scenarios[0].input;
  const result = simulateGigScenario(dashboard, scenarioInput);
  const hasGap = result.earningTarget > 0;

  return (
    <Screen
      title="Plan"
      subtitle="Keep important bills visible and protected."
      help={{
        title: "Your bill plan",
        body: "Add payments you cannot miss. When you mark a repeating bill as paid, SuperFinz creates its next due date automatically.",
      }}
    >
      <Button
        title={showForm ? "Close bill form" : "Add a bill"}
        tone={showForm ? "quiet" : "accent"}
        onPress={() => setShowForm((value) => !value)}
      />
      {showForm && (
        <Card>
          <Field
            label="Bill name"
            value={title}
            onChangeText={setTitle}
            placeholder="Mobile bill"
          />
          <Field
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="₹ 500"
          />
          <DateField
            label="Due date"
            value={dueDate}
            onChange={(value) => value && setDueDate(value)}
          />
          <Label>How often?</Label>
          <View style={styles.choices}>
            {recurrenceOptions.map((option) => (
              <Choice
                key={option.value}
                label={option.label}
                selected={recurrence === option.value}
                onPress={() => setRecurrence(option.value)}
              />
            ))}
          </View>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: essential }}
            accessibilityLabel="Protect this bill first"
            onPress={() => setEssential((value) => !value)}
            style={({ pressed }) => [
              styles.check,
              essential && styles.checkActive,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[styles.checkText, essential && styles.checkTextActive]}
            >
              {essential ? "✓ " : ""}Protect this bill first
            </Text>
          </Pressable>
          <Button
            title="Save bill"
            loading={create.isPending}
            disabled={!title.trim() || Number(amount) <= 0}
            onPress={() => create.mutate()}
          />
        </Card>
      )}

      <Card>
        <Label>Your bills</Label>
        {!dashboard.commitments.length ? (
          <Empty
            title="No bills added"
            body="Add rent, phone, loan payment, or family support so SuperFinz can protect it."
          />
        ) : (
          dashboard.commitments.map((item) => (
            <View key={item.id} style={styles.bill}>
              <View style={styles.billText}>
                <Text style={styles.billName}>{item.title}</Text>
                <Text style={ui.small}>
                  Due{" "}
                  {new Date(item.dueDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                  {` · ${recurrenceLabels[item.recurrence]}`}
                  {item.essential ? " · important" : " · flexible"}
                </Text>
                <Text style={styles.billAmount}>{money(item.amount)}</Text>
              </View>
              {item.status !== "PAID" && (
                <View style={styles.billActions}>
                  <Button
                    title="Mark paid"
                    tone="quiet"
                    loading={markPaid.isPending}
                    onPress={() =>
                      Alert.alert(
                        "Mark this bill as paid?",
                        `Your plan balance will reduce by ${money(item.amount)}. No payment is sent.`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Mark paid",
                            onPress: () => markPaid.mutate(item.id),
                          },
                        ],
                      )
                    }
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${item.title}`}
                    hitSlop={10}
                    onPress={() =>
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
                      )
                    }
                    style={styles.delete}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))
        )}
      </Card>

      <Button
        title={showWhatIf ? "Hide what-if check" : "What if income changes?"}
        tone="quiet"
        onPress={() => setShowWhatIf((value) => !value)}
      />

      {showWhatIf && (
        <>
          <Card>
            <Label>Try one change</Label>
            <View style={styles.choices}>
              {scenarios.map((item) => (
                <Choice
                  key={item.value}
                  label={item.label}
                  selected={scenario === item.value}
                  onPress={() => setScenario(item.value)}
                />
              ))}
            </View>
            <View
              accessibilityLiveRegion="polite"
              style={[
                styles.result,
                hasGap ? styles.resultWarning : styles.resultGood,
              ]}
            >
              <Label>
                {scenario === "BASELINE" ? "Today’s plan" : "After this change"}
              </Label>
              <Text style={styles.safeValue}>{money(result.safeToSpend)}</Text>
              <Text style={styles.safeLabel}>safe to use</Text>
              <Text style={ui.body}>
                Emergency cover: {Math.floor(result.protectedDays)}{" "}
                {Math.floor(result.protectedDays) === 1 ? "day" : "days"}
              </Text>
              <Text style={ui.body}>
                {result.atRiskCommitments.length
                  ? `${result.atRiskCommitments.length} important bill${result.atRiskCommitments.length === 1 ? "" : "s"} may be at risk.`
                  : "No important bills are at risk."}
              </Text>
              <Text style={ui.body}>{result.recommendedAction}</Text>
              {hasGap && (
                <Text style={styles.target}>
                  Try to earn {money(result.targetPerRemainingWorkday)} net per
                  remaining workday.
                </Text>
              )}
            </View>
          </Card>

          {hasGap && (
            <Card style={styles.options}>
              <Label>Try these before borrowing</Label>
              {result.nonCreditAlternatives.map((item, index) => (
                <View key={item} style={styles.optionRow}>
                  <Text style={styles.optionNumber}>{index + 1}</Text>
                  <Text style={styles.optionText}>{item}</Text>
                </View>
              ))}
            </Card>
          )}

          <Card>
            <View style={ui.between}>
              <View>
                <Label>Next 30 days</Label>
                <Text style={ui.h2}>
                  {money(result.forecastIncomeLow30d)}–
                  {money(result.forecastIncomeHigh30d)}
                </Text>
              </View>
              <Text style={styles.estimate}>estimate</Text>
            </View>
            <View style={styles.metrics}>
              <Metric label="Bills" value={money(s.committedOutflow30d)} />
              <Metric
                label="Work costs"
                value={money(s.estimatedWorkCosts30d)}
              />
            </View>
            <Text style={ui.small}>
              Expected money is not counted as money you already have.
            </Text>
          </Card>
        </>
      )}
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Label>{label}</Label>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        selected && styles.choiceActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.paper,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceActive: {
    borderColor: colors.action,
    backgroundColor: colors.accentSoft,
  },
  choiceText: { color: colors.ink, fontWeight: "600", fontSize: 13 },
  choiceTextActive: { color: colors.ink },
  pressed: { opacity: 0.7 },
  result: { borderRadius: 15, padding: 15, gap: 6 },
  resultGood: { backgroundColor: colors.greenSoft },
  resultWarning: { backgroundColor: colors.accentSoft },
  safeValue: {
    color: colors.ink,
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "700",
    letterSpacing: -1.3,
    fontVariant: ["tabular-nums"],
  },
  safeLabel: { color: colors.inkSoft, fontSize: 14, fontWeight: "600" },
  target: {
    color: colors.accent,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  options: { backgroundColor: colors.accentSoft },
  optionRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  optionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.action,
    color: colors.white,
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "700",
  },
  optionText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 21 },
  estimate: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  metrics: { flexDirection: "row", gap: 12 },
  metric: { flex: 1, gap: 3 },
  metricValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  check: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  checkActive: { borderColor: colors.action, backgroundColor: colors.action },
  checkText: { color: colors.ink, fontWeight: "600", fontSize: 14 },
  checkTextActive: { color: colors.white },
  bill: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
  },
  billText: { flex: 1 },
  billName: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  billAmount: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3,
    fontVariant: ["tabular-nums"],
  },
  billActions: { width: 82, gap: 5 },
  delete: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  deleteText: { color: colors.red, fontSize: 13, fontWeight: "700" },
});
