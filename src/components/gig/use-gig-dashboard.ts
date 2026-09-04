"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GigDashboardDto } from "@superfinz/shared";

/**
 * Loads the gig dashboard and exposes two distinct states:
 * - `loading`: true only until the first successful load (show a full panel)
 * - `refreshing`: true while re-fetching after a mutation (keep stale data on screen)
 */
export function useGigDashboard() {
  const [dashboard, setDashboard] = useState<GigDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasData = useRef(false);

  const refresh = useCallback(async () => {
    setError(null);
    if (hasData.current) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await fetch("/api/gig/dashboard", { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Could not load your plan");
      setDashboard(body.dashboard as GigDashboardDto);
      hasData.current = true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load your plan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { dashboard, loading, refreshing, error, refresh };
}

export async function jsonRequest<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "That action did not complete");
  return body as T;
}

/** Today's date as YYYY-MM-DD in the user's local time zone (not UTC). */
export function localDateString(date: Date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Current time as HH:MM in the user's local time zone. */
export function localTimeString(date: Date = new Date()) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
