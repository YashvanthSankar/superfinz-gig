"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { CashEntryKind, GigDashboardDto } from "@superfinz/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  defaultCategoryFor,
  entryKinds,
  kindLabels,
  paymentMethods,
  type EntryForm,
} from "./model";
import { ActionError, Panel } from "./panel";

export function EntryPanel({
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
  setEntry: Dispatch<SetStateAction<EntryForm>>;
  editing: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const update = <K extends keyof EntryForm>(key: K, value: EntryForm[K]) =>
    setEntry((current) => ({ ...current, [key]: value }));

  return (
    <Panel
      eyebrow={editing ? "Edit money entry" : "Add money entry"}
      title={editing ? "Fix this entry." : "What did you earn or spend?"}
      onClose={onClose}
    >
      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Select
          label="Entry type"
          required
          value={entry.kind}
          onChange={(event) => {
            const kind = event.target.value as CashEntryKind;
            setEntry((current) => ({
              ...current,
              kind,
              category: defaultCategoryFor(kind),
            }));
          }}
        >
          {entryKinds.map((kind) => (
            <option key={kind} value={kind}>
              {kindLabels[kind]}
            </option>
          ))}
        </Select>
        <Input
          label="Amount"
          type="number"
          prefix="₹"
          min={0}
          step="0.01"
          required
          value={entry.amount}
          onChange={(event) => update("amount", event.target.value)}
        />
        <Select
          label="Income source"
          value={entry.sourceId}
          onChange={(event) => update("sourceId", event.target.value)}
        >
          <option value="">None / cash</option>
          {dashboard.sources.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Input
          label="Category"
          required
          value={entry.category}
          onChange={(event) => update("category", event.target.value)}
        />
        <Select
          label="Payment method"
          required
          value={entry.paymentMethod}
          onChange={(event) => update("paymentMethod", event.target.value)}
        >
          {paymentMethods.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Input
          label="Date"
          type="date"
          required
          value={entry.date}
          onChange={(event) => update("date", event.target.value)}
        />
        <Input
          label="Time"
          type="time"
          required
          value={entry.time}
          onChange={(event) => update("time", event.target.value)}
        />
        <Input
          label="Note (optional)"
          value={entry.note}
          onChange={(event) => update("note", event.target.value)}
          wrapperClassName="lg:col-span-2"
        />
        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-line-strong bg-surface px-4 text-sm font-semibold text-ink shadow-sm">
          <input
            type="checkbox"
            checked={entry.recurring}
            onChange={(event) => update("recurring", event.target.checked)}
            className="h-5 w-5 accent-accent"
          />
          Repeats regularly
        </label>
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
          loadingLabel="Saving"
          className="sm:col-span-2 lg:col-span-3"
        >
          {editing ? "Save correction" : "Save settled entry"}
        </Button>
      </form>
    </Panel>
  );
}
