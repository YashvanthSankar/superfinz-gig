import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GigDashboardDto, GigIncomeSourceDto } from "@superfinz/shared";
import { apiFetch } from "@/lib/api";
import {
  Button,
  Card,
  ErrorState,
  Field,
  Label,
  Loading,
  Screen,
  ThemeToggle,
  ui,
} from "@/components/ui";
import { colors } from "@/constants/theme";
import { useAuth } from "@/providers/auth-provider";

const splitFields = [
  ["essentialsPct", "Essentials"],
  ["workCostsPct", "Work costs"],
  ["emergencyPct", "Emergency cushion"],
  ["longTermPct", "Long-term savings"],
  ["flexiblePct", "Flexible spending"],
] as const;
export default function Settings() {
  const query = useQuery({
    queryKey: ["gig-dashboard"],
    queryFn: () =>
      apiFetch<{ dashboard: GigDashboardDto }>("/api/gig/dashboard"),
  });
  if (query.isLoading) return <Loading label="Loading settings…" />;
  if (query.isError || !query.data)
    return (
      <ErrorState
        title="Couldn’t load settings"
        body={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => query.refetch()}
      />
    );
  return (
    <SettingsForm
      key={query.data.dashboard.profile.updatedAt}
      dashboard={query.data.dashboard}
    />
  );
}

function SettingsForm({ dashboard }: { dashboard: GigDashboardDto }) {
  const { user, signOut } = useAuth();
  const client = useQueryClient();
  const [name, setName] = useState(dashboard.profile.preferredName);
  const [city, setCity] = useState(dashboard.profile.city);
  const [language, setLanguage] = useState(dashboard.profile.preferredLanguage);
  const [buffer, setBuffer] = useState(String(dashboard.profile.safetyBuffer));
  const [days, setDays] = useState(String(dashboard.profile.cushionTargetDays));
  const [split, setSplit] = useState({
    essentialsPct: String(dashboard.splitRule.essentialsPct),
    workCostsPct: String(dashboard.splitRule.workCostsPct),
    emergencyPct: String(dashboard.splitRule.emergencyPct),
    longTermPct: String(dashboard.splitRule.longTermPct),
    flexiblePct: String(dashboard.splitRule.flexiblePct),
  });
  const total = Object.values(split).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0,
  );
  const save = useMutation({
    mutationFn: () =>
      apiFetch("/api/gig/settings", {
        method: "PATCH",
        body: JSON.stringify({
          preferredName: name.trim(),
          city: city.trim(),
          preferredLanguage: language.trim(),
          safetyBuffer: Number(buffer),
          cushionTargetDays: Number(days),
          splitRule: {
            essentialsPct: Number(split.essentialsPct),
            workCostsPct: Number(split.workCostsPct),
            emergencyPct: Number(split.emergencyPct),
            longTermPct: Number(split.longTermPct),
            flexiblePct: Number(split.flexiblePct),
            enabled: dashboard.splitRule.enabled,
          },
        }),
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["gig-dashboard"] });
      Alert.alert("Saved", "Your protection settings are up to date.");
    },
    onError: (cause) =>
      Alert.alert(
        "Couldn’t save settings",
        cause instanceof Error ? cause.message : "Try again",
      ),
  });
  const sourceUpdate = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "ACTIVE" | "PAUSED" | "REVOKED";
    }) =>
      apiFetch("/api/gig/sources", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["gig-dashboard"] }),
    onError: (cause) =>
      Alert.alert(
        "Couldn’t update connection",
        cause instanceof Error ? cause.message : "Try again",
      ),
  });
  return (
    <Screen title="Settings" action={<ThemeToggle />}>
      <Card>
        <Label>Account</Label>
        <Text style={ui.h2}>{user?.name}</Text>
        <Text style={ui.body}>{user?.email}</Text>
        <Text style={ui.small}>
          Google identity is used for sign-in only. Financial planning data is
          stored separately.
        </Text>
      </Card>
      <Card>
        <Label>Worker profile</Label>
        <Field label="Preferred name" value={name} onChangeText={setName} />
        <Field label="City" value={city} onChangeText={setCity} />
        <Field
          label="Preferred language"
          value={language}
          onChangeText={setLanguage}
        />
        <Field
          label="Minimum safety buffer"
          value={buffer}
          onChangeText={setBuffer}
          keyboardType="decimal-pad"
        />
        <Field
          label="Cushion target (days)"
          value={days}
          onChangeText={setDays}
          keyboardType="number-pad"
        />
      </Card>
      <Card>
        <Label>Default payout rule</Label>
        {splitFields.map(([key, label]) => (
          <Field
            key={key}
            label={`${label} (%)`}
            value={split[key]}
            onChangeText={(value) =>
              setSplit((current) => ({ ...current, [key]: value }))
            }
            keyboardType="decimal-pad"
          />
        ))}
        <View style={styles.total}>
          <Label>Total</Label>
          <Text
            style={[styles.totalValue, total !== 100 && { color: colors.red }]}
          >
            {total}%
          </Text>
        </View>
        <Text style={ui.small}>
          This is a planning rule. No money moves unless a future regulated
          integration is separately consented to.
        </Text>
        <Button
          title="Save settings"
          loading={save.isPending}
          disabled={
            !name.trim() ||
            !city.trim() ||
            Number(buffer) < 0 ||
            Number(days) < 7 ||
            total !== 100
          }
          onPress={() => save.mutate()}
        />
      </Card>
      <Card>
        <Label>Connections and consent</Label>
        {dashboard.sources.map((source) => (
          <SourceControl
            key={source.id}
            source={source}
            busy={sourceUpdate.isPending}
            onUpdate={(status) =>
              sourceUpdate.mutate({ id: source.id, status })
            }
          />
        ))}
        <Text style={ui.small}>
          A revoked source is excluded from forecasts. Prototype connections
          never access a real bank or platform account.
        </Text>
      </Card>
      <Card>
        <Label>Security</Label>
        <Text style={ui.body}>
          Access tokens expire after 15 minutes. Refresh tokens rotate and only
          their SHA-256 hashes are stored on the server.
        </Text>
        <Button title="Sign out" tone="quiet" onPress={() => signOut()} />
      </Card>
    </Screen>
  );
}

