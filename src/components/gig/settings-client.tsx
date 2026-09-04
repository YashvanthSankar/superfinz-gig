"use client";

import {
  useEffect,
  useState,
  type ComponentProps,
  type FormEvent,
} from "react";
import { signOut } from "next-auth/react";
import { AlertTriangle, LogOut, Pause, Play, Save, Unplug } from "lucide-react";
import { toast } from "sonner";
import type { ConnectionMode, GigIncomeSourceDto } from "@superfinz/shared";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ErrorPanel,
  LoadingPanel,
  PageHeading,
  RefreshingBar,
} from "./page-state";
import { jsonRequest, useGigDashboard } from "./use-gig-dashboard";

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;
type SourceStatus = GigIncomeSourceDto["status"];
type SourceAction = Extract<SourceStatus, "ACTIVE" | "PAUSED" | "REVOKED">;

type SettingsForm = {
  preferredName: string;
  city: string;
  preferredLanguage: string;
  safetyBuffer: string;
  cushionTargetDays: string;
  essentialsPct: string;
  workCostsPct: string;
  emergencyPct: string;
  longTermPct: string;
  flexiblePct: string;
  enabled: boolean;
};

const empty: SettingsForm = {
  preferredName: "",
  city: "",
  preferredLanguage: "English",
  safetyBuffer: "0",
  cushionTargetDays: "30",
  essentialsPct: "55",
  workCostsPct: "15",
  emergencyPct: "10",
  longTermPct: "5",
  flexiblePct: "15",
  enabled: true,
};

const SOURCE_STATUS: Record<
  SourceStatus,
  { label: string; variant: BadgeVariant }
> = {
  ACTIVE: { label: "Active", variant: "good" },
  PAUSED: { label: "Paused", variant: "warn" },
  ERROR: { label: "Needs attention", variant: "bad" },
  REVOKED: { label: "Revoked", variant: "bad" },
};

const CONNECTION_LABEL: Record<ConnectionMode, string> = {
  SIMULATED_BANK: "Simulated bank",
  SIMULATED_PLATFORM: "Simulated platform",
  FILE_IMPORT: "File import",
  MANUAL: "Manual",
};

const STATUS_VERB: Record<SourceAction, string> = {
  ACTIVE: "resumed",
  PAUSED: "paused",
  REVOKED: "revoked",
};

