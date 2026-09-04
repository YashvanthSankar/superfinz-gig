import { useEffect, useState } from "react";
import { StyleSheet, Text, View, type ColorValue } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  projectPayoutSplit,
  recommendAdaptiveSplit,
  type SplitPercentages,
} from "@superfinz/shared";
import { HandCoins, Undo2 } from "lucide-react-native";
import { apiFetch } from "@/lib/api";
import {
  Button,
  Card,
  Chip,
  Divider,
  ErrorState,
  Field,
  Label,
  Loading,
  Notice,
  Screen,
  SectionHeader,
  Stat,
  formatMoney,
  ui,
} from "@/components/ui";
import { DateField } from "@/components/date-field";
import { colors, radius } from "@/constants/theme";
import {
  refreshGigDashboard,
  useGigDashboard,
} from "@/hooks/use-gig-dashboard";

type AmountKey = "essentials" | "workCosts" | "emergency" | "longTerm" | "flexible";

/** The five pockets, in display order, with a colour for the stacked bar. */
const pockets: Array<{
  key: keyof SplitPercentages;
  amountKey: AmountKey;
  label: string;
  color: ColorValue;
}> = [
  { key: "essentialsPct", amountKey: "essentials", label: "Bills", color: colors.primary },
  { key: "workCostsPct", amountKey: "workCosts", label: "Work costs", color: colors.warn },
  { key: "emergencyPct", amountKey: "emergency", label: "Cushion", color: colors.good },
  { key: "longTermPct", amountKey: "longTerm", label: "Savings", color: colors.accent },
  { key: "flexiblePct", amountKey: "flexible", label: "Free to use", color: colors.borderStrong },
];

const formatPct = (value: number) =>
  `${Number.isInteger(value) ? value : value.toFixed(1)}%`;

