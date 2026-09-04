import type { ComponentProps } from "react";
import {
  GIG_FREQUENCIES,
  GIG_SOURCE_TYPES,
  type AdaptiveSplitRecommendation,
  type CashEntryDto,
  type CashEntryKind,
  type ConnectionMode,
  type GigFrequency,
  type GigIncomeSourceDto,
  type GigSourceType,
  type SplitPercentages,
} from "@superfinz/shared";
import type { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { localDateString, localTimeString } from "../use-gig-dashboard";

export type Tab = "overview" | "cashbook" | "sources";
export type PanelKind = "entry" | "payout" | "source";
export type BadgeTone = NonNullable<ComponentProps<typeof Badge>["variant"]>;
export type Projection = AdaptiveSplitRecommendation;

/** Prefix for the tab / tabpanel ids on the Money screen. */
export const TABS_ID = "income";
export const tabItems: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "cashbook", label: "Cashbook" },
  { id: "sources", label: "Sources" },
];

export type EntryForm = {
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

export type PayoutForm = {
  sourceId: string;
  amount: string;
  date: string;
  note: string;
  allocationMode: "ADAPTIVE" | "CUSTOM";
};

export type SourceForm = {
  name: string;
  type: GigSourceType;
  frequency: GigFrequency;
  typicalMin: string;
  typicalMax: string;
  nextPayoutAt: string;
  connectionMode: ConnectionMode;
};

export const emptyEntry = (): EntryForm => ({
  kind: "WORK_EXPENSE",
  amount: "",
  sourceId: "",
  category: "Fuel",
  paymentMethod: "UPI",
  note: "",
  recurring: false,
  date: localDateString(),
  time: localTimeString(),
});

export const emptyPayout = (): PayoutForm => ({
  sourceId: "",
  amount: "",
  date: localDateString(),
  note: "",
  allocationMode: "ADAPTIVE",
});

export const emptySource = (): SourceForm => ({
  name: "",
  type: "PLATFORM_PAYOUT",
  frequency: "WEEKLY",
  typicalMin: "",
  typicalMax: "",
  nextPayoutAt: localDateString(),
  connectionMode: "MANUAL",
});

/** Kinds a person can record by hand; the rest are created by the planner. */
export const entryKinds: CashEntryKind[] = [
  "INCOME",
  "WORK_EXPENSE",
  "ESSENTIAL_EXPENSE",
  "FLEXIBLE_EXPENSE",
];

export const kindLabels: Record<CashEntryKind, string> = {
  INCOME: "Other income",
  WORK_EXPENSE: "Work expense",
  ESSENTIAL_EXPENSE: "Essential expense",
  FLEXIBLE_EXPENSE: "Flexible expense",
  COMMITMENT_PAYMENT: "Commitment payment",
  POCKET_ALLOCATION: "Pocket allocation",
  TRANSFER: "Transfer",
};

export function defaultCategoryFor(kind: CashEntryKind) {
  switch (kind) {
    case "INCOME":
      return "Payout";
    case "WORK_EXPENSE":
      return "Fuel";
    case "ESSENTIAL_EXPENSE":
      return "Groceries";
    default:
      return "Personal";
  }
}

export const paymentMethods: Array<{ value: string; label: string }> = [
  { value: "UPI", label: "UPI" },
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank transfer" },
  { value: "CARD", label: "Card" },
  { value: "PLATFORM", label: "Platform wallet" },
];

export const paymentMethodLabel = (value: string) =>
  paymentMethods.find((item) => item.value === value)?.label ?? value;

export const sourceTypes = GIG_SOURCE_TYPES;
export const sourceTypeLabels: Record<GigSourceType, string> = {
  PLATFORM_PAYOUT: "Platform payout",
  DIRECT_UPI: "Direct UPI",
  BANK_TRANSFER: "Bank transfer",
  CASH: "Cash",
  OTHER: "Other",
};

export const frequencies = GIG_FREQUENCIES;
export const frequencyLabels: Record<GigFrequency, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  FORTNIGHTLY: "Every two weeks",
  MONTHLY: "Monthly",
  IRREGULAR: "Irregular",
};

export const connectionModes: Array<{ value: ConnectionMode; label: string }> = [
  { value: "MANUAL", label: "Manual source" },
  { value: "SIMULATED_PLATFORM", label: "Simulated platform" },
  { value: "SIMULATED_BANK", label: "Simulated bank" },
  { value: "FILE_IMPORT", label: "File import" },
];

export const connectionModeLabel = (mode: ConnectionMode) =>
  connectionModes.find((item) => item.value === mode)?.label ?? mode;

export const sourceStatusMeta: Record<
  GigIncomeSourceDto["status"],
  { label: string; tone: BadgeTone }
> = {
  ACTIVE: { label: "Active", tone: "good" },
  PAUSED: { label: "Paused", tone: "warn" },
  ERROR: { label: "Needs attention", tone: "bad" },
  REVOKED: { label: "Revoked", tone: "bad" },
};

export const splitFields: Array<{
  key: keyof SplitPercentages;
  amountKey: keyof Projection["amounts"];
  label: string;
}> = [
  { key: "essentialsPct", amountKey: "essentials", label: "Essentials" },
  { key: "workCostsPct", amountKey: "workCosts", label: "Work costs" },
  { key: "emergencyPct", amountKey: "emergency", label: "Emergency cushion" },
  { key: "longTermPct", amountKey: "longTerm", label: "Investment goal" },
  { key: "flexiblePct", amountKey: "flexible", label: "Flexible" },
];

/** Whole-number percentage for display. */
export const pct = (value: number) => `${Math.round(value)}%`;

/** Percentage total where the exact value matters for validation copy. */
export function preciseTotal(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  return `${formatDate(date)}, ${date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function dateTime(date: string, time: string) {
  return new Date(`${date}T${time || "12:00"}:00`).toISOString();
}

export function toEntryForm(item: CashEntryDto): EntryForm {
  const value = new Date(item.date);
  return {
    kind: item.kind,
    amount: String(item.amount),
    sourceId: item.sourceId ?? "",
    category: item.category,
    paymentMethod: item.paymentMethod,
    note: item.note ?? "",
    recurring: item.recurring ?? false,
    date: localDateString(value),
    time: localTimeString(value),
  };
}

const panelAliases: Record<string, PanelKind> = {
  entry: "entry",
  add: "entry",
  payout: "payout",
  source: "source",
};

/** Maps the `?panel=` search param (and its aliases) to a panel. */
export function panelFromParam(value: string | null): PanelKind | null {
  return value ? (panelAliases[value.toLowerCase()] ?? null) : null;
}

export const tabForPanel = (panel: PanelKind): Tab =>
  panel === "source" ? "sources" : "cashbook";
