import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import type {
  CashEntryDto,
  CashEntryKind,
  ConnectionMode,
  GigFrequency,
  GigIncomeSourceDto,
  GigSourceType,
} from "@superfinz/shared";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  Banknote,
  CalendarCheck,
  Fuel,
  House,
  Landmark,
  PiggyBank,
  Plus,
  Receipt,
  ShoppingBag,
  Smartphone,
  Store,
  Trash2,
  Undo2,
  Wallet,
  WalletCards,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react-native";
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
import { TOUCH, colorString, colors } from "@/constants/theme";
import {
  refreshGigDashboard,
  useGigDashboard,
} from "@/hooks/use-gig-dashboard";

/* ------------------------------------------------------------------ */
/* Label maps: raw enum strings never reach the screen                  */
/* ------------------------------------------------------------------ */

const kinds: Array<{ value: CashEntryKind; label: string }> = [
  { value: "WORK_EXPENSE", label: "Work cost" },
  { value: "ESSENTIAL_EXPENSE", label: "Home or bill cost" },
  { value: "FLEXIBLE_EXPENSE", label: "Personal cost" },
];
const defaultCategory: Record<CashEntryKind, string> = {
  INCOME: "Payout",
  WORK_EXPENSE: "Fuel",
  ESSENTIAL_EXPENSE: "Groceries",
  FLEXIBLE_EXPENSE: "Personal",
  COMMITMENT_PAYMENT: "Bill",
  POCKET_ALLOCATION: "Pocket",
  TRANSFER: "Transfer",
};
const kindLabel: Record<CashEntryKind, string> = {
  INCOME: "Income",
  WORK_EXPENSE: "Work cost",
  ESSENTIAL_EXPENSE: "Home or bill cost",
  FLEXIBLE_EXPENSE: "Personal cost",
  COMMITMENT_PAYMENT: "Bill payment",
  POCKET_ALLOCATION: "Pocket allocation",
  TRANSFER: "Transfer",
};
const kindIcon: Record<CashEntryKind, LucideIcon> = {
  INCOME: ArrowDownLeft,
  WORK_EXPENSE: Wrench,
  ESSENTIAL_EXPENSE: House,
  FLEXIBLE_EXPENSE: ShoppingBag,
  COMMITMENT_PAYMENT: CalendarCheck,
  POCKET_ALLOCATION: PiggyBank,
  TRANSFER: ArrowLeftRight,
};
/** Values are sent to the API unchanged; only the labels are friendly. */
const methods = ["UPI", "CASH", "BANK", "PLATFORM"] as const;
const methodLabel: Record<string, string> = {
  UPI: "UPI",
  CASH: "Cash",
  BANK: "Bank",
  PLATFORM: "Platform",
};
const entryStatus: Record<
  CashEntryDto["status"],
  { label: string; tone: BadgeTone }
> = {
  SETTLED: { label: "Settled", tone: "neutral" },
  PAID: { label: "Paid", tone: "good" },
  EXPECTED: { label: "Pending", tone: "warn" },
  PLANNED: { label: "Planned", tone: "accent" },
};
const sourceTypeLabel: Record<GigSourceType, string> = {
  PLATFORM_PAYOUT: "Platform payout",
  DIRECT_UPI: "Direct UPI",
  BANK_TRANSFER: "Bank transfer",
  CASH: "Cash",
  OTHER: "Other",
};
const sourceTypeIcon: Record<GigSourceType, LucideIcon> = {
  PLATFORM_PAYOUT: Store,
  DIRECT_UPI: Smartphone,
  BANK_TRANSFER: Landmark,
  CASH: Banknote,
  OTHER: Wallet,
};
const frequencyLabel: Record<GigFrequency, string> = {
  DAILY: "Paid daily",
  WEEKLY: "Paid weekly",
  FORTNIGHTLY: "Paid fortnightly",
  MONTHLY: "Paid monthly",
  IRREGULAR: "Irregular payouts",
};
const connectionLabel: Record<ConnectionMode, string> = {
  SIMULATED_BANK: "Simulated bank",
  SIMULATED_PLATFORM: "Simulated platform",
  FILE_IMPORT: "File import",
  MANUAL: "Manual",
};
const sourceStatus: Record<
  GigIncomeSourceDto["status"],
  { label: string; tone: BadgeTone }
> = {
  ACTIVE: { label: "Active", tone: "good" },
  PAUSED: { label: "Paused", tone: "warn" },
  ERROR: { label: "Needs attention", tone: "bad" },
  REVOKED: { label: "Revoked", tone: "bad" },
};

