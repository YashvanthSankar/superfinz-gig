import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  projectPayoutSplit,
  recommendAdaptiveSplit,
  type SplitPercentages,
} from "@superfinz/shared";
import { apiFetch } from "@/lib/api";
import {
  Button,
  Card,
  ErrorState,
  Field,
  Label,
  Loading,
  Money,
  Screen,
  ui,
} from "@/components/ui";
import { DateField } from "@/components/date-field";
import { colors } from "@/constants/theme";
import {
  refreshGigDashboard,
  useGigDashboard,
} from "@/hooks/use-gig-dashboard";

const fields: Array<
  [
    keyof SplitPercentages,
    string,
    "essentials" | "workCosts" | "emergency" | "longTerm" | "flexible",
  ]
> = [
  ["essentialsPct", "Bills", "essentials"],
  ["workCostsPct", "Work costs", "workCosts"],
  ["emergencyPct", "Cushion", "emergency"],
  ["longTermPct", "Savings", "longTerm"],
  ["flexiblePct", "Free to use", "flexible"],
];
const money = (value: number) =>
  `₹${Math.round(value).toLocaleString("en-IN")}`;

export default function PayoutSplit() {
  const client = useQueryClient();
  const query = useGigDashboard();
  const [amount, setAmount] = useState("");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [receivedAt, setReceivedAt] = useState(new Date());
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"ADAPTIVE" | "CUSTOM">("ADAPTIVE");
  const [percentages, setPercentages] = useState<Record<
    keyof SplitPercentages,
    string
  > | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const d = query.data?.dashboard;
  const activeSources =
    d?.sources.filter((source) => source.status === "ACTIVE") ?? [];
  const selectedSource =
    activeSources.find((source) => source.id === sourceId) ?? activeSources[0];
  const manualIncome =
    sourceId === "MANUAL_INCOME" || activeSources.length === 0;
  const payout = Number(amount) || 0;
  const defaultValues = d
    ? {
        essentialsPct: String(d.splitRule.essentialsPct),
        workCostsPct: String(d.splitRule.workCostsPct),
        emergencyPct: String(d.splitRule.emergencyPct),
        longTermPct: String(d.splitRule.longTermPct),
        flexiblePct: String(d.splitRule.flexiblePct),
      }
    : {
        essentialsPct: "55",
        workCostsPct: "15",
        emergencyPct: "10",
        longTermPct: "5",
        flexiblePct: "15",
      };
  const values = percentages ?? defaultValues;
  const custom: SplitPercentages = {
    essentialsPct: Number(values.essentialsPct),
    workCostsPct: Number(values.workCostsPct),
    emergencyPct: Number(values.emergencyPct),
    longTermPct: Number(values.longTermPct),
    flexiblePct: Number(values.flexiblePct),
  };
  const customTotal = Object.values(custom).reduce(
    (sum, value) => sum + (value || 0),
    0,
  );
  const adaptive = d ? recommendAdaptiveSplit(d, payout, receivedAt) : null;
  const customProjection = d
    ? projectPayoutSplit(d, payout, custom, receivedAt)
    : null;
  const used =
    mode === "ADAPTIVE"
      ? adaptive
      : customProjection
        ? {
            ...customProjection,
            percentages: custom,
            reasons: ["You chose these percentages."],
            fundedCommitments: [],
          }
        : null;
  const totalPct = mode === "ADAPTIVE" ? 100 : customTotal;
  const mutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/gig/split", {
        method: "POST",
        body: JSON.stringify({
          sourceId: manualIncome ? null : (selectedSource?.id ?? null),
          sourceName: manualIncome
            ? "Other or cash income"
            : (selectedSource?.name ?? "Manual income"),
          amount: payout,
          receivedAt: receivedAt.toISOString(),
          note: note.trim() || null,
          allocationMode: mode,
          percentages: mode === "ADAPTIVE" ? adaptive?.percentages : custom,
        }),
      }),
    onSuccess: async () => {
      await refreshGigDashboard(client);
      Alert.alert(
        "Payout saved",
        "Your balance and five planning pockets were updated together. No bank transfer occurred.",
        [{ text: "Done", onPress: () => router.back() }],
      );
    },
    onError: (cause) =>
      Alert.alert(
        "Couldn’t save payout",
        cause instanceof Error ? cause.message : "Try again",
      ),
  });
  if (query.isLoading) return <Loading label="Preparing your payout plan…" />;
  if (query.isError || !d)
    return (
      <ErrorState
        title="Couldn’t open payout plan"
        body={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => query.refetch()}
      />
    );
  return (
    <Screen
      title="Plan a payout"
      subtitle="Enter money only after it reaches you."
      back
      help={{
        title: "Plan a payout",
        body: "SuperFinz suggests how much to keep for bills, work, savings, and safe spending. Review it before saving. No real money is moved.",
      }}
    >
      <Card>
        <Label>Where did it come from?</Label>
        <View style={styles.wrap}>
          {activeSources.map((source) => (
            <Choice
              key={source.id}
              label={source.name}
              selected={selectedSource?.id === source.id}
              onPress={() => setSourceId(source.id)}
            />
          ))}
          <Choice
            label="Other or cash income"
            selected={manualIncome}
            onPress={() => setSourceId("MANUAL_INCOME")}
          />
        </View>
        {!activeSources.length && (
          <Text style={ui.small}>
            No active source is connected. You can still record cash or client
            income here.
          </Text>
        )}
        <Field
          label="Money received"
          value={amount}
          onChangeText={(value) => {
            setAmount(value);
            setConfirmed(false);
          }}
          keyboardType="decimal-pad"
          placeholder="₹ 3,200"
        />
        <DateField
          label="Date received"
          value={receivedAt}
          onChange={(value) => value && setReceivedAt(value)}
          maximumDate={new Date()}
        />
        <Field label="Note (optional)" value={note} onChangeText={setNote} />
      </Card>
      {payout > 0 ? (
        <>
          <Card>
            <Label>How should we protect it?</Label>
            <View style={styles.modes}>
              <View style={{ flex: 1 }}>
                <Choice
                  label="Recommended"
                  selected={mode === "ADAPTIVE"}
                  onPress={() => {
                    setMode("ADAPTIVE");
                    setConfirmed(false);
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Choice
                  label="Choose myself"
                  selected={mode === "CUSTOM"}
                  onPress={() => {
                    setMode("CUSTOM");
                    setConfirmed(false);
                  }}
                />
              </View>
            </View>
            {mode === "ADAPTIVE" && (
              <Text style={ui.small}>
                Uses your next bills, work costs, and safety goal.
              </Text>
            )}
            {mode === "CUSTOM" && (
              <>
                {fields.map(([key, label]) => (
                  <Field
                    key={key}
                    label={`${label} (%)`}
                    value={values[key]}
                    onChangeText={(value) =>
                      setPercentages((current) => ({
                        ...(current ?? values),
                        [key]: value,
                      }))
                    }
                    keyboardType="decimal-pad"
                  />
                ))}
                <Text
                  style={[
                    styles.total,
                    customTotal !== 100 && { color: colors.red },
                  ]}
                >
                  Total {customTotal}%
                </Text>
                {customTotal !== 100 && (
                  <Text accessibilityRole="alert" style={styles.error}>
                    Make the total exactly 100%.
                  </Text>
                )}
                <Button
                  title="Reset"
                  tone="quiet"
                  onPress={() => setPercentages(null)}
                />
              </>
            )}
          </Card>

          {used && totalPct === 100 && (
            <Card style={{ backgroundColor: colors.greenSoft }}>
              <View style={ui.between}>
                <Label>Review before saving</Label>
                <Text style={styles.total}>{money(payout)}</Text>
              </View>
              {fields.map(([key, label, amountKey]) => (
                <View key={key} style={styles.row}>
                  <Text style={styles.rowLabel}>
                    {label} · {used.percentages[key].toFixed(1)}%
                  </Text>
                  <Text style={styles.rowAmount}>
                    {money(used.amounts[amountKey])}
                  </Text>
                </View>
              ))}
              <View style={styles.beforeAfter}>
                <View>
                  <Label>Safe now</Label>
                  <Money value={used.beforeSafeAmount} />
                </View>
                <Text style={styles.arrow}>→</Text>
                <View>
                  <Label>Safe after</Label>
                  <Money value={used.afterSafeAmount} />
                </View>
              </View>
              <Text style={ui.body}>{used.reasons.join(" ")}</Text>
            </Card>
          )}

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: confirmed }}
            accessibilityLabel="Confirm planned allocation"
            onPress={() => setConfirmed((value) => !value)}
            style={({ pressed }) => [
              styles.confirm,
              confirmed && styles.confirmed,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[styles.confirmText, confirmed && { color: colors.white }]}
            >
              {confirmed ? "✓ " : ""}I reviewed this payout plan
            </Text>
          </Pressable>
          <Text style={ui.small}>
            SuperFinz records a plan. It never moves real money.
          </Text>
          <Button
            title="Save payout plan"
            loading={mutation.isPending}
            disabled={
              totalPct !== 100 ||
              !confirmed ||
              (!manualIncome && !selectedSource)
            }
            onPress={() => mutation.mutate()}
          />
        </>
      ) : (
        <Text style={styles.hint}>
          Enter the money you received to see a simple payout plan.
        </Text>
      )}
    </Screen>
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
      <Text style={styles.choiceText}>
        {selected ? "✓ " : ""}
        {label}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modes: { flexDirection: "row", gap: 8 },
  choice: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceActive: {
    borderColor: colors.action,
    backgroundColor: colors.accentSoft,
  },
  choiceText: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.65 },
  total: {
    color: colors.green,
    fontSize: 18,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  error: { color: colors.red, fontWeight: "800", lineHeight: 20 },
  hint: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  row: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: colors.paper2,
  },
  rowLabel: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  rowAmount: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  beforeAfter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 12,
  },
  arrow: { color: colors.accent, fontSize: 24, fontWeight: "900" },
  confirm: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmed: { backgroundColor: colors.actionStrong },
  confirmText: {
    color: colors.ink,
    fontWeight: "900",
    fontSize: 12,
    textAlign: "center",
  },
});