export default function PayoutSplit() {
  const client = useQueryClient();
  const query = useGigDashboard();
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [receivedAt, setReceivedAt] = useState(new Date());
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"ADAPTIVE" | "CUSTOM">("ADAPTIVE");
  const [percentages, setPercentages] = useState<Record<
    keyof SplitPercentages,
    string
  > | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
      setSaved(true);
    },
  });

  // Show the confirmation briefly, then return to the Money tab.
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => router.back(), 1400);
    return () => clearTimeout(timer);
  }, [saved]);

  const submit = () => {
    setSubmitError(null);
    if (!(payout > 0)) {
      setAmountError("Enter the amount you received.");
      return;
    }
    if (!manualIncome && !selectedSource) {
      setSubmitError("Choose where this payout came from.");
      return;
    }
    if (totalPct !== 100) {
      setSubmitError(
        `Your split adds up to ${formatPct(customTotal)}. Make it exactly 100% before recording.`,
      );
      return;
    }
    mutation.mutate();
  };

  if (query.isLoading) return <Loading label="Preparing your payout plan…" />;
  if (query.isError || !d)
    return (
      <ErrorState
        title="Couldn’t open payout plan"
        body={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => query.refetch()}
      />
    );

  const barLabel = used
    ? `Split: ${pockets
        .map((pocket) => `${pocket.label} ${formatPct(used.percentages[pocket.key])}`)
        .join(", ")}`
    : "";

  return (
    <Screen
      back
      eyebrow="Smart split"
      title="Plan a payout"
      subtitle="Enter money only after it reaches you."
      refreshing={query.isFetching && Boolean(query.data)}
      help={{
        title: "Plan a payout",
        body: "SuperFinz suggests how much to keep for bills, work, savings and safe spending. Review it before saving. No real money is moved.",
      }}
    >
      <Card>
        <SectionHeader eyebrow="Payout" title="What did you receive?" />
        <View style={styles.group}>
          <Label>Where did it come from?</Label>
          <View style={ui.wrap}>
            {activeSources.map((source) => (
              <Chip
                key={source.id}
                role="radio"
                label={source.name}
                selected={!manualIncome && selectedSource?.id === source.id}
                onPress={() => setSourceId(source.id)}
              />
            ))}
            <Chip
              role="radio"
              label="Other or cash income"
              selected={manualIncome}
              onPress={() => setSourceId("MANUAL_INCOME")}
            />
          </View>
          {!activeSources.length && (
            <Text style={ui.small}>
              No active source is connected. You can still record cash or
              client income here.
            </Text>
          )}
        </View>
        <Field
          label="Money received"
          required
          prefix="₹"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={(value) => {
            setAmount(value);
            setAmountError(null);
            setSubmitError(null);
          }}
          placeholder="3,200"
          hint="Only money that has already reached you"
          error={amountError}
        />
        <DateField
          label="Date received"
          value={receivedAt}
          onChange={(value) => value && setReceivedAt(value)}
          maximumDate={new Date()}
        />
        <Field
          label="Note (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="For example, weekly platform payout"
        />
      </Card>

      {payout > 0 ? (
        <Card>
          <SectionHeader
            eyebrow="Suggested split"
            title="Where this payout goes"
            description={
              mode === "ADAPTIVE"
                ? "Based on your next bills, work costs and safety goal."
                : "You choose the percentages."
            }
          />
          <View style={ui.wrap}>
            <Chip
              role="radio"
              label="Recommended"
              selected={mode === "ADAPTIVE"}
              onPress={() => {
                setMode("ADAPTIVE");
                setSubmitError(null);
              }}
            />
            <Chip
              role="radio"
              label="Choose myself"
              selected={mode === "CUSTOM"}
              onPress={() => {
                setMode("CUSTOM");
                setSubmitError(null);
              }}
            />
          </View>

          {mode === "CUSTOM" && (
            <>
              <View style={styles.pctGrid}>
                {pockets.map((pocket) => (
                  <Field
                    key={pocket.key}
                    containerStyle={styles.pctField}
                    label={pocket.label}
                    suffix="%"
                    keyboardType="number-pad"
                    value={values[pocket.key]}
                    onChangeText={(value) => {
                      setSubmitError(null);
                      setPercentages((current) => ({
                        ...(current ?? values),
                        [pocket.key]: value,
                      }));
                    }}
                  />
                ))}
              </View>
              <Notice tone={customTotal === 100 ? "good" : "warn"} live>
                {customTotal === 100
                  ? "Total is 100%."
                  : `Total must be 100% (now ${formatPct(customTotal)}).`}
              </Notice>
              <Button
                title="Reset to my usual split"
                tone="quiet"
                size="sm"
                inline
                icon={Undo2}
                onPress={() => setPercentages(null)}
              />
            </>
          )}

          {used && totalPct === 100 && (
            <>
              <View
                accessible
                accessibilityLabel={barLabel}
                style={styles.bar}
              >
                {pockets.map((pocket) => {
                  const pct = used.percentages[pocket.key];
                  return pct > 0 ? (
                    <View
                      key={pocket.key}
                      style={{ flex: pct, backgroundColor: pocket.color }}
                    />
                  ) : null;
                })}
              </View>
              <View>
                {pockets.map((pocket, index) => (
                  <View
                    key={pocket.key}
                    style={[
                      styles.pocketRow,
                      index === pockets.length - 1 && styles.pocketRowLast,
                    ]}
                  >
                    <View
                      accessible={false}
                      style={[styles.swatch, { backgroundColor: pocket.color }]}
                    />
                    <View style={styles.grow}>
                      <Text style={ui.bodyStrong}>{pocket.label}</Text>
                      <Text style={ui.small}>
                        {formatPct(used.percentages[pocket.key])}
                      </Text>
                    </View>
                    <Text style={[styles.pocketAmount, ui.num]}>
                      {formatMoney(used.amounts[pocket.amountKey])}
                    </Text>
                  </View>
                ))}
              </View>
              <Divider />
              <View style={styles.stats}>
                <Stat
                  label="Safe to spend now"
                  value={formatMoney(used.beforeSafeAmount)}
                  style={styles.stat}
                />
                <Stat
                  label="After this payout"
                  value={formatMoney(used.afterSafeAmount)}
                  tone={
                    used.afterSafeAmount >= used.beforeSafeAmount
                      ? "good"
                      : "warn"
                  }
                  help="Once bills and work costs are set aside"
                  style={styles.stat}
                />
              </View>
              {used.reasons.length > 0 && (
                <Text style={ui.small}>{used.reasons.join(" ")}</Text>
              )}
            </>
          )}
        </Card>
      ) : (
        <Text style={[ui.small, styles.centered]}>
          Enter the money you received to see the suggested split.
        </Text>
      )}

      <Notice tone="info" title="No money moves">
        SuperFinz records a plan and updates your pockets. It never moves real
        money.
      </Notice>
      {submitError && <Notice tone="bad">{submitError}</Notice>}
      {mutation.isError && (
        <Notice tone="bad" title="Couldn’t record this payout">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Try again."}
        </Notice>
      )}
      {saved && (
        <Notice tone="good" live title="Payout recorded">
          Your balance and five pockets were updated together.
        </Notice>
      )}
      <Button
        title="Record payout"
        tone="accent"
        size="lg"
        icon={HandCoins}
        loading={mutation.isPending || saved}
        onPress={submit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  pctGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pctField: { flexGrow: 1, flexBasis: "45%" },
  bar: {
    height: 12,
    flexDirection: "row",
    gap: 2,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: colors.paper2,
  },
  pocketRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pocketRowLast: { borderBottomWidth: 0 },
  swatch: { width: 12, height: 12, borderRadius: radius.pill },
  grow: { flex: 1, minWidth: 0 },
  pocketAmount: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    textAlign: "right",
  },
  stats: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  stat: { flex: 1, minWidth: 0 },
  centered: { textAlign: "center", paddingHorizontal: 8 },
});
