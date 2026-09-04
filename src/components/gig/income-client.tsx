"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CirclePlus, RefreshCw, Scissors } from "lucide-react";
import { toast } from "sonner";
import type { CashEntryDto, SplitPercentages } from "@superfinz/shared";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Cashbook } from "./income/cashbook";
import { EntryPanel } from "./income/entry-panel";
import {
  TABS_ID,
  dateTime,
  emptyEntry,
  emptyPayout,
  emptySource,
  panelFromParam,
  tabForPanel,
  tabItems,
  toEntryForm,
  type EntryForm,
  type PanelKind,
  type PayoutForm,
  type SourceForm,
  type Tab,
} from "./income/model";
import { Overview, buildIncomeAnalysis } from "./income/overview";
import { PayoutPanel, type PayoutSubmission } from "./income/payout-panel";
import { Sources, type SourceAction } from "./income/sources";
import { Tabs } from "./income/tabs";
import {
  ErrorPanel,
  LoadingPanel,
  PageHeading,
  RefreshingBar,
} from "./page-state";
import { jsonRequest, useGigDashboard } from "./use-gig-dashboard";

const sourceToasts: Record<SourceAction, string> = {
  REFRESH: "Source refreshed. Forecast freshness updated.",
  ACTIVE: "Source resumed.",
  PAUSED: "Source paused.",
  REVOKED: "Source revoked.",
};

