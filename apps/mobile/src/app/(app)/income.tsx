import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import type { CashEntryKind, GigDashboardDto } from "@superfinz/shared";
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

const kinds: Array<{ value: CashEntryKind; label: string }> = [
  { value: "INCOME", label: "Income" },
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
  const [kind, setKind] = useState<CashEntryKind>("INCOME");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Payout");
  const [note, setNote] = useState("");
  const [method, setMethod] = useState("UPI");
  const [date, setDate] = useState(new Date());
  const query = useQuery({
    queryKey: ["gig-dashboard"],
    queryFn: () =>
      apiFetch<{ dashboard: GigDashboardDto }>("/api/gig/dashboard"),
  });
  const refresh = () =>
    client.invalidateQueries({ queryKey: ["gig-dashboard"] });
  const create = useMutation({
    mutationFn: () => {
      const source = query.data?.dashboard.sources[0];
      return apiFetch("/api/gig/entries", {
        method: "POST",
        body: JSON.stringify({
          kind,
          amount: Number(amount),
          ...(kind === "INCOME" && source
            ? { sourceId: source.id, sourceName: source.name }
            : {}),
          category: category.trim(),
          paymentMethod: method,
          note: note.trim() || null,
          workRelated: kind === "WORK_EXPENSE",
          status: "SETTLED",
          date: date.toISOString(),
        }),
      });
    },
    onSuccess: async () => {
      setAmount("");
      setNote("");
      setShow(false);
      await refresh();
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
  const valid = Number(amount) > 0 && category.trim();
  return (
    <Screen
      title="Money"
      subtitle="Add what you earned or spent for work."
      help={{
        title: "Money entries",
        body: "Add income when money reaches you. Add work costs such as fuel, repairs, data, or platform fees so your safe amount stays honest.",
      }}
    >
      <View style={styles.metrics}>
        <Card style={styles.metric}>
          <Label>Earned this week</Label>
          <Money value={d.summary.grossIncomeWeek} />
        </Card>
        <Card style={styles.metric}>
          <Label>Spent to work</Label>
          <Money value={d.summary.workCostsWeek} />
        </Card>
      </View>
      <Card style={{ backgroundColor: colors.greenSoft }}>
        <Label>You kept this week</Label>
        <Money value={d.summary.trueNetIncomeWeek} />
        <Text style={ui.small}>
          Income left after your recorded fuel, fees, repairs, and other work
          costs.
        </Text>
      </Card>
      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <Button
            title={show ? "Close form" : "Add income or cost"}
            tone={show ? "quiet" : "accent"}
            onPress={() => setShow((value) => !value)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Split payout"
            tone="ink"
            onPress={() => router.push("/split")}
          />
        </View>
      </View>
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
                    item.value === "INCOME"
                      ? "Payout"
                      : item.value === "WORK_EXPENSE"
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
          />
          {kind === "INCOME" && (
            <Text style={ui.small}>
              This adds income to your balance. Use Plan a payout when you want
              SuperFinz to protect bills and work money first.
            </Text>
          )}
          <Button
            title="Save entry"
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
            body="Add settled income or a cost to start your cashbook."
          />
        ) : (
          d.entries.slice(0, 12).map((entry) => {
            const income = entry.kind === "INCOME";
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
                  <Text
                    style={[styles.amount, income && { color: colors.green }]}
                  >
                    {income ? "+" : "−"}
                    {money(entry.amount)}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${entry.category} entry`}
                    hitSlop={10}
                    disabled={remove.isPending}
                    onPress={() =>
                      Alert.alert(
                        "Delete entry?",
                        "Your balance and related pocket will be reversed.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => remove.mutate(entry.id),
                          },
                        ],
                      )
                    }
                    style={styles.delete}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </Card>
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
        {label}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  metrics: { flexDirection: "row", gap: 12 },
  metric: { flex: 1 },
  actions: { flexDirection: "row", gap: 10 },
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
  delete: { minHeight: 48, justifyContent: "center" },
  deleteText: { color: colors.red, fontSize: 13, fontWeight: "700" },
});
