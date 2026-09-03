"use client";

import { useCallback, useEffect, useState } from "react";
import type { GigDashboardDto } from "@superfinz/shared";

export function useGigDashboard() {
  const [dashboard, setDashboard] = useState<GigDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gig/dashboard", { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Could not load your plan");
      setDashboard(body.dashboard as GigDashboardDto);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load your plan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { dashboard, loading, error, refresh };
}

export async function jsonRequest<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "That action did not complete");
  return body as T;
}