export function IncomeClient() {
  const { dashboard, loading, refreshing, error, refresh } = useGigDashboard();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("overview");
  const [panel, setPanel] = useState<PanelKind | null>(null);
  const [entry, setEntry] = useState<EntryForm>(emptyEntry);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [payout, setPayout] = useState<PayoutForm>(emptyPayout);
  const [customSplit, setCustomSplit] = useState<SplitPercentages | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [source, setSource] = useState<SourceForm>(emptySource);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [visible, setVisible] = useState(15);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  /** Element that opened the current panel; focus returns to it on close. */
  const triggerRef = useRef<HTMLElement | null>(null);

  // Open a panel when the URL asks for one (`?panel=entry|add|payout|source`),
  // including when the param changes while this screen is already mounted.
  const panelParam = searchParams.get("panel");
  const [seenPanelParam, setSeenPanelParam] = useState<string | null>(null);
  if (panelParam !== seenPanelParam) {
    setSeenPanelParam(panelParam);
    const requested = panelFromParam(panelParam);
    if (requested) {
      setPanel(requested);
      setTab(tabForPanel(requested));
      setActionError(null);
      setConfirmed(false);
      if (requested === "entry") {
        setEditingId(null);
        setEntry(emptyEntry());
      }
    }
  }

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

  if (loading) return <LoadingPanel label="Loading your money workspace" />;
  if (!dashboard || !analysis)
    return <ErrorPanel message={error ?? "No plan found"} retry={refresh} />;

  const activeSources = dashboard.sources.filter(
    (item) => item.status === "ACTIVE",
  );

  const rememberTrigger = (trigger?: HTMLElement) => {
    triggerRef.current =
      trigger ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);
  };
  /** Closes the panel without moving focus (used when switching tabs). */
  const dismissPanel = () => {
    setPanel(null);
    setEditingId(null);
    setActionError(null);
    setConfirmed(false);
    triggerRef.current = null;
    if (panelParam) router.replace(pathname, { scroll: false });
  };
  /** Closes the panel and returns focus to whatever opened it. */
  const closePanel = () => {
    const trigger = triggerRef.current;
    dismissPanel();
    const fallback = document.getElementById(`${TABS_ID}-tab-${tab}`);
    window.requestAnimationFrame(() =>
      (trigger?.isConnected ? trigger : fallback)?.focus(),
    );
  };
  const openEntry = (item?: CashEntryDto, trigger?: HTMLElement) => {
    rememberTrigger(trigger);
    setActionError(null);
    setEditingId(item?.id ?? null);
    setEntry(item ? toEntryForm(item) : emptyEntry());
    setPanel("entry");
    setTab("cashbook");
  };
  const openPayout = (trigger?: HTMLElement) => {
    rememberTrigger(trigger);
    setActionError(null);
    setConfirmed(false);
    setPanel("payout");
    setTab("cashbook");
  };
  const openSource = (trigger?: HTMLElement) => {
    rememberTrigger(trigger);
    setActionError(null);
    setPanel("source");
    setTab("sources");
  };
  const changeTab = (next: Tab) => {
    setTab(next);
    if (panel) dismissPanel();
  };
  const clearFilters = () => {
    setQuery("");
    setKindFilter("ALL");
    setSourceFilter("ALL");
    setDateFilter("ALL");
  };

  const submitEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(entry.amount);
    if (!(amount > 0)) {
      setActionError("Enter an amount greater than zero.");
      return;
    }
    if (!entry.category.trim()) {
      setActionError("Give this entry a category.");
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      const selected = dashboard.sources.find(
        (item) => item.id === entry.sourceId,
      );
      const payload = {
        kind: entry.kind,
        amount,
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
      const corrected = Boolean(editingId);
      closePanel();
      toast.success(
        corrected
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

  const submitPayout = async (submission: PayoutSubmission) => {
    setBusy(true);
    setActionError(null);
    try {
      await jsonRequest("/api/gig/split", {
        method: "POST",
        body: JSON.stringify(submission),
      });
      setPayout(emptyPayout());
      setCustomSplit(null);
      closePanel();
      toast.success(
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

  const submitSource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!source.name.trim()) {
      setActionError("Give this source a name.");
      return;
    }
    if (Number(source.typicalMax) < Number(source.typicalMin)) {
      setActionError("Typical maximum must be at least the typical minimum.");
      return;
    }
    setBusy(true);
    setActionError(null);
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
      setSource(emptySource());
      closePanel();
      toast.success(
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
      toast.error(
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
    try {
      await jsonRequest(`/api/gig/entries/${item.id}`, { method: "DELETE" });
      toast.success("Entry deleted and its balance effect reversed.");
      await refresh();
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not delete entry",
      );
    } finally {
      setBusy(false);
    }
  };

  const updateSource = async (id: string, action: SourceAction) => {
    setBusy(true);
    try {
      await jsonRequest("/api/gig/sources", {
        method: "PATCH",
        body: JSON.stringify(
          action === "REFRESH" ? { id, action } : { id, status: action },
        ),
      });
      toast.success(sourceToasts[action]);
      await refresh();
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not update source",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeading
        eyebrow="Your money"
        title="See what you actually kept."
        copy="Add income and work costs. SuperFinz shows what remains after fuel, fees, and other earning costs."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="lg"
              onClick={(event) => openEntry(undefined, event.currentTarget)}
            >
              <CirclePlus aria-hidden size={17} />
              Add entry
            </Button>
            <Button
              variant="accent"
              size="lg"
              onClick={(event) => openPayout(event.currentTarget)}
            >
              <Scissors aria-hidden size={17} />
              Record payout
            </Button>
          </div>
        }
      />
      <RefreshingBar active={refreshing} />
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bad/40 bg-bad-soft px-4 py-3 text-sm font-medium text-bad"
        >
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={() => void refresh()}>
            <RefreshCw aria-hidden size={15} />
            Try again
          </Button>
        </div>
      )}
      <Tabs
        items={tabItems}
        value={tab}
        onChange={changeTab}
        label="Money sections"
        idPrefix={TABS_ID}
      />
      <div
        role="tabpanel"
        id={`${TABS_ID}-panel-${tab}`}
        aria-labelledby={`${TABS_ID}-tab-${tab}`}
        className="space-y-5"
      >
        {tab === "overview" && (
          <Overview
            dashboard={dashboard}
            analysis={analysis}
            onPayout={openPayout}
          />
        )}
        {tab === "cashbook" && (
          <>
            {panel === "entry" && (
              <EntryPanel
                key={editingId ?? "new"}
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
                dashboard={dashboard}
                activeSources={activeSources}
                payout={payout}
                setPayout={setPayout}
                customSplit={customSplit}
                setCustomSplit={setCustomSplit}
                confirmed={confirmed}
                setConfirmed={setConfirmed}
                busy={busy}
                error={actionError}
                onClose={closePanel}
                onSubmit={submitPayout}
                onAddSource={() => openSource()}
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
              clearFilters={clearFilters}
              openEntry={openEntry}
              remove={remove}
              loadMore={() => setVisible((value) => value + 15)}
            />
          </>
        )}
        {tab === "sources" && (
          <Sources
            dashboard={dashboard}
            panelOpen={panel === "source"}
            source={source}
            setSource={setSource}
            busy={busy}
            error={actionError}
            closePanel={closePanel}
            submitSource={submitSource}
            openPanel={openSource}
            updateSource={updateSource}
          />
        )}
      </div>
    </div>
  );
}