function SourceControl({
  source,
  busy,
  onUpdate,
}: {
  source: GigIncomeSourceDto;
  busy: boolean;
  onUpdate: (status: "ACTIVE" | "PAUSED" | "REVOKED") => void;
}) {
  return (
    <View style={styles.source}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sourceName}>{source.name}</Text>
        <Text style={ui.small}>
          {source.status.toLowerCase()} ·{" "}
          {source.prototype ? "prototype data" : "live"}
          {source.consentAt
            ? ` · consent ${new Date(source.consentAt).toLocaleDateString("en-IN")}`
            : ""}
        </Text>
      </View>
      <View style={styles.sourceActions}>
        {source.status === "ACTIVE" ? (
          <Button
            title="Pause"
            tone="quiet"
            disabled={busy}
            onPress={() => onUpdate("PAUSED")}
          />
        ) : source.status === "PAUSED" ? (
          <Button
            title="Resume"
            tone="quiet"
            disabled={busy}
            onPress={() => onUpdate("ACTIVE")}
          />
        ) : null}
        <Button
          title="Revoke"
          tone="quiet"
          disabled={busy || source.status === "REVOKED"}
          onPress={() =>
            Alert.alert(
              "Revoke source?",
              "It will be removed from future forecasts. Existing imported entries remain in the cashbook.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Revoke",
                  style: "destructive",
                  onPress: () => onUpdate("REVOKED"),
                },
              ],
            )
          }
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalValue: {
    color: colors.green,
    fontSize: 24,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  source: {
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: colors.paper2,
  },
  sourceName: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  sourceActions: { flexDirection: "row", gap: 8 },
});
