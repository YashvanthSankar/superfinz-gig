import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import type { CashEntryKind } from "@superfinz/shared";
import { apiFetch } from "@/lib/api";
import {
  Button,
  Card,
  Empty,
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

const kinds: Array<{ value: CashEntryKind; label: string }> = [
  { value: "WORK_EXPENSE", label: "Work cost" },
  { value: "ESSENTIAL_EXPENSE", label: "Home or bill cost" },
  { value: "FLEXIBLE_EXPENSE", label: "Personal cost" },
];
const kindLabel: Record<string, string> = {
  INCOME: "Income",
  WORK_EXPENSE: "Work cost",
  ESSENTIAL_EXPENSE: "Essential",
  FLEXIBLE_EXPENSE: "Flexible",
  COMMITMENT_PAYMENT: "Commitment",
  POCKET_ALLOCATION: "Pocket allocation",
  TRANSFER: "Transfer",
};
const money = (value: number) =>
  `₹${Math.round(value).toLocaleString("en-IN")}`;

export default function Income() {
  const client = useQueryClient();
  const [show, setShow] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [kind, setKind] = useState<CashEntryKind>("WORK_EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Fuel");
  const [note, setNote] = useState("");
  const [method, setMethod] = useState("UPI");
  const [date, setDate] = useState(new Date());
  const query = useGigDashboard();
  const refresh = () => refreshGigDashboard(client);
  const create = useMutation({
    mutationFn: () =>
      apiFetch("/api/gig/entries", {
        method: "POST",
        body: JSON.stringify({
          kind,
          amount: Number(amount),
          category: category.trim(),
          paymentMethod: method,
          note: note.trim() || null,
          workRelated: kind === "WORK_EXPENSE",
          status: "SETTLED",
          date: date.toISOString(),
        }),
      }),
    onSuccess: async () => {
      setAmount("");
      setNote("");
      setShow(false);
      await refresh();
      Alert.alert(
        "Cost saved",
        "Money Now and Safe to Spend have been updated.",
      );
    },
    onError: (cause) =>
      Alert.alert(
        "Couldn’t save entry",
        cause instanceof Error ? cause.message : "Try again",
      ),
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/gig/entries/${id}`, { method: "DELETE" }),
    onSuccess: refresh,
    onError: (cause) =>
      Alert.alert(
        "Couldn’t delete entry",
        cause instanceof Error ? cause.message : "Try again",
      ),
  });
  if (query.isLoading) return <Loading label="Loading your money…" />;
  if (query.isError || !query.data)
    return (
      <ErrorState
        title="Couldn’t load your money"
        body={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => query.refetch()}
      />
    );
  const d = query.data.dashboard;
  const latestSplit = [...d.payoutSplits].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
  const valid = Number(amount) > 0 && category.trim();
  return (
    <Screen
      title="Money"
      subtitle="Record costs and plan each new payout."
      help={{
        title: "Which action should I use?",
        body: "Add a cost subtracts money you spent. Plan a payout adds newly received income and divides it between bills, work, savings, and safe spending. Do not enter the same payout twice.",
      }}
    >
      <View style={styles.metrics}>
        <Card style={styles.metric}>
          <Label>MONEY NOW</Label>
          <Money value={d.summary.availableBalance} />
        </Card>
        <Card style={styles.metric}>
          <Label>NET WORK EARNINGS</Label>
          <Money value={d.summary.trueNetIncomeWeek} />
        </Card>
      </View>
      <Card>
        <Label>THIS WEEK</Label>
        <MoneyRow label="Money received" value={d.summary.grossIncomeWeek} />
        <MoneyRow label="All recorded costs" value={-d.summary.allCostsWeek} />
        <View style={styles.summaryRule} />
        <MoneyRow
          label="Change this week"
          value={d.summary.cashChangeWeek}
          strong
        />
        <Text style={ui.small}>
          Includes {money(d.summary.workCostsWeek)} spent on fuel and other work
          costs. Every saved or deleted entry updates these numbers.
        </Text>
      </Card>
      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <Button
            title={show ? "Close form" : "Add a cost"}
            tone="quiet"
            onPress={() => setShow((value) => !value)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Plan a payout" onPress={() => router.push("/split")} />
        </View>
      </View>
      <Text style={styles.actionNote}>
        New earnings? Plan the payout—it records the income and protects it in
        one step.
      </Text>
      {show && (
        <Card>
          <Label>Entry type</Label>
          <View style={styles.wrap}>
            {kinds.map((item) => (
              <Choice
                key={item.value}
                label={item.label}
                selected={kind === item.value}
                onPress={() => {
                  setKind(item.value);
                  setCategory(
                    item.value === "WORK_EXPENSE"
                      ? "Fuel"
                      : item.value === "ESSENTIAL_EXPENSE"
                        ? "Groceries"
                        : "Personal",
                  );
                }}
              />
            ))}
          </View>
          <Field
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="₹ 500"
          />
          <Field label="Category" value={category} onChangeText={setCategory} />
          <Field label="Note (optional)" value={note} onChangeText={setNote} />
          <Label>Payment method</Label>
          <View style={styles.wrap}>
            {["UPI", "CASH", "BANK", "PLATFORM"].map((item) => (
              <Choice
                key={item}
                label={item}
                selected={method === item}
                onPress={() => setMethod(item)}
              />
            ))}
          </View>
          <DateField
            label="Date"
            value={date}
            onChange={(value) => value && setDate(value)}
            maximumDate={new Date()}
          />
          <Button
            title="Save cost"
            loading={create.isPending}
            disabled={!valid}
            onPress={() => create.mutate()}
          />
        </Card>
      )}
      <Button
        title={showSources ? "Hide income sources" : "Show income sources"}
        tone="quiet"
        onPress={() => setShowSources((value) => !value)}
      />
      {showSources && (
        <Card>
          <View style={ui.between}>
            <View>
              <Label>Income sources</Label>
              <Text style={ui.h2}>
                {d.sources.length} source{d.sources.length === 1 ? "" : "s"}
              </Text>
            </View>
            <Text style={styles.range}>
              {money(d.summary.expectedPayoutMin)}–
              {money(d.summary.expectedPayoutMax)}
            </Text>
          </View>
          {d.sources.map((source) => (
            <View key={source.id} style={styles.source}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{source.name}</Text>
                <Text style={ui.small}>
                  {source.frequency.toLowerCase()} ·{" "}
                  {source.connectionMode.toLowerCase().replaceAll("_", " ")}
                </Text>
              </View>
              <View style={styles.prototype}>
                <Text style={styles.prototypeText}>
                  {source.prototype ? "PROTOTYPE" : source.status}
                </Text>
              </View>
            </View>
          ))}
          <Text style={ui.small}>
            Connections are consent-based. Manual and simulated sources are
            clearly labeled.
          </Text>
        </Card>
      )}
      <Card>
        <Label>Recent money entries</Label>
        {!d.entries.length ? (
          <Empty
            title="No entries yet"
            body="Plan a payout or add a cost to start your money history."
          />
        ) : (
          d.entries.slice(0, 12).map((entry) => {
            const income = entry.kind === "INCOME";
            const canUndoPayout = Boolean(
              entry.payoutSplitId &&
              entry.payoutSplitId === latestSplit?.id &&
              (latestSplit?.fundedCommitments ?? []).every((funding) =>
                d.commitments.some(
                  (commitment) => commitment.id === funding.id,
                ),
              ) &&
              !d.entries.some(
                (item) =>
                  item.id !== entry.id &&
                  new Date(item.createdAt).getTime() >
                    new Date(entry.createdAt).getTime(),
              ),
            );
            const canRemove = !entry.payoutSplitId || canUndoPayout;
            return (
              <View key={entry.id} style={styles.entry}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{entry.category}</Text>
                  <Text style={ui.small}>
                    {kindLabel[entry.kind] ?? entry.kind} ·{" "}
                    {new Date(entry.date).toLocaleDateString("en-IN")} ·{" "}
                    {entry.paymentMethod}
                  </Text>
                  {entry.note && <Text style={ui.small}>{entry.note}</Text>}
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.amount, income && styles.incomeAmount]}>
                    {income ? "+" : "−"}
                    {money(entry.amount)}
                  </Text>
                  {canRemove ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${entry.payoutSplitId ? "Undo" : "Delete"} ${entry.category} entry`}
                      hitSlop={10}
                      disabled={remove.isPending}
                      onPress={() =>
                        Alert.alert(
                          entry.payoutSplitId
                            ? "Undo this payout?"
                            : "Delete entry?",
                          entry.payoutSplitId
                            ? "This removes the income and updates your balance, pockets, and protected bills together."
                            : "Your balance and related pocket will be updated.",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: entry.payoutSplitId
                                ? "Undo payout"
                                : "Delete",
                              style: "destructive",
                              onPress: () => remove.mutate(entry.id),
                            },
                          ],
                        )
                      }
                      style={styles.delete}
                    >
                      <Text style={styles.deleteText}>
                        {entry.payoutSplitId ? "Undo payout" : "Delete"}
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={ui.small}>Recorded payout</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </Card>
    </Screen>
  );
}

function MoneyRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return (
    <View style={styles.moneyRow}>
      <Text style={[styles.moneyRowLabel, strong && styles.moneyRowStrong]}>
        {label}
      </Text>
      <Text style={[styles.moneyRowValue, strong && styles.moneyRowStrong]}>
        {sign}
        {money(Math.abs(value))}
      </Text>
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
      <Text style={styles.choiceText}>
        {selected ? "✓ " : ""}
        {label}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  metrics: { flexDirection: "row", gap: 12 },
  metric: { flex: 1 },
  moneyRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  moneyRowLabel: { flex: 1, color: colors.inkSoft, fontSize: 15 },
  moneyRowValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  moneyRowStrong: { color: colors.ink, fontSize: 17, fontWeight: "700" },
  summaryRule: { height: 1, backgroundColor: colors.border },
  actions: { flexDirection: "row", gap: 10 },
  actionNote: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.paper,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceActive: {
    borderColor: colors.action,
    backgroundColor: colors.accentSoft,
  },
  choiceText: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.6 },
  range: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  source: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderColor: colors.paper2,
  },
  prototype: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.accentSoft,
    padding: 5,
  },
  prototypeText: { color: colors.ink, fontSize: 8, fontWeight: "700" },
  entry: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderColor: colors.paper2,
  },
  name: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  amount: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  incomeAmount: { color: colors.accent },
  delete: { minHeight: 48, justifyContent: "center" },
  deleteText: { color: colors.red, fontSize: 13, fontWeight: "700" },
});
