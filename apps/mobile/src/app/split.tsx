import { useEffect, useState } from "react";
import { StyleSheet, Text, View, type ColorValue } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  projectPayoutSplit,
  recommendAdaptiveSplit,
  type GigDashboardDto,
  type PayoutSplitDto,
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
  setGigDashboard,
  useGigDashboard,
} from "@/hooks/use-gig-dashboard";
import { useAuth } from "@/providers/auth-provider";

type AmountKey =
  "essentials" | "workCosts" | "emergency" | "longTerm" | "flexible";
type AllocationUnit = "RUPEES" | "PERCENT";
type AmountInputs = Record<AmountKey, string>;

/** The five pockets, in display order, with a colour for the stacked bar. */
const pockets: Array<{
  key: keyof SplitPercentages;
  amountKey: AmountKey;
  label: string;
  color: ColorValue;
}> = [
  {
    key: "essentialsPct",
    amountKey: "essentials",
    label: "Bills",
    color: colors.primary,
  },
  {
    key: "workCostsPct",
    amountKey: "workCosts",
    label: "Work costs",
    color: colors.warn,
  },
  {
    key: "emergencyPct",
    amountKey: "emergency",
    label: "Cushion",
    color: colors.good,
  },
  {
    key: "longTermPct",
    amountKey: "longTerm",
    label: "Investment goal",
    color: colors.accent,
  },
  {
    key: "flexiblePct",
    amountKey: "flexible",
    label: "Flexible pocket",
    color: colors.borderStrong,
  },
];

const formatPct = (value: number) =>
  `${Number.isInteger(value) ? value : value.toFixed(1)}%`;

const roundCurrency = (value: number) => Math.round(value * 100) / 100;
const parseNumber = (value: string) => Number(value.replace(/,/g, "")) || 0;
const formatInputNumber = (value: number, decimals = 2) =>
  Number(value.toFixed(decimals)).toString();

const amountsFromPercentages = (
  payout: number,
  percentages: SplitPercentages,
): Record<AmountKey, number> => {
  const essentials = roundCurrency((payout * percentages.essentialsPct) / 100);
  const workCosts = roundCurrency((payout * percentages.workCostsPct) / 100);
  const emergency = roundCurrency((payout * percentages.emergencyPct) / 100);
  const longTerm = roundCurrency((payout * percentages.longTermPct) / 100);
  return {
    essentials,
    workCosts,
    emergency,
    longTerm,
    flexible: roundCurrency(
      payout - essentials - workCosts - emergency - longTerm,
    ),
  };
};

const amountInputsFromPercentages = (
  payout: number,
  percentages: SplitPercentages,
): AmountInputs => {
  const amounts = amountsFromPercentages(payout, percentages);
  return {
    essentials: formatInputNumber(amounts.essentials),
    workCosts: formatInputNumber(amounts.workCosts),
    emergency: formatInputNumber(amounts.emergency),
    longTerm: formatInputNumber(amounts.longTerm),
    flexible: formatInputNumber(amounts.flexible),
  };
};

const percentagesFromAmounts = (
  payout: number,
  amounts: Record<AmountKey, number>,
): SplitPercentages => {
  if (!(payout > 0))
    return {
      essentialsPct: 0,
      workCostsPct: 0,
      emergencyPct: 0,
      longTermPct: 0,
      flexiblePct: 0,
    };

  return {
    essentialsPct: (amounts.essentials / payout) * 100,
    workCostsPct: (amounts.workCosts / payout) * 100,
    emergencyPct: (amounts.emergency / payout) * 100,
    longTermPct: (amounts.longTerm / payout) * 100,
    flexiblePct: (amounts.flexible / payout) * 100,
  };
};

