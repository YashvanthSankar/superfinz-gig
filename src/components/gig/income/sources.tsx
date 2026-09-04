"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  CirclePlus,
  Database,
  Pause,
  Play,
  RefreshCw,
  Unplug,
} from "lucide-react";
import type {
  ConnectionMode,
  GigDashboardDto,
  GigFrequency,
  GigIncomeSourceDto,
  GigSourceType,
} from "@superfinz/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  connectionModeLabel,
  connectionModes,
  formatDateTime,
  frequencies,
  frequencyLabels,
  sourceStatusMeta,
  sourceTypeLabels,
  sourceTypes,
  type SourceForm,
} from "./model";
import { ActionError, Panel } from "./panel";

export type SourceAction = "ACTIVE" | "PAUSED" | "REVOKED" | "REFRESH";

export function Sources({
  dashboard,
  panelOpen,
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
  panelOpen: boolean;
  source: SourceForm;
  setSource: Dispatch<SetStateAction<SourceForm>>;
  busy: boolean;
  error: string | null;
  closePanel: () => void;
  submitSource: (event: FormEvent<HTMLFormElement>) => void;
  openPanel: (trigger?: HTMLElement) => void;
  updateSource: (id: string, action: SourceAction) => Promise<void>;
}) {
  const update = <K extends keyof SourceForm>(key: K, value: SourceForm[K]) =>
    setSource((current) => ({ ...current, [key]: value }));
  const simulated = source.connectionMode.startsWith("SIMULATED");

  return (
    <div className="space-y-5">
      {panelOpen && (
        <Panel
          eyebrow="New income source"
          title="Add only what helps the plan."
          description="Tell SuperFinz where income usually comes from so expected payouts are easier to understand."
          busy={busy}
          onClose={closePanel}
        >
          <form
            onSubmit={submitSource}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <Input
              label="Source name"
              required
              value={source.name}
              onChange={(event) => update("name", event.target.value)}
            />
            <Select
              label="Source type"
              required
              value={source.type}
              onChange={(event) =>
                update("type", event.target.value as GigSourceType)
              }
            >
              {sourceTypes.map((item) => (
                <option key={item} value={item}>
                  {sourceTypeLabels[item]}
                </option>
              ))}
            </Select>
            <Select
              label="How often paid"
              required
              value={source.frequency}
              onChange={(event) =>
                update("frequency", event.target.value as GigFrequency)
              }
            >
              {frequencies.map((item) => (
                <option key={item} value={item}>
                  {frequencyLabels[item]}
                </option>
              ))}
            </Select>
            <Input
              label="Typical minimum"
              type="number"
              prefix="₹"
              min={0}
              step="0.01"
              required
              value={source.typicalMin}
              onChange={(event) => update("typicalMin", event.target.value)}
            />
            <Input
              label="Typical maximum"
              type="number"
              prefix="₹"
              min={0}
              step="0.01"
              required
              value={source.typicalMax}
              onChange={(event) => update("typicalMax", event.target.value)}
            />
            <Input
              label="Next likely payout"
              type="date"
              required
              value={source.nextPayoutAt}
              onChange={(event) => update("nextPayoutAt", event.target.value)}
            />
            <Select
              label="Connection method"
              required
              value={source.connectionMode}
              onChange={(event) =>
                update("connectionMode", event.target.value as ConnectionMode)
              }
            >
              {connectionModes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
            {simulated && (
              <div className="rounded-2xl border border-good/40 bg-good-soft p-4 sm:col-span-2">
                <p className="brut-label">Consent before connection</p>
                <p className="mt-2 text-sm leading-6 text-ink">
                  Data: settled payouts, payout dates and platform deductions.
                  Purpose: forecast income and calculate safe-to-spend. History:
                  last 90 days. You can pause or revoke this any time.
                </p>
                <p className="mt-2 text-xs font-semibold text-good">
                  Hackathon simulator — no external account is contacted.
                </p>
              </div>
            )}
            {error && (
              <ActionError
                message={error}
                className="sm:col-span-2 lg:col-span-3"
              />
            )}
            <Button
              type="submit"
              size="lg"
              block
              loading={busy}
              loadingLabel="Adding"
              className="sm:col-span-2 lg:col-span-3"
            >
              {simulated ? "Consent and connect simulation" : "Add source"}
            </Button>
          </form>
        </Panel>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="brut-label">Source control center</p>
          <h2 className="mt-1 text-xl font-bold tracking-[-0.02em]">
            Your income sources
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink-soft">
            Pause, refresh, or revoke every source independently.
          </p>
        </div>
        <Button
          variant="accent"
          onClick={(event) => openPanel(event.currentTarget)}
        >
          <CirclePlus aria-hidden size={17} />
          Add source
        </Button>
      </div>

      {dashboard.sources.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No income sources yet"
          description="Add the platforms, clients or cash work that pay you so payouts and forecasts have somewhere to land."
          action={
            <Button
              variant="accent"
              onClick={(event) => openPanel(event.currentTarget)}
            >
              <CirclePlus aria-hidden size={17} />
              Add first source
            </Button>
          }
        />
      ) : (
        <section
          aria-label="Income sources"
          className="grid gap-4 lg:grid-cols-2"
        >
          {dashboard.sources.map((item) => (
            <SourceCard
              key={item.id}
              item={item}
              busy={busy}
              updateSource={updateSource}
            />
          ))}
        </section>
      )}

      <section className="rounded-[1.5rem] bg-primary p-5 text-on-primary shadow-lg sm:p-6">
        <p className="brut-label text-on-primary-soft">Clear data boundary</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-on-primary-soft">
          Only payout amounts, dates and deductions are used. Contacts,
          messages, call history, photos and social data are never requested.
        </p>
      </section>
    </div>
  );
}

function SourceCard({
  item,
  busy,
  updateSource,
}: {
  item: GigIncomeSourceDto;
  busy: boolean;
  updateSource: (id: string, action: SourceAction) => Promise<void>;
}) {
  const status = sourceStatusMeta[item.status];
  return (
    <article className="brut-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold tracking-[-0.02em]">
              {item.name}
            </h3>
            <Badge variant={status.tone}>{status.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {frequencyLabels[item.frequency]} · {sourceTypeLabels[item.type]} ·{" "}
            <span className="num">
              {formatCurrency(item.typicalMin)}–
              {formatCurrency(item.typicalMax)}
            </span>
          </p>
        </div>
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-paper-2 text-accent-ink"
        >
          <Database size={20} />
        </span>
      </div>
      <dl className="mt-4 grid gap-2 border-y border-line py-4 text-sm">
        <Row
          label="Connection"
          value={connectionModeLabel(item.connectionMode)}
        />
        <Row
          label="Last refresh"
          value={
            item.lastSyncAt
              ? formatDateTime(item.lastSyncAt)
              : "Manual — no sync"
          }
        />
        <Row
          label="Next payout"
          value={item.nextPayoutAt ? formatDate(item.nextPayoutAt) : "Not set"}
        />
      </dl>
      {item.consentReceiptId && (
        <Disclosure
          tone="plain"
          title="Consent receipt"
          summary={item.consentReceiptId}
          className="mt-4 rounded-2xl border border-line bg-paper-2 px-4"
        >
          <dl className="space-y-2 text-sm">
            <Row label="Receipt" value={item.consentReceiptId} />
            <Row label="Purpose" value={item.purpose ?? "—"} />
            <Row label="Data" value={item.dataTypes?.join(", ") ?? "—"} />
            <Row
              label="Period"
              value={`${item.consentFrom ? formatDate(item.consentFrom) : "—"} to ${item.consentTo ? formatDate(item.consentTo) : "—"}`}
            />
            <Row
              label="Consent expires"
              value={
                item.consentExpiresAt ? formatDate(item.consentExpiresAt) : "—"
              }
            />
          </dl>
        </Disclosure>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {(item.status === "ACTIVE" || item.status === "ERROR") && (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => void updateSource(item.id, "REFRESH")}
          >
            <RefreshCw aria-hidden size={16} />
            Refresh
          </Button>
        )}
        {item.status === "ACTIVE" && (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => void updateSource(item.id, "PAUSED")}
          >
            <Pause aria-hidden size={16} />
            Pause
          </Button>
        )}
        {item.status === "PAUSED" && (
          <Button
            variant="soft"
            disabled={busy}
            onClick={() => void updateSource(item.id, "ACTIVE")}
          >
            <Play aria-hidden size={16} />
            Resume
          </Button>
        )}
        {item.status !== "REVOKED" && (
          <Button
            variant="danger-soft"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  `Revoke ${item.name}? Future payouts will leave the forecast.`,
                )
              )
                void updateSource(item.id, "REVOKED");
            }}
          >
            <Unplug aria-hidden size={16} />
            Revoke
          </Button>
        )}
      </div>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-semibold text-ink [overflow-wrap:anywhere]">
        {value}
      </dd>
    </div>
  );
}