export function SettingsClient() {
  const { dashboard, loading, refreshing, error, refresh } = useGigDashboard();
  const [form, setForm] = useState(empty);
  const [hydratedId, setHydratedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busySource, setBusySource] = useState<{
    id: string;
    status: SourceAction;
  } | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);

  useEffect(() => {
    if (!dashboard || hydratedId === dashboard.profile.id) return;
    setForm({
      preferredName: dashboard.profile.preferredName,
      city: dashboard.profile.city,
      preferredLanguage: dashboard.profile.preferredLanguage,
      safetyBuffer: String(dashboard.profile.safetyBuffer),
      cushionTargetDays: String(dashboard.profile.cushionTargetDays),
      essentialsPct: String(dashboard.splitRule.essentialsPct),
      workCostsPct: String(dashboard.splitRule.workCostsPct),
      emergencyPct: String(dashboard.splitRule.emergencyPct),
      longTermPct: String(dashboard.splitRule.longTermPct),
      flexiblePct: String(dashboard.splitRule.flexiblePct),
      enabled: dashboard.splitRule.enabled,
    });
    setHydratedId(dashboard.profile.id);
  }, [dashboard, hydratedId]);

  if (loading) return <LoadingPanel label="Loading settings" />;
  if (!dashboard)
    return <ErrorPanel message={error ?? "No plan found"} retry={refresh} />;

  const splitTotal =
    Number(form.essentialsPct) +
    Number(form.workCostsPct) +
    Number(form.emergencyPct) +
    Number(form.longTermPct) +
    Number(form.flexiblePct);
  const splitOk = splitTotal === 100;
  const busy = saving || busySource !== null;

  const set = (key: keyof SettingsForm, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.preferredName.trim()) {
      setFormError("Add a preferred name so the coach knows what to call you.");
      return;
    }
    if (!form.city.trim()) {
      setFormError("Add your city. It shapes cost estimates and support links.");
      return;
    }
    if (!splitOk) {
      setFormError(
        `Split percentages must add up to 100%. They currently total ${splitTotal}%.`,
      );
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await jsonRequest("/api/gig/settings", {
        method: "PATCH",
        body: JSON.stringify({
          preferredName: form.preferredName.trim(),
          city: form.city.trim(),
          preferredLanguage: form.preferredLanguage.trim(),
          safetyBuffer: Number(form.safetyBuffer),
          cushionTargetDays: Number(form.cushionTargetDays),
          splitRule: {
            essentialsPct: Number(form.essentialsPct),
            workCostsPct: Number(form.workCostsPct),
            emergencyPct: Number(form.emergencyPct),
            longTermPct: Number(form.longTermPct),
            flexiblePct: Number(form.flexiblePct),
            enabled: form.enabled,
          },
        }),
      });
      toast.success("Settings saved");
      setHydratedId(null);
      await refresh();
    } catch (cause) {
      setFormError(
        cause instanceof Error ? cause.message : "Could not save settings",
      );
    } finally {
      setSaving(false);
    }
  };

  const sourceStatus = async (
    source: GigIncomeSourceDto,
    status: SourceAction,
  ) => {
    if (
      status === "REVOKED" &&
      !window.confirm(
        `Revoke ${source.name}? Future payouts from it will leave the forecast.`,
      )
    )
      return;
    setBusySource({ id: source.id, status });
    setSourceError(null);
    try {
      await jsonRequest("/api/gig/sources", {
        method: "PATCH",
        body: JSON.stringify({ id: source.id, status }),
      });
      toast.success(`${source.name} ${STATUS_VERB[status]}`);
      await refresh();
    } catch (cause) {
      setSourceError(
        cause instanceof Error ? cause.message : "Could not update source",
      );
    } finally {
      setBusySource(null);
    }
  };

  const isBusySource = (id: string, status: SourceAction) =>
    busySource?.id === id && busySource.status === status;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeading
        eyebrow="Settings & consent"
        title="Keep the plan yours."
        copy="Update the protection rule, control every data source, and see exactly which connections are simulated."
      />
      <RefreshingBar active={refreshing} />

      <form onSubmit={save} noValidate className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            eyebrow="Worker profile"
            title="Your planning basics."
            description="These shape the forecast, the coach's tone, and how much is kept aside."
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input
              label="Preferred name"
              required
              autoComplete="given-name"
              value={form.preferredName}
              onChange={(event) => set("preferredName", event.target.value)}
            />
            <Input
              label="City"
              required
              autoComplete="address-level2"
              value={form.city}
              onChange={(event) => set("city", event.target.value)}
            />
            <Input
              label="Preferred language"
              required
              value={form.preferredLanguage}
              onChange={(event) => set("preferredLanguage", event.target.value)}
            />
            <Input
              label="Minimum safety buffer"
              type="number"
              min={0}
              step={100}
              prefix="₹"
              hint="The forecast warns when balance may fall under this."
              value={form.safetyBuffer}
              onChange={(event) => set("safetyBuffer", event.target.value)}
            />
            <Input
              label="Cushion goal"
              type="number"
              min={0}
              max={365}
              step={1}
              suffix="days"
              hint="How many days of essentials the emergency cushion should cover."
              value={form.cushionTargetDays}
              onChange={(event) => set("cushionTargetDays", event.target.value)}
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Smart Split rule"
            title="Every payout gets a job."
            description="When a payout settles, it is divided into these five pockets."
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input
              label="Essentials"
              type="number"
              min={0}
              max={100}
              suffix="%"
              value={form.essentialsPct}
              onChange={(event) => set("essentialsPct", event.target.value)}
            />
            <Input
              label="Work costs"
              type="number"
              min={0}
              max={100}
              suffix="%"
              value={form.workCostsPct}
              onChange={(event) => set("workCostsPct", event.target.value)}
            />
            <Input
              label="Emergency cushion"
              type="number"
              min={0}
              max={100}
              suffix="%"
              value={form.emergencyPct}
              onChange={(event) => set("emergencyPct", event.target.value)}
            />
            <Input
              label="Long-term savings"
              type="number"
              min={0}
              max={100}
              suffix="%"
              value={form.longTermPct}
              onChange={(event) => set("longTermPct", event.target.value)}
            />
            <Input
              label="Flexible spending"
              type="number"
              min={0}
              max={100}
              suffix="%"
              value={form.flexiblePct}
              onChange={(event) => set("flexiblePct", event.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <p className="brut-label">Total</p>
              <div
                className={cn(
                  "flex h-12 items-center justify-between rounded-xl border px-3.5",
                  splitOk
                    ? "border-good/40 bg-good-soft"
                    : "border-bad/40 bg-bad-soft",
                )}
              >
                <span className="text-sm font-medium text-ink-soft">
                  Adds up to
                </span>
                <strong
                  className={cn(
                    "num text-lg font-bold",
                    splitOk ? "text-good" : "text-bad",
                  )}
                >
                  {splitTotal}%
                </strong>
              </div>
              <p
                className={cn(
                  "text-sm",
                  splitOk ? "text-mute" : "font-medium text-bad",
                )}
              >
                {splitOk
                  ? "Ready to save."
                  : `Needs to total 100% (${splitTotal > 100 ? "over" : "under"} by ${Math.abs(100 - splitTotal)}%).`}
              </p>
            </div>
          </div>
          <label className="mt-4 flex min-h-12 items-center gap-3 rounded-xl border border-line-strong bg-surface px-3.5 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => set("enabled", event.target.checked)}
              className="h-5 w-5 accent-accent"
            />
            Use this rule for new payouts
          </label>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:col-span-2">
          {formError ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-bad/40 bg-bad-soft px-3.5 py-2.5 text-sm font-medium text-bad"
            >
              <AlertTriangle aria-hidden size={16} className="mt-0.5 shrink-0" />
              {formError}
            </p>
          ) : (
            <p className="text-sm text-mute">
              Changes apply to new payouts and the next forecast.
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            loading={saving}
            loadingLabel="Saving"
            className="sm:shrink-0"
          >
            <Save aria-hidden size={17} />
            Save settings
          </Button>
        </div>
      </form>

      <Card>
        <CardHeader
          eyebrow="Income-source consent"
          title="Connections and manual sources"
          description="Pause a source to keep its history but stop new payouts. Revoke it to remove it from the forecast."
        />
        {sourceError && (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl border border-bad/40 bg-bad-soft px-3.5 py-2.5 text-sm font-medium text-bad"
          >
            <AlertTriangle aria-hidden size={16} className="mt-0.5 shrink-0" />
            {sourceError}
          </p>
        )}
        <ul className="mt-4 divide-y divide-line">
          {dashboard.sources.map((source) => {
            const status = SOURCE_STATUS[source.status];
            return (
              <li
                key={source.id}
                className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="min-w-48 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink">{source.name}</h3>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <Badge>{source.prototype ? "Prototype" : "Connected"}</Badge>
                  </div>
                  <p className="mt-1.5 text-sm text-ink-soft">
                    {CONNECTION_LABEL[source.connectionMode]} · Last sync{" "}
                    {source.lastSyncAt
                      ? new Date(source.lastSyncAt).toLocaleString("en-IN")
                      : "not applicable"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {source.status === "ACTIVE" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy && !isBusySource(source.id, "PAUSED")}
                      loading={isBusySource(source.id, "PAUSED")}
                      loadingLabel="Pausing"
                      onClick={() => void sourceStatus(source, "PAUSED")}
                    >
                      <Pause aria-hidden size={16} />
                      Pause
                    </Button>
                  )}
                  {source.status === "PAUSED" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy && !isBusySource(source.id, "ACTIVE")}
                      loading={isBusySource(source.id, "ACTIVE")}
                      loadingLabel="Resuming"
                      onClick={() => void sourceStatus(source, "ACTIVE")}
                    >
                      <Play aria-hidden size={16} />
                      Resume
                    </Button>
                  )}
                  {source.status !== "REVOKED" && (
                    <Button
                      variant="danger-soft"
                      size="sm"
                      disabled={busy && !isBusySource(source.id, "REVOKED")}
                      loading={isBusySource(source.id, "REVOKED")}
                      loadingLabel="Revoking"
                      onClick={() => void sourceStatus(source, "REVOKED")}
                    >
                      <Unplug aria-hidden size={16} />
                      Revoke
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <section
        aria-labelledby="account-heading"
        className="rounded-[1.5rem] bg-primary p-5 text-on-primary shadow-lg sm:p-6"
      >
        <h2 id="account-heading" className="brut-label text-on-primary-soft">
          Account
        </h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-sm leading-6 text-on-primary-soft">
            Signing out removes the local session from this device. Your saved
            Convex data remains available after the next Google sign-in.
          </p>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="border-transparent bg-on-primary text-primary hover:bg-on-primary/90 focus-visible:outline-accent-on-primary"
          >
            <LogOut aria-hidden size={17} />
            Sign out
          </Button>
        </div>
      </section>
    </div>
  );
}
