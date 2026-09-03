"use client";

import { useState } from "react";
import type { GigVirtualTabDto } from "@superfinz/shared";
import { ExpenseSourceSelection } from "@/components/gig/expense-source-selection";
import { formatCurrency } from "@/lib/utils";

export function SavingsClient({
  initialTabs,
}: {
  initialTabs: GigVirtualTabDto[];
}) {
  const [tabs, setTabs] = useState(initialTabs);
  const [tabName, setTabName] = useState("");
  const [balance, setBalance] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const response = await fetch("/api/gig/virtual-tabs", { cache: "no-store" });
    const data = (await response.json()) as { tabs?: GigVirtualTabDto[] };
    if (response.ok && data.tabs) setTabs(data.tabs);
  };
  const createTab = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/gig/virtual-tabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabName, balance: Number(balance) }),
      });
      const data = (await response.json()) as { tab?: GigVirtualTabDto; error?: string };
      if (!response.ok || !data.tab) throw new Error(data.error ?? "Could not create tab");
      setTabs((current) => [...current, data.tab!]);
      setTabName("");
      setBalance("");
      setMessage("Savings tab created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create tab");
    } finally {
      setBusy(false);
    }
  };
  const logExpense = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedTabId) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/gig/virtual-tabs/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tabId: selectedTabId,
          amount: Number(amount),
          category,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const data = (await response.json()) as { tab?: GigVirtualTabDto; error?: string };
      if (!response.ok || !data.tab) throw new Error(data.error ?? "Could not log expense");
      await refresh();
      setAmount("");
      setCategory("");
      setSelectedTabId(null);
      setMessage("Expense logged and savings tab balance updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not log expense");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="brut-label">Virtual savings accounts</p>
        <h1 className="mt-2 text-3xl font-black">Give every rupee a job.</h1>
        <p className="mt-2 max-w-2xl font-semibold text-ink-soft">
          These are planning tabs inside your recorded balance, not separate bank accounts.
        </p>
      </header>
      <section className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={createTab} className="brut-card space-y-4 p-5">
          <h2 className="text-xl font-black">Create a savings tab</h2>
          <label className="grid gap-2 text-sm font-bold">Tab name<input required maxLength={60} value={tabName} onChange={(event) => setTabName(event.target.value)} className="min-h-12 border-2 border-ink bg-paper px-3" placeholder="Trip" /></label>
          <label className="grid gap-2 text-sm font-bold">Starting balance (₹)<input required min="0" step="0.01" type="number" value={balance} onChange={(event) => setBalance(event.target.value)} className="min-h-12 border-2 border-ink bg-paper px-3" placeholder="250" /></label>
          <button disabled={busy} className="brut-btn min-h-12 bg-accent text-paper">Create tab</button>
        </form>
        <form onSubmit={logExpense} className="brut-card space-y-4 p-5">
          <h2 className="text-xl font-black">Log an expense</h2>
          <label className="grid gap-2 text-sm font-bold">Amount (₹)<input required min="0.01" step="0.01" type="number" value={amount} onChange={(event) => { setAmount(event.target.value); setSelectedTabId(null); }} className="min-h-12 border-2 border-ink bg-paper px-3" placeholder="39" /></label>
          <label className="grid gap-2 text-sm font-bold">Category<input required maxLength={60} value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-12 border-2 border-ink bg-paper px-3" placeholder="Transport" /></label>
          <ExpenseSourceSelection tabs={tabs} amount={Number(amount) || 0} selectedTabId={selectedTabId} onSelect={setSelectedTabId} disabled={busy} />
          <button disabled={busy || !selectedTabId} className="brut-btn min-h-12 bg-ink text-paper">Log expense</button>
        </form>
      </section>
      {message && <p role="status" className="border-2 border-ink bg-good-soft p-4 font-bold">{message}</p>}
      <section className="brut-card p-5">
        <h2 className="text-xl font-black">Your savings tabs</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tabs.map((tab) => <article key={tab.id} className={`border-2 border-ink p-4 ${tab.isSystem ? "bg-good-soft" : "bg-paper"}`}><p className="font-black">{tab.tabName}</p><p className="num mt-2 text-2xl font-black">{formatCurrency(tab.balance)}</p><p className="mt-1 text-xs font-bold text-ink-soft">{tab.isSystem ? "Always protected" : tab.isLocked ? "Locked" : "Unlocked"}</p></article>)}
          {!tabs.length && <p className="text-sm font-semibold text-ink-soft">Create your first tab to separate a savings goal.</p>}
        </div>
      </section>
    </div>
  );
}