"use client";

import type { GigVirtualTabDto } from "@superfinz/shared";
import { LockKeyhole } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function ExpenseSourceSelection({
  tabs,
  amount,
  selectedTabId,
  onSelect,
  disabled = false,
}: {
  tabs: GigVirtualTabDto[];
  amount: number;
  selectedTabId: string | null;
  onSelect: (tabId: string) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="grid gap-3">
      <legend className="text-sm font-black">Pay from savings tab</legend>
      <p className="text-sm font-semibold text-ink-soft">
        Choose an unlocked tab with enough available money.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {tabs.map((tab) => {
          const locked = tab.isLocked;
          const insufficient = tab.balance < amount;
          const unavailable = locked || insufficient;
          return (
            <label
              key={tab.id}
              className={`flex min-h-16 items-center justify-between gap-3 border-2 border-ink p-4 ${
                unavailable ? "cursor-not-allowed opacity-55" : "cursor-pointer hover:bg-accent-soft"
              } ${selectedTabId === tab.id ? "bg-accent-soft" : "bg-paper"}`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <input
                  type="radio"
                  name="expense-source"
                  value={tab.id}
                  checked={selectedTabId === tab.id}
                  onChange={() => onSelect(tab.id)}
                  disabled={unavailable}
                  className="h-5 w-5 accent-accent"
                />
                <span className="min-w-0">
                  <span className="block truncate font-black">{tab.tabName}</span>
                  <span className="block text-xs font-bold text-ink-soft">
                    {locked ? "Locked" : insufficient ? "Not enough funds" : "Available"}
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2 text-right">
                {locked && <LockKeyhole aria-label="Locked" size={16} />}
                <span className="num font-black">{formatCurrency(tab.balance)}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}