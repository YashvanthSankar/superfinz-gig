"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CirclePlus,
  Database,
  Edit3,
  Pause,
  Play,
  RefreshCw,
  Scissors,
  Search,
  ShieldCheck,
  Trash2,
  Unplug,
  X,
} from "lucide-react";
import {
  projectPayoutSplit,
  recommendAdaptiveSplit,
  type CashEntryDto,
  type CashEntryKind,
  type ConnectionMode,
  type GigDashboardDto,
  type SplitPercentages,
} from "@superfinz/shared";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ErrorPanel, LoadingPanel, PageHeading } from "./page-state";
import { jsonRequest, useGigDashboard } from "./use-gig-dashboard";

type Tab = "overview" | "cashbook" | "sources";
type EntryForm = {
  kind: CashEntryKind;
  amount: string;
  sourceId: string;
  category: string;
  paymentMethod: string;
  note: string;
  recurring: boolean;
  date: string;
  time: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const emptyEntry = (): EntryForm => ({
  kind: "WORK_EXPENSE",
  amount: "",
  sourceId: "",
  category: "Fuel",
  paymentMethod: "UPI",
  note: "",
  recurring: false,
  date: today(),
  time: "12:00",
});
const splitFields: Array<[keyof SplitPercentages, string]> = [
  ["essentialsPct", "Essentials"],
  ["workCostsPct", "Work costs"],
  ["emergencyPct", "Cushion"],
  ["longTermPct", "Long-term"],
  ["flexiblePct", "Flexible"],
];
const kindLabels: Record<CashEntryKind, string> = {
  INCOME: "Other income",
  WORK_EXPENSE: "Work expense",
  ESSENTIAL_EXPENSE: "Essential expense",
  FLEXIBLE_EXPENSE: "Flexible expense",
  COMMITMENT_PAYMENT: "Commitment payment",
  POCKET_ALLOCATION: "Pocket allocation",
  TRANSFER: "Transfer",
};
const connectionModes: Array<{ value: ConnectionMode; label: string }> = [
  { value: "MANUAL", label: "Manual source" },
  { value: "SIMULATED_PLATFORM", label: "Simulated platform" },
  { value: "SIMULATED_BANK", label: "Simulated bank" },
  { value: "FILE_IMPORT", label: "File import" },
];

function dateTime(date: string, time: string) {
  return new Date(`${date}T${time || "12:00"}:00`).toISOString();
}
function toEntryForm(item: CashEntryDto): EntryForm {
  const value = new Date(item.date);
  return {
    kind: item.kind,
    amount: String(item.amount),
    sourceId: item.sourceId ?? "",
    category: item.category,
    paymentMethod: item.paymentMethod,
    note: item.note ?? "",
    recurring: item.recurring ?? false,
    date: value.toISOString().slice(0, 10),
    time: value.toTimeString().slice(0, 5),
  };
}

export function IncomeClient() {
  const { dashboard, loading, error, refresh } = useGigDashboard();
  const [tab, setTab] = useState<Tab>("overview");
  const [panel, setPanel] = useState<"entry" | "payout" | "source" | null>(
    null,
  );
  const [entry, setEntry] = useState<EntryForm>(emptyEntry);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [payout, setPayout] = useState({
    sourceId: "",
    amount: "",
    date: today(),
    note: "",
    allocationMode: "ADAPTIVE" as "ADAPTIVE" | "CUSTOM",
  });
  const [customSplit, setCustomSplit] = useState<SplitPercentages | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [source, setSource] = useState({
    name: "",
    type: "PLATFORM_PAYOUT",
    frequency: "WEEKLY",
    typicalMin: "",
    typicalMax: "",
    nextPayoutAt: today(),
    connectionMode: "MANUAL" as ConnectionMode,
  });
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [visible, setVisible] = useState(15);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const analysis = useMemo(
    () =>
      dashboard
        ? buildIncomeAnalysis(
            dashboard.entries,
            dashboard.profile.typicalWeekIncome,
          )
        : null,
    [dashboard],
  );
  const filteredEntries = useMemo(() => {
    if (!dashboard) return [];
    const cutoff =
      dateFilter === "7"
        ? Date.now() - 7 * 86_400_000
        : dateFilter === "30"
          ? Date.now() - 30 * 86_400_000
          : 0;
    const needle = query.trim().toLowerCase();
    return dashboard.entries
      .filter((item) => {
        const matchesText =
          !needle ||
          [item.category, item.sourceName, item.note, item.paymentMethod].some(
            (value) => value?.toLowerCase().includes(needle),
          );
        return (
          matchesText &&
          (kindFilter === "ALL" || item.kind === kindFilter) &&
          (sourceFilter === "ALL" || item.sourceId === sourceFilter) &&
          (!cutoff || new Date(item.date).getTime() >= cutoff)
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dashboard, query, kindFilter, sourceFilter, dateFilter]);

  if (loading) return <LoadingPanel label="Loading income workspace" />;
  if (error || !dashboard || !analysis)
    return <ErrorPanel message={error ?? "No plan found"} retry={refresh} />;

  const activeSources = dashboard.sources.filter(
    (item) => item.status === "ACTIVE",
  );
  const selectedSource =
    activeSources.find((item) => item.id === payout.sourceId) ??
    activeSources[0];
  const payoutAmount = Number(payout.amount) || 0;
  const recommendation = recommendAdaptiveSplit(
    dashboard,
    payoutAmount,
    new Date(`${payout.date}T12:00:00`),
  );
  const defaultSplit: SplitPercentages = {
    essentialsPct: dashboard.splitRule.essentialsPct,
    workCostsPct: dashboard.splitRule.workCostsPct,
    emergencyPct: dashboard.splitRule.emergencyPct,
    longTermPct: dashboard.splitRule.longTermPct,
    flexiblePct: dashboard.splitRule.flexiblePct,
  };
  const custom = customSplit ?? defaultSplit;
  const appliedPercentages =
    payout.allocationMode === "ADAPTIVE" ? recommendation.percentages : custom;
  const customProjection = projectPayoutSplit(
    dashboard,
    payoutAmount,
    custom,
    new Date(`${payout.date}T12:00:00`),
  );
  const projection =
    payout.allocationMode === "ADAPTIVE"
      ? recommendation
      : {
          ...customProjection,
          percentages: custom,
          fundedCommitments: [],
          reasons: ["Custom percentages selected by you."],
        };
  const splitTotal = splitFields.reduce(
    (sum, [key]) => sum + appliedPercentages[key],
    0,
  );

  const closePanel = () => {
    setPanel(null);
    setEditingId(null);
    setActionError(null);
    setConfirmed(false);
  };
  const openEntry = (item?: CashEntryDto) => {
    setActionError(null);
    setMessage(null);
    setEditingId(item?.id ?? null);
    setEntry(item ? toEntryForm(item) : emptyEntry());
    setPanel("entry");
    setTab("cashbook");
  };
  const submitEntry = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setActionError(null);
    setMessage(null);
    try {
      const selected = dashboard.sources.find(
        (item) => item.id === entry.sourceId,
      );
      const payload = {
        kind: entry.kind,
        amount: Number(entry.amount),
        sourceId: entry.sourceId || null,
        sourceName: selected?.name ?? null,
        category: entry.category.trim(),
        paymentMethod: entry.paymentMethod,
        note: entry.note.trim() || null,
        workRelated: entry.kind === "WORK_EXPENSE",
        recurring: entry.recurring,
        status: entry.kind === "INCOME" ? "SETTLED" : "PAID",
        date: dateTime(entry.date, entry.time),
      };
      await jsonRequest(
        editingId ? `/api/gig/entries/${editingId}` : "/api/gig/entries",
        { method: editingId ? "PATCH" : "POST", body: JSON.stringify(payload) },
      );
      closePanel();
      setMessage(
        editingId
          ? "Entry corrected. Balance and pockets were recalculated."
          : "Cashbook entry saved.",
      );
      await refresh();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not save entry",
      );
    } finally {
      setBusy(false);
    }
  };
  const submitPayout = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSource) return;
    setBusy(true);
    setActionError(null);
    setMessage(null);
    try {
      await jsonRequest("/api/gig/split", {
        method: "POST",
        body: JSON.stringify({
          sourceId: selectedSource.id,
          sourceName: selectedSource.name,
          amount: payoutAmount,
          receivedAt: new Date(`${payout.date}T12:00:00`).toISOString(),
          note: payout.note.trim() || null,
          allocationMode: payout.allocationMode,
          percentages: appliedPercentages,
        }),
      });
      setPayout({
        sourceId: "",
        amount: "",
        date: today(),
        note: "",
        allocationMode: "ADAPTIVE",
      });
      setCustomSplit(null);
      closePanel();
      setMessage(
        "Payout recorded and all five planning pockets updated together.",
      );
      await refresh();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not split payout",
      );
    } finally {
      setBusy(false);
    }
  };
  const submitSource = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setActionError(null);
    setMessage(null);
    try {
      const connected = source.connectionMode.startsWith("SIMULATED");
      await jsonRequest("/api/gig/sources", {
        method: "POST",
        body: JSON.stringify({
          name: source.name.trim(),
          type: source.type,
          frequency: source.frequency,
          typicalMin: Number(source.typicalMin),
          typicalMax: Number(source.typicalMax),
          nextPayoutAt: new Date(
            `${source.nextPayoutAt}T12:00:00`,
          ).toISOString(),
          connectionMode: source.connectionMode,
          prototype: true,
          ...(connected
            ? {
                dataTypes: [
                  "Settled payouts",
                  "Payout dates",
                  "Platform deductions",
                ],
                purpose: "Build an income forecast and safe-to-spend plan",
                consentFrom: new Date(
                  Date.now() - 90 * 86_400_000,
                ).toISOString(),
                consentTo: new Date().toISOString(),
              }
            : {}),
        }),
      });
      setSource({
        name: "",
        type: "PLATFORM_PAYOUT",
        frequency: "WEEKLY",
        typicalMin: "",
        typicalMax: "",
        nextPayoutAt: today(),
        connectionMode: "MANUAL",
      });
      closePanel();
      setMessage(
        connected
          ? "Simulated source connected with a consent receipt."
          : "Manual income source added.",
      );
      await refresh();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not add source",
      );
    } finally {
      setBusy(false);
    }
  };
  const remove = async (item: CashEntryDto) => {
    if (item.payoutSplitId) {
      setActionError(
        "Smart Split payouts are protected because deleting one would change all five pockets. Add a correction entry instead.",
      );
      return;
    }
    if (
      !window.confirm(
        `Delete ${item.category} for ${formatCurrency(item.amount)}? Its balance effect will be reversed.`,
      )
    )
      return;
    setBusy(true);
    setActionError(null);
    try {
      await jsonRequest(`/api/gig/entries/${item.id}`, { method: "DELETE" });
      setMessage("Entry deleted and its balance effect reversed.");
      await refresh();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not delete entry",
      );
    } finally {
      setBusy(false);
    }
  };
  const updateSource = async (
    id: string,
    action: "ACTIVE" | "PAUSED" | "REVOKED" | "REFRESH",
  ) => {
    setBusy(true);
    setActionError(null);
    setMessage(null);
    try {
      await jsonRequest("/api/gig/sources", {
        method: "PATCH",
        body: JSON.stringify(
          action === "REFRESH" ? { id, action } : { id, status: action },
        ),
      });
      setMessage(
        action === "REFRESH"
          ? "Source refreshed. Forecast freshness updated."
          : `Source ${action.toLowerCase()}.`,
      );
      await refresh();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not update source",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Your money"
        title="See what you actually kept."
        copy="Add income and work costs. SuperFinz shows what remains after fuel, fees, and other earning costs."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openEntry()}
              className="brut-btn min-h-12 bg-paper"
            >
              <CirclePlus aria-hidden size={17} />
              Add entry
            </button>
            <button
              type="button"
              onClick={() => {
                setPanel("payout");
                setTab("cashbook");
                setConfirmed(false);
              }}
              className="brut-btn min-h-12 bg-accent text-paper"
            >
              <Scissors aria-hidden size={17} />
              Record payout
            </button>
          </div>
        }
      />
      <nav
        aria-label="Income sections"
        className="grid grid-cols-3 border-2 border-ink bg-paper"
      >
        {(["overview", "cashbook", "sources"] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            aria-current={tab === item ? "page" : undefined}
            onClick={() => {
              setTab(item);
              setPanel(null);
            }}
            className={`min-h-12 border-r-2 border-ink px-3 text-xs font-black uppercase tracking-wider last:border-r-0 ${tab === item ? "bg-ink text-paper" : "hover:bg-paper-2"}`}
          >
            {item}
          </button>
        ))}
      </nav>
      {message && (
        <p
          role="status"
          className="border-2 border-good bg-good-soft p-3 text-sm font-bold text-good"
        >
          {message}
        </p>
      )}
      {actionError && !panel && <ActionError message={actionError} />}
      {tab === "overview" && (
        <Overview
          dashboard={dashboard}
          analysis={analysis}
          onPayout={() => {
            setPanel("payout");
            setTab("cashbook");
          }}
        />
      )}
      {tab === "cashbook" && (
        <div className="space-y-5">
          {panel === "entry" && (
            <EntryPanel
              dashboard={dashboard}
              entry={entry}
              setEntry={setEntry}
              editing={Boolean(editingId)}
              busy={busy}
              error={actionError}
              onClose={closePanel}
              onSubmit={submitEntry}
            />
          )}
          {panel === "payout" && (
            <PayoutPanel
              activeSources={activeSources}
              selectedSourceId={selectedSource?.id ?? ""}
              payout={payout}
              setPayout={setPayout}
              payoutAmount={payoutAmount}
              allocation={appliedPercentages}
              custom={custom}
              setCustom={setCustomSplit}
              splitTotal={splitTotal}
              projection={projection}
              confirmed={confirmed}
              setConfirmed={setConfirmed}
              busy={busy}
              error={actionError}
              onClose={closePanel}
              onSubmit={submitPayout}
            />
          )}
          <Cashbook
            dashboard={dashboard}
            entries={filteredEntries}
            visible={visible}
            busy={busy}
            query={query}
            setQuery={setQuery}
            kindFilter={kindFilter}
            setKindFilter={setKindFilter}
            sourceFilter={sourceFilter}
            setSourceFilter={setSourceFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            openEntry={openEntry}
            remove={remove}
            loadMore={() => setVisible((value) => value + 15)}
          />
        </div>
      )}
      {tab === "sources" && (
        <Sources
          dashboard={dashboard}
          panel={panel}
          source={source}
          setSource={setSource}
          busy={busy}
          error={actionError}
          closePanel={closePanel}
          submitSource={submitSource}
          openPanel={() => setPanel("source")}
          updateSource={updateSource}
        />
      )}
    </div>
  );
}