const percentageInputsFromAmounts = (
  payout: number,
  amounts: Record<AmountKey, number>,
): Record<keyof SplitPercentages, string> => {
  const next = percentagesFromAmounts(payout, amounts);
  const totalCents = Math.round(
    Object.values(amounts).reduce((sum, value) => sum + value, 0) * 100,
  );
  const payoutCents = Math.round(payout * 100);
  const essentialsPct = Number(next.essentialsPct.toFixed(6));
  const workCostsPct = Number(next.workCostsPct.toFixed(6));
  const emergencyPct = Number(next.emergencyPct.toFixed(6));
  const longTermPct = Number(next.longTermPct.toFixed(6));
  const flexiblePct =
    totalCents === payoutCents
      ? 100 - essentialsPct - workCostsPct - emergencyPct - longTermPct
      : Number(next.flexiblePct.toFixed(6));

  return {
    essentialsPct: formatInputNumber(essentialsPct, 6),
    workCostsPct: formatInputNumber(workCostsPct, 6),
    emergencyPct: formatInputNumber(emergencyPct, 6),
    longTermPct: formatInputNumber(longTermPct, 6),
    flexiblePct: formatInputNumber(flexiblePct, 6),
  };
};

export default function PayoutSplit() {
  const client = useQueryClient();
  const { user } = useAuth();
  const query = useGigDashboard();
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [receivedAt, setReceivedAt] = useState(new Date());
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"ADAPTIVE" | "CUSTOM">("ADAPTIVE");
  const [allocationUnit, setAllocationUnit] =
    useState<AllocationUnit>("RUPEES");
  const [percentages, setPercentages] = useState<Record<
    keyof SplitPercentages,
    string
  > | null>(null);
  const [amountInputs, setAmountInputs] = useState<AmountInputs | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const d = query.data?.dashboard;
  const activeSources =
    d?.sources.filter((source) => source.status === "ACTIVE") ?? [];
  const selectedSource =
    activeSources.find((source) => source.id === sourceId) ?? activeSources[0];
  const manualIncome =
    sourceId === "MANUAL_INCOME" || activeSources.length === 0;
  const payout = parseNumber(amount);
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
  const percentageValues = percentages ?? defaultValues;
  const percentageCustom: SplitPercentages = {
    essentialsPct: parseNumber(percentageValues.essentialsPct),
    workCostsPct: parseNumber(percentageValues.workCostsPct),
    emergencyPct: parseNumber(percentageValues.emergencyPct),
    longTermPct: parseNumber(percentageValues.longTermPct),
    flexiblePct: parseNumber(percentageValues.flexiblePct),
  };
  const defaultAmountInputs = amountInputsFromPercentages(
    payout,
    percentageCustom,
  );
  const rupeeValues = amountInputs ?? defaultAmountInputs;
  const rupeeAmounts: Record<AmountKey, number> = {
    essentials: parseNumber(rupeeValues.essentials),
    workCosts: parseNumber(rupeeValues.workCosts),
    emergency: parseNumber(rupeeValues.emergency),
    longTerm: parseNumber(rupeeValues.longTerm),
    flexible: parseNumber(rupeeValues.flexible),
  };
  const custom =
    allocationUnit === "PERCENT"
      ? percentageCustom
      : percentagesFromAmounts(payout, rupeeAmounts);
  const percentageTotal = Object.values(percentageCustom).reduce(
    (sum, value) => sum + (value || 0),
    0,
  );
  const rupeeTotal = roundCurrency(
    Object.values(rupeeAmounts).reduce((sum, value) => sum + (value || 0), 0),
  );
  const customIsComplete =
    allocationUnit === "PERCENT"
      ? Math.abs(percentageTotal - 100) < 0.001
      : Math.round(rupeeTotal * 100) === Math.round(payout * 100);
  const payoutSourceId = manualIncome ? null : selectedSource?.id;
  const adaptive = d
    ? recommendAdaptiveSplit(d, payout, receivedAt, payoutSourceId)
    : null;
  const customProjection = d
    ? projectPayoutSplit(d, payout, custom, receivedAt, payoutSourceId)
    : null;
  const used =
    mode === "ADAPTIVE"
      ? adaptive
      : customProjection
        ? {
            ...customProjection,
            percentages: custom,
            reasons: ["You chose this split."],
            fundedCommitments: [],
          }
        : null;
  const totalPct = mode === "ADAPTIVE" ? 100 : customIsComplete ? 100 : 0;

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<{
        split: PayoutSplitDto;
        dashboard: GigDashboardDto | null;
      }>("/api/gig/split", {
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
    onSuccess: async ({ dashboard }) => {
      if (user && dashboard) setGigDashboard(client, user.id, dashboard);
      setSaved(true);
      await refreshGigDashboard(client);
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
    if (mode === "CUSTOM" && !customIsComplete) {
      setSubmitError(
        allocationUnit === "PERCENT"
          ? `Your split adds up to ${formatPct(percentageTotal)}. Make it exactly 100% before recording.`
          : `Your pockets add up to ${formatMoney(rupeeTotal)}. Make them equal the ${formatMoney(payout)} payout.`,
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
        .map(
          (pocket) =>
            `${pocket.label} ${formatPct(used.percentages[pocket.key])}`,
        )
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
        body: "SuperFinz suggests how much to keep for bills, work, emergencies, an investment goal and safe spending. Review it before saving. No money is moved or invested.",
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
              No active source is connected. You can still record cash or client
              income here.
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
                : "You choose the amounts or percentages."
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
              <View style={styles.group}>
                <Label>Enter your split as</Label>
                <View style={ui.wrap}>
                  <Chip
                    role="radio"
                    label="₹ Amounts"
                    selected={allocationUnit === "RUPEES"}
                    onPress={() => {
                      setAmountInputs(
                        amountInputsFromPercentages(payout, percentageCustom),
                      );
                      setAllocationUnit("RUPEES");
                      setSubmitError(null);
                    }}
                  />
                  <Chip
                    role="radio"
                    label="% Percentages"
                    selected={allocationUnit === "PERCENT"}
                    onPress={() => {
                      setPercentages(
                        percentageInputsFromAmounts(payout, rupeeAmounts),
                      );
                      setAllocationUnit("PERCENT");
                      setSubmitError(null);
                    }}
                  />
                </View>
                <Text style={ui.small}>
                  Choose the way that is easiest for you. We show both below.
                </Text>
              </View>
              <View style={styles.pctGrid}>
                {pockets.map((pocket) => (
                  <Field
                    key={pocket.key}
                    containerStyle={styles.pctField}
                    label={pocket.label}
                    prefix={allocationUnit === "RUPEES" ? "₹" : undefined}
                    suffix={allocationUnit === "PERCENT" ? "%" : undefined}
                    keyboardType="decimal-pad"
                    value={
                      allocationUnit === "RUPEES"
                        ? rupeeValues[pocket.amountKey]
                        : percentageValues[pocket.key]
                    }
                    onChangeText={(value) => {
                      setSubmitError(null);
                      if (allocationUnit === "RUPEES") {
                        setAmountInputs((current) => ({
                          ...(current ?? rupeeValues),
                          [pocket.amountKey]: value,
                        }));
                      } else {
                        setPercentages((current) => ({
                          ...(current ?? percentageValues),
                          [pocket.key]: value,
                        }));
                      }
                    }}
                  />
                ))}
              </View>
              <Notice tone={customIsComplete ? "good" : "warn"} live>
                {allocationUnit === "RUPEES"
                  ? customIsComplete
                    ? `Total matches your ${formatMoney(payout)} payout.`
                    : `Total must be ${formatMoney(payout)} (now ${formatMoney(rupeeTotal)}).`
                  : customIsComplete
                    ? "Total is 100%."
                    : `Total must be 100% (now ${formatPct(percentageTotal)}).`}
              </Notice>
              <Button
                title="Reset to my usual split"
                tone="quiet"
                size="sm"
                inline
                icon={Undo2}
                onPress={() => {
                  setPercentages(null);
                  setAmountInputs(null);
                  setSubmitError(null);
                }}
              />
            </>
          )}

          {used && totalPct === 100 && (
            <>
              <View accessible accessibilityLabel={barLabel} style={styles.bar}>
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
              {used.amounts.flexible > used.afterSafeAmount && (
                <Notice tone="warn" title="Flexible is not all safe yet">
                  You assigned {formatMoney(used.amounts.flexible)} for personal
                  spending, but Today will show{" "}
                  {formatMoney(used.afterSafeAmount)}
                  after also checking bills and work costs until the next
                  payout.
                </Notice>
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