/** Fallback for any value the maps above do not know: "SOME_VALUE" → "Some value". */
const humanize = (value: string) => {
  const text = value.toLowerCase().replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};
const methodName = (value: string) => methodLabel[value] ?? humanize(value);

function entryIcon(entry: CashEntryDto): LucideIcon {
  if (
    entry.kind === "WORK_EXPENSE" &&
    /fuel|petrol|diesel|cng/i.test(entry.category)
  )
    return Fuel;
  return kindIcon[entry.kind] ?? Receipt;
}

type FormErrors = { amount?: string; category?: string };

export default function Income() {
  const client = useQueryClient();
  const [show, setShow] = useState(false);
  const [kind, setKind] = useState<CashEntryKind>("WORK_EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Fuel");
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<string>("UPI");
  const [date, setDate] = useState(new Date());
  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState(false);
  const query = useGigDashboard();
  const refresh = () => refreshGigDashboard(client);

  // The success notice is brief: it clears itself after a few seconds.
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 5000);
    return () => clearTimeout(timer);
  }, [saved]);

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
      setErrors({});
      setShow(false);
      setSaved(true);
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/gig/entries/${id}`, { method: "DELETE" }),
    onSuccess: refresh,
  });

  const toggleForm = () => {
    create.reset();
    setSaved(false);
    setShow((value) => !value);
  };
  const openForm = () => {
    create.reset();
    setSaved(false);
    setShow(true);
  };
  const submit = () => {
    const next: FormErrors = {};
    if (!(Number(amount) > 0))
      next.amount = "Enter an amount greater than zero.";
    if (!category.trim())
      next.category = "Add a short category, for example Fuel.";
    setErrors(next);
    if (next.amount || next.category) return;
    create.mutate();
  };
  const confirmRemove = (entry: CashEntryDto, title: string) => {
    const undo = Boolean(entry.payoutSplitId);
    Alert.alert(
      undo ? "Undo this payout?" : `Delete ${title}?`,
      undo
        ? "This removes the income and updates your balance, pockets and protected bills together."
        : "Your balance and the related pocket will be updated.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: undo ? "Undo payout" : "Delete",
          style: "destructive",
          onPress: () => remove.mutate(entry.id),
        },
      ],
    );
  };

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
  const recent = d.entries.slice(0, 12);
  const activeCount = d.sources.filter((s) => s.status === "ACTIVE").length;
  const pausedCount = d.sources.filter((s) => s.status === "PAUSED").length;
  const attentionCount = d.sources.length - activeCount - pausedCount;
  const sourcesSummary = d.sources.length
    ? [
        `${activeCount} connected`,
        `${pausedCount} paused`,
        attentionCount > 0 ? `${attentionCount} need attention` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "None connected yet";

  return (
    <Screen
      eyebrow="Your money"
      title="Money"
      subtitle="Record costs and plan each new payout."
      refreshing={query.isFetching && Boolean(query.data)}
      help={{
        title: "Which action should I use?",
        body: "Add a cost subtracts money you spent. Plan a payout adds newly received income and divides it between bills, work, savings and safe spending. Do not enter the same payout twice.",
      }}
    >
      <Card>
        <View style={styles.stats}>
          <Stat
            label="Money now"
            value={formatMoney(d.summary.availableBalance)}
            help="Your balance right now"
            style={styles.stat}
          />
          <View style={styles.statDivider} />
          <Stat
            label="Net work earnings"
            value={formatMoney(d.summary.trueNetIncomeWeek)}
            help="This week, after work costs"
            style={styles.stat}
          />
        </View>
      </Card>

      <Card>
        <SectionHeader eyebrow="This week" title="What changed" />
        <SummaryRow label="Money received" value={d.summary.grossIncomeWeek} />
        <SummaryRow
          label="All recorded costs"
          value={-d.summary.allCostsWeek}
        />
        <Divider />
        <SummaryRow
          label="Change this week"
          value={d.summary.cashChangeWeek}
          strong
        />
        <Text style={ui.small}>
          Includes {formatMoney(d.summary.workCostsWeek)} spent on fuel and
          other work costs. Every saved or deleted entry updates these figures.
        </Text>
      </Card>

      <View style={styles.actions}>
        <Button
          title={show ? "Close form" : "Add a cost"}
          tone="quiet"
          icon={show ? X : Plus}
          style={styles.actionButton}
          onPress={toggleForm}
        />
        <Button
          title="Plan a payout"
          tone="accent"
          icon={WalletCards}
          style={styles.actionButton}
          onPress={() => router.push("/split")}
        />
      </View>
      <Notice tone="info">
        New earnings? Plan the payout. It records the income and protects it in
        one step.
      </Notice>
      {saved && (
        <Notice tone="good" live>
          Cost saved. Money now and this week’s figures are updated.
        </Notice>
      )}

      {show && (
        <Card>
          <SectionHeader
            eyebrow="New entry"
            title="Add a cost"
            description="Costs reduce money now as soon as you save them."
          />
          <View style={styles.group}>
            <Label>Entry type</Label>
            <View style={ui.wrap}>
              {kinds.map((item) => (
                <Chip
                  key={item.value}
                  role="radio"
                  label={item.label}
                  selected={kind === item.value}
                  onPress={() => {
                    setKind(item.value);
                    setCategory(defaultCategory[item.value]);
                  }}
                />
              ))}
            </View>
          </View>
          <Field
            label="Amount"
            required
            prefix="₹"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={(value) => {
              setAmount(value);
              if (errors.amount) setErrors((e) => ({ ...e, amount: undefined }));
            }}
            placeholder="500"
            hint="What you paid, in rupees"
            error={errors.amount}
          />
          <Field
            label="Category"
            required
            value={category}
            onChangeText={(value) => {
              setCategory(value);
              if (errors.category)
                setErrors((e) => ({ ...e, category: undefined }));
            }}
            placeholder="Fuel"
            autoCapitalize="words"
            hint="A short name you will recognise later"
            error={errors.category}
          />
          <Field
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="For example, two refills"
          />
          <View style={styles.group}>
            <Label>Payment method</Label>
            <View style={ui.wrap}>
              {methods.map((item) => (
                <Chip
                  key={item}
                  role="radio"
                  label={methodLabel[item]}
                  selected={method === item}
                  onPress={() => setMethod(item)}
                />
              ))}
            </View>
          </View>
          <DateField
            label="Date"
            value={date}
            onChange={(value) => value && setDate(value)}
            maximumDate={new Date()}
          />
          {create.isError && (
            <Notice tone="bad" title="Couldn’t save this cost">
              {create.error instanceof Error
                ? create.error.message
                : "Try again."}
            </Notice>
          )}
          <Button
            title="Save cost"
            tone="accent"
            loading={create.isPending}
            onPress={submit}
          />
        </Card>
      )}

      <Card>
        <Expandable title="Income sources" summary={sourcesSummary}>
          {d.sources.length ? (
            <Card padded={false} tone="plain">
              <View style={styles.insetBody}>
                {d.sources.map((source, index) => {
                  const status =
                    sourceStatus[source.status] ?? {
                      label: humanize(source.status),
                      tone: "neutral" as const,
                    };
                  const mode = source.prototype
                    ? "Simulated"
                    : source.connectionMode === "MANUAL"
                      ? connectionLabel.MANUAL
                      : null;
                  const subtitle = [
                    sourceTypeLabel[source.type] ?? humanize(source.type),
                    frequencyLabel[source.frequency] ??
                      humanize(source.frequency),
                    mode,
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <ListRow
                      key={source.id}
                      icon={sourceTypeIcon[source.type] ?? Wallet}
                      iconTone={source.status === "ACTIVE" ? "accent" : "muted"}
                      title={source.name}
                      subtitle={subtitle}
                      badge={<Badge tone={status.tone} label={status.label} />}
                      last={index === d.sources.length - 1}
                    />
                  );
                })}
              </View>
            </Card>
          ) : (
            <EmptyState
              icon={Wallet}
              title="No income sources yet"
              body="Cash and client income can still be recorded with Plan a payout."
            />
          )}
          <Text style={ui.small}>
            Expected next payout{" "}
            {formatMoneyRange(
              d.summary.expectedPayoutMin,
              d.summary.expectedPayoutMax,
            )}
            . Connections are consent-based; manual and simulated sources are
            labelled.
          </Text>
        </Expandable>
      </Card>

      <Card padded={false}>
        <View style={styles.listHeader}>
          <SectionHeader eyebrow="Recent" title="Money entries" />
        </View>
        <View style={styles.listBody}>
          {remove.isError && (
            <Notice tone="bad" title="Couldn’t remove this entry">
              {remove.error instanceof Error
                ? remove.error.message
                : "Try again."}
            </Notice>
          )}
          {!recent.length ? (
            <EmptyState
              icon={Receipt}
              title="No entries yet"
              body="Plan a payout or add a cost to start your money history."
              action={{ title: "Add a cost", onPress: openForm }}
            />
          ) : (
            recent.map((entry, index) => {
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
              const title =
                entry.category.trim() ||
                kindLabel[entry.kind] ||
                humanize(entry.kind);
              const via = income
                ? entry.sourceName?.trim() || methodName(entry.paymentMethod)
                : methodName(entry.paymentMethod);
              const subtitle = `${kindLabel[entry.kind] ?? humanize(entry.kind)} · ${formatDate(entry.date)} · ${via}`;
              const status =
                entryStatus[entry.status] ?? {
                  label: humanize(entry.status),
                  tone: "neutral" as const,
                };
              const removing =
                remove.isPending && remove.variables === entry.id;
              const actionLabel = entry.payoutSplitId ? "Undo payout" : "Delete";
              return (
                <ListRow
                  key={entry.id}
                  icon={entryIcon(entry)}
                  iconTone={
                    income
                      ? "good"
                      : entry.kind === "WORK_EXPENSE"
                        ? "warn"
                        : "muted"
                  }
                  title={title}
                  subtitle={subtitle}
                  last={index === recent.length - 1}
                  badge={
                    <>
                      <View style={styles.trailing}>
                        <Text
                          style={[
                            styles.entryAmount,
                            ui.num,
                            income && { color: colors.good },
                          ]}
                        >
                          {income ? "+" : "−"}
                          {formatMoney(entry.amount)}
                        </Text>
                        <View style={styles.badgeRight}>
                          <Badge tone={status.tone} label={status.label} />
                        </View>
                      </View>
                      {canRemove ? (
                        removing ? (
                          <View
                            accessible
                            accessibilityLabel={`Removing ${title}`}
                            accessibilityState={{ busy: true }}
                            style={styles.busy}
                          >
                            <ActivityIndicator
                              color={colorString(colors.bad)}
                              size="small"
                            />
                          </View>
                        ) : (
                          <IconButton
                            icon={entry.payoutSplitId ? Undo2 : Trash2}
                            tone="danger"
                            label={`${actionLabel} ${title}`}
                            hint={
                              entry.payoutSplitId
                                ? "Removes this payout and its pocket updates"
                                : "Removes this entry after you confirm"
                            }
                            disabled={remove.isPending}
                            onPress={() => confirmRemove(entry, title)}
                          />
                        )
                      ) : (
                        <View accessible={false} style={styles.spacer} />
                      )}
                    </>
                  }
                >
                  {entry.note ? (
                    <Text numberOfLines={1} style={ui.small}>
                      {entry.note}
                    </Text>
                  ) : null}
                </ListRow>
              );
            })
          )}
        </View>
      </Card>
    </Screen>
  );
}

/** Label on the left, signed money on the right. Sign text pairs with colour. */
function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const color = value > 0 ? colors.good : value < 0 ? colors.bad : colors.ink;
  return (
    <View style={styles.summaryRow}>
      <Text style={[strong ? ui.bodyStrong : ui.body, styles.grow]}>
        {label}
      </Text>
      <Text
        style={[
          styles.summaryValue,
          ui.num,
          strong && styles.summaryValueStrong,
          { color },
        ]}
      >
        {sign}
        {formatMoney(Math.abs(value))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  stat: { flex: 1, minWidth: 0 },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: colors.border,
  },
  summaryRow: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  grow: { flex: 1, minWidth: 0 },
  summaryValue: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    textAlign: "right",
  },
  summaryValueStrong: { fontSize: 18, lineHeight: 24 },
  actions: { flexDirection: "row", gap: 10 },
  actionButton: { flex: 1, alignSelf: "auto" },
  group: { gap: 8 },
  listHeader: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 4 },
  listBody: { paddingHorizontal: 18, paddingBottom: 8, gap: 8 },
  insetBody: { paddingHorizontal: 14 },
  trailing: { alignItems: "flex-end", gap: 4 },
  badgeRight: { flexDirection: "row", justifyContent: "flex-end" },
  entryAmount: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    textAlign: "right",
  },
  busy: {
    width: TOUCH,
    height: TOUCH,
    alignItems: "center",
    justifyContent: "center",
  },
  spacer: { width: TOUCH, height: TOUCH },
});
