import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  projectPayoutSplit,
  recommendAdaptiveSplit,
  type GigDashboardDto,
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
  const query = useQuery({
    queryKey: ["gig-dashboard"],
    queryFn: () =>
      apiFetch<{ dashboard: GigDashboardDto }>("/api/gig/dashboard"),
  });
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
          sourceId: selectedSource?.id ?? null,
          sourceName: selectedSource?.name ?? "Manual income",
          amount: payout,
          receivedAt: receivedAt.toISOString(),
          note: note.trim() || null,
          allocationMode: mode,
          percentages: mode === "ADAPTIVE" ? adaptive?.percentages : custom,
        }),
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["gig-dashboard"] });
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
    <Screen>
      <Text accessibilityRole="header" style={ui.h1}>
        A job for every rupee.
      </Text>
      <Text style={ui.body}>
        Enter money only after it reaches you. We’ll protect bills and work
        costs first.
      </Text>
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
        </View>
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
        />
        <Field label="Note (optional)" value={note} onChangeText={setNote} />
      </Card>
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
            Changes with your next bills, work costs, and cushion—not a fixed
            rule.
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
      {payout > 0 && used && totalPct === 100 && (
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
          <Text style={ui.small}>
            Protected days: {used.beforeProtectedDays.toFixed(1)} →{" "}
            {used.afterProtectedDays.toFixed(1)}
          </Text>
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
        SuperFinz records a plan. It does not connect to a bank or move real
        money in this prototype.
      </Text>
      <Button
        title="Save payout plan"
        loading={mutation.isPending}
        disabled={
          payout <= 0 || totalPct !== 100 || !confirmed || !selectedSource
        }
        onPress={() => mutation.mutate()}
      />
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
      <Text style={[styles.choiceText, selected && { color: colors.white }]}>
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
  choiceActive: { backgroundColor: colors.actionStrong },
  choiceText: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.65 },
  total: {
    color: colors.green,
    fontSize: 18,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  error: { color: colors.red, fontWeight: "800", lineHeight: 20 },
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
