"use client";

import { useId } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CirclePlus,
  Edit3,
  Search,
  Trash2,
  WalletCards,
} from "lucide-react";
import type { CashEntryDto, GigDashboardDto } from "@superfinz/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { entryKinds, kindLabels, paymentMethodLabel } from "./model";

export function Cashbook({
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
  clearFilters,
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
  clearFilters: () => void;
  openEntry: (item?: CashEntryDto, trigger?: HTMLElement) => void;
  remove: (item: CashEntryDto) => Promise<void>;
  loadMore: () => void;
}) {
  const headingId = useId();
  const filtered =
    query.trim() !== "" ||
    kindFilter !== "ALL" ||
    sourceFilter !== "ALL" ||
    dateFilter !== "ALL";

  return (
    <section aria-labelledby={headingId} className="brut-card overflow-hidden">
      <div className="grid gap-3 border-b border-line bg-paper-2 p-4 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="relative">
          <Search
            aria-hidden
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-mute"
          />
          <Input
            type="search"
            aria-label="Search cashbook"
            placeholder="Search category, note or method"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          aria-label="Filter by entry type"
          value={kindFilter}
          onChange={(event) => setKindFilter(event.target.value)}
        >
          <option value="ALL">All types</option>
          {entryKinds.map((item) => (
            <option key={item} value={item}>
              {kindLabels[item]}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by income source"
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value)}
        >
          <option value="ALL">All sources</option>
          {dashboard.sources.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
        >
          <option value="ALL">All dates</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </Select>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <p className="brut-label">Cashbook</p>
          <h2
            id={headingId}
            className="mt-1 text-xl font-bold tracking-[-0.02em]"
          >
            Settled entries
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-soft">
            {entries.length} matching · newest first. Settled means the money
            has already landed or left; planned and expected amounts are not
            listed here.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={(event) => openEntry(undefined, event.currentTarget)}
        >
          <CirclePlus aria-hidden size={16} />
          Add entry
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="p-4 sm:p-5">
          <EmptyState
            icon={WalletCards}
            title={
              filtered ? "No entries match these filters" : "Nothing recorded yet"
            }
            description={
              filtered
                ? "Try a different search or clear the filters."
                : "Add your first settled entry to start tracking what you keep."
            }
            action={
              filtered ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button
                  variant="accent"
                  onClick={(event) => openEntry(undefined, event.currentTarget)}
                >
                  <CirclePlus aria-hidden size={16} />
                  Add first entry
                </Button>
              )
            }
          />
        </div>
      ) : (
        <ul role="list">
          {entries.slice(0, visible).map((item) => {
            const incoming = item.kind === "INCOME";
            const locked = Boolean(item.payoutSplitId || item.commitmentId);
            return (
              <li
                key={item.id}
                className="grid min-h-20 grid-cols-[44px_1fr_auto] items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 sm:grid-cols-[44px_1fr_auto_auto] sm:px-5"
              >
                <div
                  aria-hidden
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl",
                    incoming
                      ? "bg-good-soft text-good"
                      : "bg-warn-soft text-warn",
                  )}
                >
                  {incoming ? (
                    <ArrowDownLeft size={18} />
                  ) : (
                    <ArrowUpRight size={18} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">
                      {item.sourceName ?? item.category}
                    </p>
                    {item.recurring && <Badge>Recurring</Badge>}
                    {locked && <Badge variant="accent">Linked</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-ink-soft">
                    {kindLabels[item.kind]} · {formatDate(item.date)} ·{" "}
                    {paymentMethodLabel(item.paymentMethod)}
                    {item.note ? ` · ${item.note}` : ""}
                  </p>
                </div>
                <p
                  className={cn(
                    "num whitespace-nowrap text-lg font-bold",
                    incoming ? "text-good" : "text-bad",
                  )}
                >
                  {incoming ? "+" : "−"}
                  {formatCurrency(item.amount)}
                </p>
                <div className="col-start-2 flex justify-end gap-1 sm:col-start-auto">
                  {!locked && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${item.category}`}
                      onClick={(event) => openEntry(item, event.currentTarget)}
                    >
                      <Edit3 aria-hidden size={17} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${item.category}`}
                    disabled={busy}
                    onClick={() => void remove(item)}
                    className="text-bad hover:bg-bad-soft hover:text-bad"
                  >
                    <Trash2 aria-hidden size={17} />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {visible < entries.length && (
        <div className="border-t border-line p-3">
          <Button variant="ghost" block onClick={loadMore}>
            Show 15 more ({entries.length - visible} remaining)
          </Button>
        </div>
      )}
    </section>
  );
}