function EntryPanel({
  dashboard,
  entry,
  setEntry,
  editing,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  dashboard: GigDashboardDto;
  entry: EntryForm;
  setEntry: React.Dispatch<React.SetStateAction<EntryForm>>;
  editing: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <section className="brut-card-lg p-5 sm:p-6">
      <PanelHeader
        eyebrow={editing ? "Edit money entry" : "Add money entry"}
        title={editing ? "Fix this entry." : "What did you earn or spend?"}
        onClose={onClose}
      />
      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <SelectField
          label="Entry type"
          value={entry.kind}
          onChange={(value) => {
            const kind = value as CashEntryKind;
            setEntry((current) => ({
              ...current,
              kind,
              category:
                kind === "INCOME"
                  ? "Payout"
                  : kind === "WORK_EXPENSE"
                    ? "Fuel"
                    : kind === "ESSENTIAL_EXPENSE"
                      ? "Groceries"
                      : "Personal",
            }));
          }}
        >
          {(
            [
              "INCOME",
              "WORK_EXPENSE",
              "ESSENTIAL_EXPENSE",
              "FLEXIBLE_EXPENSE",
            ] as CashEntryKind[]
          ).map((kind) => (
            <option key={kind} value={kind}>
              {kindLabels[kind]}
            </option>
          ))}
        </SelectField>
        <Field
          label="Amount"
          type="number"
          value={entry.amount}
          onChange={(value) =>
            setEntry((current) => ({ ...current, amount: value }))
          }
        />
        <SelectField
          label="Income source"
          value={entry.sourceId}
          onChange={(value) =>
            setEntry((current) => ({ ...current, sourceId: value }))
          }
        >
          <option value="">None / cash</option>
          {dashboard.sources.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </SelectField>
        <Field
          label="Category"
          value={entry.category}
          onChange={(value) =>
            setEntry((current) => ({ ...current, category: value }))
          }
        />
        <SelectField
          label="Payment method"
          value={entry.paymentMethod}
          onChange={(value) =>
            setEntry((current) => ({ ...current, paymentMethod: value }))
          }
        >
          {["UPI", "CASH", "BANK", "CARD", "PLATFORM"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </SelectField>
        <Field
          label="Date"
          type="date"
          value={entry.date}
          onChange={(value) =>
            setEntry((current) => ({ ...current, date: value }))
          }
        />
        <Field
          label="Time"
          type="time"
          value={entry.time}
          onChange={(value) =>
            setEntry((current) => ({ ...current, time: value }))
          }
        />
        <Field
          label="Note (optional)"
          value={entry.note}
          onChange={(value) =>
            setEntry((current) => ({ ...current, note: value }))
          }
          className="lg:col-span-2"
        />
        <label className="flex min-h-12 items-center gap-3 border-2 border-ink bg-paper px-3 font-black">
          <input
            type="checkbox"
            checked={entry.recurring}
            onChange={(event) =>
              setEntry((current) => ({
                ...current,
                recurring: event.target.checked,
              }))
            }
            className="h-6 w-6 accent-accent"
          />
          Repeats regularly
        </label>
        {error && <ActionError message={error} />}
        <button
          disabled={busy || Number(entry.amount) <= 0 || !entry.category.trim()}
          className="brut-btn min-h-12 bg-ink text-paper sm:col-span-2 lg:col-span-3"
        >
          {busy
            ? "Saving…"
            : editing
              ? "Save correction"
              : "Save settled entry"}
        </button>
      </form>
    </section>
  );
}

type Projection = ReturnType<typeof recommendAdaptiveSplit>;
function PayoutPanel({
  activeSources,
  selectedSourceId,
  payout,
  setPayout,
  payoutAmount,
  allocation,
  custom,
  setCustom,
  splitTotal,
  projection,
  confirmed,
  setConfirmed,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  activeSources: GigDashboardDto["sources"];
  selectedSourceId: string;
  payout: {
    sourceId: string;
    amount: string;
    date: string;
    note: string;
    allocationMode: "ADAPTIVE" | "CUSTOM";
  };
  setPayout: React.Dispatch<React.SetStateAction<typeof payout>>;
  payoutAmount: number;
  allocation: SplitPercentages;
  custom: SplitPercentages;
  setCustom: React.Dispatch<React.SetStateAction<SplitPercentages | null>>;
  splitTotal: number;
  projection: Projection;
  confirmed: boolean;
  setConfirmed: (value: boolean) => void;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <section className="brut-card-lg bg-accent-soft p-5 sm:p-6">
      <PanelHeader
        eyebrow="Plan this payout"
        title="Protect the important things first."
        onClose={onClose}
      />
      <form onSubmit={onSubmit} className="mt-6 grid gap-4 lg:grid-cols-2">
        <SelectField
          label="Active income source"
          value={selectedSourceId}
          onChange={(value) =>
            setPayout((current) => ({ ...current, sourceId: value }))
          }
        >
          {activeSources.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </SelectField>
        <Field
          label="Settled payout amount"
          type="number"
          value={payout.amount}
          onChange={(value) => {
            setPayout((current) => ({ ...current, amount: value }));
            setConfirmed(false);
          }}
        />
        <Field
          label="Received date"
          type="date"
          value={payout.date}
          onChange={(value) =>
            setPayout((current) => ({ ...current, date: value }))
          }
        />
        <Field
          label="Note (optional)"
          value={payout.note}
          onChange={(value) =>
            setPayout((current) => ({ ...current, note: value }))
          }
        />
        <div className="border-2 border-ink bg-paper p-4 lg:col-span-2">
          <p className="brut-label">Choose how to split</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <ModeButton
              active={payout.allocationMode === "ADAPTIVE"}
              title="Recommended"
              copy="Protects your next bills, work costs, and emergency cushion first."
              onClick={() => {
                setPayout((current) => ({
                  ...current,
                  allocationMode: "ADAPTIVE",
                }));
                setConfirmed(false);
              }}
            />
            <ModeButton
              active={payout.allocationMode === "CUSTOM"}
              title="Custom"
              copy="Choose your own percentages. They must total 100%."
              onClick={() => {
                setPayout((current) => ({
                  ...current,
                  allocationMode: "CUSTOM",
                }));
                setConfirmed(false);
              }}
            />
          </div>
        </div>
        {payout.allocationMode === "CUSTOM" && (
          <div className="grid gap-3 border-2 border-ink bg-paper p-4 sm:grid-cols-5 lg:col-span-2">
            {splitFields.map(([key, label]) => (
              <Field
                key={key}
                label={`${label} %`}
                type="number"
                value={String(custom[key])}
                onChange={(value) =>
                  setCustom((current) => ({
                    ...(current ?? custom),
                    [key]: Number(value),
                  }))
                }
              />
            ))}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink pt-3 sm:col-span-5">
              <strong
                className={
                  Math.abs(splitTotal - 100) < 0.001 ? "text-good" : "text-bad"
                }
              >
                Total {splitTotal.toFixed(2)}%
              </strong>
              <button
                type="button"
                onClick={() => setCustom(null)}
                className="brut-btn min-h-11 bg-paper"
              >
                Reset to default
              </button>
            </div>
          </div>
        )}
        {payoutAmount > 0 && (
          <div className="border-2 border-ink bg-paper p-4 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="brut-label">Review every rupee</p>
                <h3 className="mt-1 text-xl font-black">
                  {payout.allocationMode === "ADAPTIVE"
                    ? "Recommended for today"
                    : "Your custom allocation"}
                </h3>
              </div>
              <span className="brut-stamp bg-good-soft">
                Totals {formatCurrency(payoutAmount)}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              {splitFields.map(([key, label]) => {
                const amountKey =
                  key === "essentialsPct"
                    ? "essentials"
                    : key === "workCostsPct"
                      ? "workCosts"
                      : key === "emergencyPct"
                        ? "emergency"
                        : key === "longTermPct"
                          ? "longTerm"
                          : "flexible";
                return (
                  <div key={key} className="border-t-2 border-ink pt-2">
                    <p className="text-xs font-bold text-ink-soft">
                      {label} · {allocation[key].toFixed(1)}%
                    </p>
                    <p className="num mt-1 text-lg font-black">
                      {formatCurrency(projection.amounts[amountKey])}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 grid gap-3 border-t-2 border-ink pt-4 sm:grid-cols-2">
              <Compare
                label="Safe to spend"
                before={projection.beforeSafeAmount}
                after={projection.afterSafeAmount}
                money
              />
              <Compare
                label="Protected days"
                before={projection.beforeProtectedDays}
                after={projection.afterProtectedDays}
              />
            </div>
            <ul className="mt-4 space-y-2 text-sm font-semibold">
              {projection.reasons.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <ShieldCheck
                    aria-hidden
                    size={17}
                    className="mt-0.5 shrink-0 text-good"
                  />
                  {reason}
                </li>
              ))}
            </ul>
            {projection.fundedCommitments.length > 0 && (
              <p className="mt-3 border-2 border-good bg-good-soft p-3 text-sm font-bold">
                Protects:{" "}
                {projection.fundedCommitments
                  .map((item) => `${item.title} ${formatCurrency(item.amount)}`)
                  .join(" · ")}
              </p>
            )}
          </div>
        )}
        <label className="flex min-h-12 items-center gap-3 border-2 border-ink bg-paper px-3 font-black lg:col-span-2">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="h-6 w-6 accent-accent"
          />
          I reviewed the allocation. This records a plan and does not move bank
          money.
        </label>
        {error && <ActionError message={error} />}
        <button
          disabled={
            busy ||
            payoutAmount <= 0 ||
            !selectedSourceId ||
            Math.abs(splitTotal - 100) >= 0.001 ||
            !confirmed
          }
          className="brut-btn min-h-12 bg-ink text-paper lg:col-span-2"
        >
          {busy ? "Applying…" : "Confirm payout and split"}
        </button>
      </form>
    </section>
  );
}

function Cashbook({
  dashboard,
  entries,
  visible,
  busy,
  query,
  setQuery,
  kindFilter,
  setKindFilter,
  sourceFilter,
  setSourceFilter,
  dateFilter,
  setDateFilter,
  openEntry,
  remove,
  loadMore,
}: {
  dashboard: GigDashboardDto;
  entries: CashEntryDto[];
  visible: number;
  busy: boolean;
  query: string;
  setQuery: (value: string) => void;
  kindFilter: string;
  setKindFilter: (value: string) => void;
  sourceFilter: string;
  setSourceFilter: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
  openEntry: (item?: CashEntryDto) => void;
  remove: (item: CashEntryDto) => Promise<void>;
  loadMore: () => void;
}) {
  return (
    <section className="brut-card overflow-hidden">
      <div className="grid gap-3 border-b-2 border-ink bg-paper-2 p-4 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
        <label className="relative">
          <span className="sr-only">Search cashbook</span>
          <Search aria-hidden size={17} className="absolute left-3 top-3.5" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search category, note or method"
            className="min-h-12 w-full border-2 border-ink bg-paper pl-10 pr-3 text-base font-bold"
          />
        </label>
        <Filter value={kindFilter} onChange={setKindFilter} label="Type">
          <option value="ALL">All types</option>
          {(
            [
              "INCOME",
              "WORK_EXPENSE",
              "ESSENTIAL_EXPENSE",
              "FLEXIBLE_EXPENSE",
            ] as CashEntryKind[]
          ).map((item) => (
            <option key={item} value={item}>
              {kindLabels[item]}
            </option>
          ))}
        </Filter>
        <Filter value={sourceFilter} onChange={setSourceFilter} label="Source">
          <option value="ALL">All sources</option>
          {dashboard.sources.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Filter>
        <Filter value={dateFilter} onChange={setDateFilter} label="Date">
          <option value="ALL">All dates</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </Filter>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/30 px-4 py-3">
        <div>
          <p className="brut-label">Settled cashbook</p>
          <p className="text-sm font-bold text-ink-soft">
            {entries.length} matching entries · newest first
          </p>
        </div>
        <button
          type="button"
          onClick={() => openEntry()}
          className="brut-btn min-h-11 bg-paper"
        >
          <CirclePlus size={16} />
          Add
        </button>
      </div>
      {entries.length === 0 ? (
        <Empty copy="Try clearing filters or add the first settled entry." />
      ) : (
        <div>
          {entries.slice(0, visible).map((item) => {
            const incoming = item.kind === "INCOME";
            const locked = Boolean(item.payoutSplitId || item.commitmentId);
            return (
              <article
                key={item.id}
                className="grid min-h-20 grid-cols-[44px_1fr_auto] items-center gap-3 border-b border-ink/30 px-4 py-3 last:border-b-0 sm:grid-cols-[44px_1fr_auto_auto]"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center border-2 border-ink ${incoming ? "bg-good-soft" : "bg-warn-soft"}`}
                >
                  {incoming ? (
                    <ArrowDownLeft aria-hidden size={18} />
                  ) : (
                    <ArrowUpRight aria-hidden size={18} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black">
                      {item.sourceName ?? item.category}
                    </p>
                    {item.recurring && (
                      <span className="brut-stamp bg-paper-2">Recurring</span>
                    )}
                    {locked && (
                      <span className="brut-stamp bg-accent-soft">Linked</span>
                    )}
                  </div>
                  <p className="truncate text-xs font-semibold text-ink-soft">
                    {kindLabels[item.kind]} · {formatDate(item.date)} ·{" "}
                    {item.paymentMethod}
                    {item.note ? ` · ${item.note}` : ""}
                  </p>
                </div>
                <p
                  className={`num whitespace-nowrap text-lg font-black ${incoming ? "text-good" : "text-bad"}`}
                >
                  {incoming ? "+" : "−"}
                  {formatCurrency(item.amount)}
                </p>
                <div className="col-start-2 flex justify-end gap-1 sm:col-start-auto">
                  {!locked && (
                    <button
                      type="button"
                      aria-label={`Edit ${item.category}`}
                      onClick={() => openEntry(item)}
                      className="flex h-11 w-11 items-center justify-center border-2 border-transparent hover:border-ink"
                    >
                      <Edit3 aria-hidden size={17} />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Delete ${item.category}`}
                    onClick={() => void remove(item)}
                    disabled={busy}
                    className="flex h-11 w-11 items-center justify-center border-2 border-transparent text-bad hover:border-ink hover:bg-bad-soft"
                  >
                    <Trash2 aria-hidden size={17} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {visible < entries.length && (
        <button
          type="button"
          onClick={loadMore}
          className="min-h-12 w-full border-t-2 border-ink bg-paper-2 text-xs font-black uppercase tracking-wider"
        >
          Load 15 more
        </button>
      )}
    </section>
  );
}

function Sources({
  dashboard,
  panel,
  source,
  setSource,
  busy,
  error,
  closePanel,
  submitSource,
  openPanel,
  updateSource,
}: {
  dashboard: GigDashboardDto;
  panel: string | null;
  source: {
    name: string;
    type: string;
    frequency: string;
    typicalMin: string;
    typicalMax: string;
    nextPayoutAt: string;
    connectionMode: ConnectionMode;
  };
  setSource: React.Dispatch<React.SetStateAction<typeof source>>;
  busy: boolean;
  error: string | null;
  closePanel: () => void;
  submitSource: (event: FormEvent) => void;
  openPanel: () => void;
  updateSource: (
    id: string,
    action: "ACTIVE" | "PAUSED" | "REVOKED" | "REFRESH",
  ) => Promise<void>;
}) {
  return (
    <div className="space-y-5">
      {panel === "source" && (
        <section className="brut-card-lg p-5 sm:p-6">
          <PanelHeader
            eyebrow="New income source"
            title="Add only what helps the plan."
            onClose={closePanel}
          />
          <form
            onSubmit={submitSource}
            className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <Field
              label="Source name"
              value={source.name}
              onChange={(value) =>
                setSource((current) => ({ ...current, name: value }))
              }
            />
            <SelectField
              label="Source type"
              value={source.type}
              onChange={(value) =>
                setSource((current) => ({ ...current, type: value }))
              }
            >
              {[
                "PLATFORM_PAYOUT",
                "DIRECT_UPI",
                "BANK_TRANSFER",
                "CASH",
                "OTHER",
              ].map((item) => (
                <option key={item}>{item.replaceAll("_", " ")}</option>
              ))}
            </SelectField>
            <SelectField
              label="How often paid"
              value={source.frequency}
              onChange={(value) =>
                setSource((current) => ({ ...current, frequency: value }))
              }
            >
              {["DAILY", "WEEKLY", "FORTNIGHTLY", "MONTHLY", "IRREGULAR"].map(
                (item) => (
                  <option key={item}>{item}</option>
                ),
              )}
            </SelectField>
            <Field
              label="Typical minimum"
              type="number"
              value={source.typicalMin}
              onChange={(value) =>
                setSource((current) => ({ ...current, typicalMin: value }))
              }
            />
            <Field
              label="Typical maximum"
              type="number"
              value={source.typicalMax}
              onChange={(value) =>
                setSource((current) => ({ ...current, typicalMax: value }))
              }
            />
            <Field
              label="Next likely payout"
              type="date"
              value={source.nextPayoutAt}
              onChange={(value) =>
                setSource((current) => ({ ...current, nextPayoutAt: value }))
              }
            />
            <SelectField
              label="Connection method"
              value={source.connectionMode}
              onChange={(value) =>
                setSource((current) => ({
                  ...current,
                  connectionMode: value as ConnectionMode,
                }))
              }
            >
              {connectionModes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </SelectField>
            {source.connectionMode.startsWith("SIMULATED") && (
              <div className="border-2 border-ink bg-good-soft p-4 sm:col-span-2">
                <p className="brut-label">Consent before connection</p>
                <p className="mt-2 text-sm font-semibold">
                  Data: settled payouts, payout dates and platform deductions.
                  Purpose: forecast income and calculate safe-to-spend. History:
                  last 90 days. You can pause or revoke this any time.
                </p>
                <p className="mt-2 text-xs font-black uppercase">
                  Hackathon simulator — no external account is contacted.
                </p>
              </div>
            )}
            {error && <ActionError message={error} />}
            <button
              disabled={
                busy ||
                !source.name.trim() ||
                Number(source.typicalMax) < Number(source.typicalMin)
              }
              className="brut-btn min-h-12 bg-ink text-paper sm:col-span-2 lg:col-span-3"
            >
              {busy
                ? "Adding…"
                : source.connectionMode.startsWith("SIMULATED")
                  ? "Consent and connect simulation"
                  : "Add source"}
            </button>
          </form>
        </section>
      )}
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="brut-label">Source control center</p>
          <p className="mt-1 font-semibold text-ink-soft">
            Pause, refresh, or revoke every source independently.
          </p>
        </div>
        <button
          type="button"
          onClick={openPanel}
          className="brut-btn min-h-12 bg-accent text-paper"
        >
          <CirclePlus size={17} />
          Add source
        </button>
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        {dashboard.sources.map((item) => (
          <article key={item.id} className="brut-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black">{item.name}</h2>
                  <span
                    className={`brut-stamp ${item.status === "ACTIVE" ? "bg-good-soft" : item.status === "REVOKED" ? "bg-bad-soft" : "bg-warn-soft"}`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-ink-soft">
                  {item.frequency.toLowerCase()} ·{" "}
                  {formatCurrency(item.typicalMin)}–
                  {formatCurrency(item.typicalMax)}
                </p>
              </div>
              <Database aria-hidden size={23} />
            </div>
            <dl className="mt-4 grid gap-2 border-y-2 border-ink py-4 text-sm">
              <Row
                label="Connection"
                value={item.connectionMode.toLowerCase().replaceAll("_", " ")}
              />
              <Row
                label="Last refresh"
                value={
                  item.lastSyncAt
                    ? new Date(item.lastSyncAt).toLocaleString("en-IN")
                    : "Manual — no sync"
                }
              />
              <Row
                label="Next payout"
                value={
                  item.nextPayoutAt ? formatDate(item.nextPayoutAt) : "Not set"
                }
              />
            </dl>
            {item.consentReceiptId && (
              <details className="mt-4 border-2 border-ink bg-paper-2 p-3">
                <summary className="cursor-pointer text-xs font-black uppercase tracking-wider">
                  Consent receipt {item.consentReceiptId}
                </summary>
                <div className="mt-3 space-y-2 text-xs font-semibold">
                  <p>
                    <strong>Purpose:</strong> {item.purpose}
                  </p>
                  <p>
                    <strong>Data:</strong> {item.dataTypes?.join(", ")}
                  </p>
                  <p>
                    <strong>Period:</strong>{" "}
                    {item.consentFrom ? formatDate(item.consentFrom) : "—"} to{" "}
                    {item.consentTo ? formatDate(item.consentTo) : "—"}
                  </p>
                  <p>
                    <strong>Consent expires:</strong>{" "}
                    {item.consentExpiresAt
                      ? formatDate(item.consentExpiresAt)
                      : "—"}
                  </p>
                </div>
              </details>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {item.status === "ACTIVE" && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void updateSource(item.id, "REFRESH")}
                    className="brut-btn min-h-11 bg-paper"
                  >
                    <RefreshCw size={16} />
                    Refresh
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void updateSource(item.id, "PAUSED")}
                    className="brut-btn min-h-11 bg-warn-soft"
                  >
                    <Pause size={16} />
                    Pause
                  </button>
                </>
              )}
              {item.status === "PAUSED" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void updateSource(item.id, "ACTIVE")}
                  className="brut-btn min-h-11 bg-good-soft"
                >
                  <Play size={16} />
                  Resume
                </button>
              )}
              <button
                type="button"
                disabled={busy || item.status === "REVOKED"}
                onClick={() =>
                  window.confirm(
                    `Revoke ${item.name}? Future payouts will leave the forecast.`,
                  ) && void updateSource(item.id, "REVOKED")
                }
                className="brut-btn min-h-11 bg-bad-soft text-bad"
              >
                <Unplug size={16} />
                Revoke
              </button>
            </div>
          </article>
        ))}
      </section>
      <section className="border-2 border-ink bg-ink p-5 text-paper">
        <p className="brut-label !text-paper-2">Clear data boundary</p>
        <p className="mt-2 text-sm font-semibold text-paper-2">
          Only payout amounts, dates and deductions are used. Contacts,
          messages, call history, photos and social data are never requested.
        </p>
      </section>
    </div>
  );
}

function Overview({
  dashboard,
  analysis,
  onPayout,
}: {
  dashboard: GigDashboardDto;
  analysis: ReturnType<typeof buildIncomeAnalysis>;
  onPayout: () => void;
}) {
  const sourceMax = Math.max(
    1,
    ...analysis.bySource.map((item) => item.amount),
  );
  const dayMax = Math.max(1, ...analysis.byDay.map((item) => item.amount));
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Gross this week"
          value={formatCurrency(dashboard.summary.grossIncomeWeek)}
          detail={`${Math.round(dashboard.summary.typicalWeekDeltaPct)}% vs typical net`}
        />
        <Stat
          label="Cost to earn"
          value={formatCurrency(dashboard.summary.workCostsWeek)}
          detail={`${dashboard.summary.workCostRatioPct.toFixed(1)}% of gross`}
          tone="warn"
        />
        <Stat
          label="True take-home"
          value={formatCurrency(dashboard.summary.trueNetIncomeWeek)}
          detail="Gross minus work costs"
          tone="good"
        />
        <Stat
          label="Today · active sources"
          value={`${formatCurrency(dashboard.summary.todayGrossIncome)} · ${dashboard.summary.activeSourceCount}`}
          detail={`Fresh ${new Date(dashboard.summary.dataFreshnessAt).toLocaleString("en-IN")}`}
        />
      </section>
      <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <article className="brut-card p-5">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <p className="brut-label">12-week earning pattern</p>
              <h2 className="mt-1 text-xl font-black">Gross versus true net</h2>
            </div>
            <div className="flex gap-3 text-xs font-bold">
              <span>
                <i className="mr-1 inline-block h-3 w-3 bg-accent" />
                Gross
              </span>
              <span>
                <i className="mr-1 inline-block h-3 w-3 bg-good" />
                Net
              </span>
            </div>
          </div>
          <div
            className="mt-6 flex h-52 items-end gap-2 overflow-x-auto border-b-2 border-ink px-1"
            role="img"
            aria-label="Twelve week gross and true net income bar chart"
          >
            {analysis.weeks.map((week) => (
              <div
                key={week.label}
                className="flex min-w-10 flex-1 flex-col items-center justify-end"
              >
                <div className="flex h-40 items-end gap-1">
                  <span
                    className="w-3 bg-accent"
                    style={{
                      height: `${(week.gross / analysis.weekMax) * 100}%`,
                    }}
                    title={`${week.label} gross ${formatCurrency(week.gross)}`}
                  />
                  <span
                    className="w-3 bg-good"
                    style={{
                      height: `${Math.max(1, (week.net / analysis.weekMax) * 100)}%`,
                    }}
                    title={`${week.label} net ${formatCurrency(week.net)}`}
                  />
                </div>
                <span className="mt-2 text-[9px] font-black uppercase">
                  {week.label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs font-semibold text-ink-soft">
            Net subtracts recorded work expenses from settled income.
          </p>
        </article>
        <article className="brut-card bg-accent-soft p-5">
          <p className="brut-label">Next expected payout</p>
          <p className="num mt-2 text-3xl font-black">
            {formatCurrency(dashboard.summary.expectedPayoutMin)}–
            {formatCurrency(dashboard.summary.expectedPayoutMax)}
          </p>
          <p className="mt-2 text-sm font-semibold">
            Expected around {formatDate(dashboard.summary.safeUntil)}. It is not
            included in today’s balance.
          </p>
          <button
            type="button"
            onClick={onPayout}
            className="brut-btn mt-5 min-h-12 w-full bg-ink text-paper"
          >
            <Scissors size={17} />
            Record when settled
          </button>
        </article>
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <BarList
          title="Best earning days"
          rows={analysis.byDay}
          max={dayMax}
          color="bg-accent"
        />
        <BarList
          title="Source contribution"
          rows={analysis.bySource}
          max={sourceMax}
          color="bg-good"
        />
      </section>
      {dashboard.summary.workCostRatioPct > 25 && (
        <section className="border-2 border-warn bg-warn-soft p-4">
          <p className="font-black">
            Work costs are {dashboard.summary.workCostRatioPct.toFixed(1)}% of
            this week’s gross income.
          </p>
          <p className="mt-1 text-sm font-semibold">
            Check fuel, fees and maintenance entries before deciding your true
            take-home.
          </p>
        </section>
      )}
    </div>
  );
}

function buildIncomeAnalysis(entries: CashEntryDto[], typicalWeek: number) {
  const weeks = Array.from({ length: 12 }, (_, index) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    end.setDate(end.getDate() - (11 - index) * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const rows = entries.filter((item) => {
      const time = new Date(item.date);
      return time >= start && time <= end;
    });
    const gross = rows
      .filter((item) => item.kind === "INCOME" && item.status === "SETTLED")
      .reduce((sum, item) => sum + item.amount, 0);
    const costs = rows
      .filter((item) => item.kind === "WORK_EXPENSE" && item.status === "PAID")
      .reduce((sum, item) => sum + item.amount, 0);
    return {
      label: start.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      gross,
      net: Math.max(0, gross - costs),
    };
  });
  const byDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
    (label, index) => ({
      label,
      amount: entries
        .filter(
          (item) =>
            item.kind === "INCOME" && new Date(item.date).getDay() === index,
        )
        .reduce((sum, item) => sum + item.amount, 0),
    }),
  );
  const sourceMap = new Map<string, number>();
  entries
    .filter((item) => item.kind === "INCOME")
    .forEach((item) =>
      sourceMap.set(
        item.sourceName ?? "Other",
        (sourceMap.get(item.sourceName ?? "Other") ?? 0) + item.amount,
      ),
    );
  return {
    weeks,
    weekMax: Math.max(typicalWeek, 1, ...weeks.map((item) => item.gross)),
    byDay,
    bySource: [...sourceMap]
      .map(([label, amount]) => ({ label, amount }))
      .sort((a, b) => b.amount - a.amount),
  };
}

function BarList({
  title,
  rows,
  max,
  color,
}: {
  title: string;
  rows: Array<{ label: string; amount: number }>;
  max: number;
  color: string;
}) {
  return (
    <article className="brut-card p-5">
      <p className="brut-label">{title}</p>
      <div className="mt-5 space-y-3">
        {rows.length ? (
          rows.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-[5rem_1fr_auto] items-center gap-3"
            >
              <strong className="truncate text-xs">{item.label}</strong>
              <div className="h-4 border-2 border-ink bg-paper-2">
                <div
                  className={`h-full ${color}`}
                  style={{ width: `${(item.amount / max) * 100}%` }}
                />
              </div>
              <span className="num text-xs font-black">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm font-semibold text-ink-soft">
            Record settled income to see this pattern.
          </p>
        )}
      </div>
    </article>
  );
}
function Stat({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "warn" | "good";
}) {
  return (
    <div
      className={`brut-card p-5 ${tone === "warn" ? "bg-warn-soft" : tone === "good" ? "bg-good-soft" : ""}`}
    >
      <p className="brut-label">{label}</p>
      <p className="num mt-2 text-2xl font-black">{value}</p>
      <p className="mt-2 text-xs font-semibold text-ink-soft">{detail}</p>
    </div>
  );
}
function PanelHeader({
  eyebrow,
  title,
  onClose,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex justify-between gap-3">
      <div>
        <p className="brut-label">{eyebrow}</p>
        <h2 className="brut-display mt-1 text-3xl">{title}</h2>
      </div>
      <button
        type="button"
        aria-label="Close form"
        onClick={onClose}
        className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-ink bg-paper"
      >
        <X aria-hidden size={19} />
      </button>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="brut-label">{label}</span>
      <input
        type={type}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 border-2 border-ink bg-paper px-3 text-base font-bold outline-none focus:ring-4 focus:ring-accent/30"
        required={!label.includes("optional")}
      />
    </label>
  );
}
function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="brut-label">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 border-2 border-ink bg-paper px-3 text-base font-bold outline-none focus:ring-4 focus:ring-accent/30"
      >
        {children}
      </select>
    </label>
  );
}
function Filter({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full border-2 border-ink bg-paper px-3 text-base font-bold"
      >
        {children}
      </select>
    </label>
  );
}
function ModeButton({
  active,
  title,
  copy,
  onClick,
}: {
  active: boolean;
  title: string;
  copy: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-20 border-2 border-ink p-3 text-left ${active ? "bg-ink text-paper" : "bg-paper hover:bg-paper-2"}`}
    >
      <strong className="block text-sm uppercase tracking-wide">
        {active ? "✓ " : ""}
        {title}
      </strong>
      <span
        className={`mt-1 block text-xs font-semibold ${active ? "text-paper-2" : "text-ink-soft"}`}
      >
        {copy}
      </span>
    </button>
  );
}
function Compare({
  label,
  before,
  after,
  money = false,
}: {
  label: string;
  before: number;
  after: number;
  money?: boolean;
}) {
  const show = (value: number) =>
    money ? formatCurrency(value) : value.toFixed(1);
  return (
    <div>
      <p className="brut-label">{label}</p>
      <p className="mt-1 text-sm font-bold text-ink-soft">
        <span className="num">{show(before)}</span> →{" "}
        <strong className="num text-lg text-good">{show(after)}</strong>
        {money ? "" : " days"}
      </p>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="font-bold text-ink-soft">{label}</dt>
      <dd className="text-right font-black">{value}</dd>
    </div>
  );
}
function ActionError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="border-2 border-bad bg-bad-soft p-3 text-sm font-bold text-bad sm:col-span-2 lg:col-span-3"
    >
      {message}
    </p>
  );
}
function Empty({ copy }: { copy: string }) {
  return (
    <div className="p-10 text-center">
      <p className="brut-display text-2xl">Nothing recorded here.</p>
      <p className="mt-2 text-sm font-semibold text-ink-soft">{copy}</p>
    </div>
  );
}
