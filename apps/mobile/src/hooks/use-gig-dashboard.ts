import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useQuery, type QueryClient } from "@tanstack/react-query";
import type { GigDashboardDto } from "@superfinz/shared";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

export const gigDashboardQueryKey = ["gig-dashboard"] as const;

export const gigDashboardQueryKeyForUser = (userId: string) =>
  [...gigDashboardQueryKey, userId] as const;

export function useGigDashboard() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: gigDashboardQueryKeyForUser(user?.id ?? "signed-out"),
    queryFn: () =>
      apiFetch<{ dashboard: GigDashboardDto }>("/api/gig/dashboard"),
    enabled: Boolean(user?.id),
  });
  const { refetch } = query;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  return query;
}

export function setGigDashboard(
  client: QueryClient,
  userId: string,
  dashboard: GigDashboardDto,
) {
  client.setQueryData(gigDashboardQueryKeyForUser(userId), { dashboard });
}

export function refreshGigDashboard(client: QueryClient) {
  return client.invalidateQueries({
    queryKey: gigDashboardQueryKey,
    refetchType: "all",
  });
}
