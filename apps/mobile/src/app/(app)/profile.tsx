import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { GigDashboardDto, GigIncomeSourceDto } from "@superfinz/shared";
import { ChartPie, Link2, LogOut, UserRound } from "lucide-react-native";
import { apiFetch } from "@/lib/api";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  ListRow,
  Loading,
  Notice,
  Screen,
  SectionHeader,
  ThemeToggle,
  formatDate,
  formatMoney,
  ui,
  type BadgeTone,
} from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { useAuth } from "@/providers/auth-provider";
import {
  refreshGigDashboard,
  useGigDashboard,
} from "@/hooks/use-gig-dashboard";

type Section = "PROFILE" | "SPLIT" | "SOURCES";
type SourceStatus = "ACTIVE" | "PAUSED" | "REVOKED";
type ProfileErrorKey = "name" | "city" | "buffer" | "days";
type ProfileErrors = Partial<Record<ProfileErrorKey, string>>;

const splitFields = [
  ["essentialsPct", "Essentials"],
  ["workCostsPct", "Work costs"],
  ["emergencyPct", "Emergency cushion"],
  ["longTermPct", "Long-term savings"],
  ["flexiblePct", "Flexible spending"],
] as const;

const sectionTitles: Record<Section, string> = {
  PROFILE: "Personal and safety settings",
  SPLIT: "Payout percentages",
  SOURCES: "Income sources",
};

const statusMeta: Record<
  GigIncomeSourceDto["status"],
  { label: string; tone: BadgeTone }
> = {
  ACTIVE: { label: "Active", tone: "good" },
  PAUSED: { label: "Paused", tone: "warn" },
  REVOKED: { label: "Revoked", tone: "bad" },
  ERROR: { label: "Needs attention", tone: "bad" },
};

function initials(name?: string | null) {
  const letters = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");
  return letters ? letters.toUpperCase() : "SF";
}

function sourceSummary(sources: GigIncomeSourceDto[]) {
  const counts: Partial<Record<GigIncomeSourceDto["status"], number>> = {};
  for (const source of sources)
    counts[source.status] = (counts[source.status] ?? 0) + 1;
  const parts: string[] = [];
  if (counts.ACTIVE) parts.push(`${counts.ACTIVE} active`);
  if (counts.PAUSED) parts.push(`${counts.PAUSED} paused`);
  if (counts.ERROR)
    parts.push(
      `${counts.ERROR} ${counts.ERROR === 1 ? "needs" : "need"} attention`,
    );
  if (counts.REVOKED) parts.push(`${counts.REVOKED} revoked`);
  return parts.length > 0 ? parts.join(" · ") : "No sources yet";
}

export default function Settings() {
  const query = useGigDashboard();
  const [openSection, setOpenSection] = useState<Section | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [saved]);

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
      refreshing={query.isFetching}
      openSection={openSection}
      onToggleSection={(section) =>
        setOpenSection((value) => (value === section ? null : section))
      }
      saved={saved}
      onSaved={() => setSaved(true)}
    />
  );
}

function SettingsForm({
  dashboard,
  refreshing,
  openSection,
  onToggleSection,
  saved,
  onSaved,
}: {
  dashboard: GigDashboardDto;
  refreshing: boolean;
  openSection: Section | null;
  onToggleSection: (section: Section) => void;
  saved: boolean;
  onSaved: () => void;
}) {
  const { user, signOut } = useAuth();
  const client = useQueryClient();
  const [name, setName] = useState(dashboard.profile.preferredName);
  const [city, setCity] = useState(dashboard.profile.city);
  const [buffer, setBuffer] = useState(String(dashboard.profile.safetyBuffer));
  const [days, setDays] = useState(String(dashboard.profile.cushionTargetDays));
  const [split, setSplit] = useState({
    essentialsPct: String(dashboard.splitRule.essentialsPct),
    workCostsPct: String(dashboard.splitRule.workCostsPct),
    emergencyPct: String(dashboard.splitRule.emergencyPct),
    longTermPct: String(dashboard.splitRule.longTermPct),
    flexiblePct: String(dashboard.splitRule.flexiblePct),
  });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [attempted, setAttempted] = useState(false);

  const total = Object.values(split).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0,
  );
  const splitError =
    total === 100 ? null : `Total must be 100% (now ${total}%)`;

  const save = useMutation({
    mutationFn: () =>
      apiFetch("/api/gig/settings", {
        method: "PATCH",
        body: JSON.stringify({
          preferredName: name.trim(),
          city: city.trim(),
          preferredLanguage: dashboard.profile.preferredLanguage,
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
      await refreshGigDashboard(client);
      onSaved();
    },
    onError: (cause) =>
      Alert.alert(
        "Couldn’t save settings",
        cause instanceof Error ? cause.message : "Try again",
      ),
  });
  const sourceUpdate = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SourceStatus }) =>
      apiFetch("/api/gig/sources", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      }),
    onSuccess: () => refreshGigDashboard(client),
    onError: (cause) =>
      Alert.alert(
        "Couldn’t update connection",
        cause instanceof Error ? cause.message : "Try again",
      ),
  });

  const clearError = (key: ProfileErrorKey) =>
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });

  const validateProfile = (): ProfileErrors => {
    const next: ProfileErrors = {};
    if (!name.trim()) next.name = "Enter a preferred name.";
    if (!city.trim()) next.city = "Enter your city.";
    if (
      buffer.trim() === "" ||
      !Number.isFinite(Number(buffer)) ||
      Number(buffer) < 0
    )
      next.buffer = "Enter ₹0 or more.";
    if (days.trim() === "" || !Number.isFinite(Number(days)) || Number(days) < 7)
      next.days = "Enter at least 7 days.";
    return next;
  };

  const handleSave = () => {
    const next = validateProfile();
    setErrors(next);
    setAttempted(true);
    if (Object.keys(next).length > 0 || splitError) return;
    save.mutate();
  };

  const profileErrorList = Object.values(errors).filter(
    (value): value is string => Boolean(value),
  );

  const errorNotice = (section: "PROFILE" | "SPLIT") => {
    if (!attempted) return null;
    const hereCount =
      section === "PROFILE" ? profileErrorList.length : splitError ? 1 : 0;
    const elsewhere =
      section === "PROFILE"
        ? splitError
          ? [`${sectionTitles.SPLIT}: ${splitError}`]
          : []
        : profileErrorList.map(
            (message) => `${sectionTitles.PROFILE}: ${message}`,
          );
    if (hereCount === 0 && elsewhere.length === 0) return null;
    // The split section already explains its own total with the live notice.
    if (section === "SPLIT" && elsewhere.length === 0) return null;
    return (
      <Notice
        tone="bad"
        title={
          hereCount > 0
            ? "Check the highlighted fields"
            : "Fix another section first"
        }
      >
        {elsewhere.length > 0 ? elsewhere.join("\n") : undefined}
      </Notice>
    );
  };

  const confirmSignOut = () =>
    Alert.alert(
      "Sign out?",
      "You will need to sign in with Google again on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => void signOut(),
        },
      ],
    );

  const sectionHint = (section: Section) =>
    openSection === section
      ? "Closes this section"
      : "Opens this section below the list";

  return (
    <Screen
      back
      eyebrow="Settings"
      title="Keep the plan yours"
      subtitle="Change your details, how payouts are divided, and which income sources feed the plan."
      action={<ThemeToggle />}
      help={{
        title: "Settings",
        body: "Change only what you need. Your safety buffer is money you always want kept away from Safe to spend.",
      }}
      refreshing={refreshing}
    >
      <Card>
        <View style={ui.row}>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials(user?.name)}</Text>
          </View>
          <View style={styles.accountText}>
            <Text style={ui.h3}>{user?.name ?? "Your account"}</Text>
            {user?.email && <Text style={ui.small}>{user.email}</Text>}
          </View>
        </View>
      </Card>

      <Card padded={false} style={styles.listCard}>
        <ListRow
          icon={UserRound}
          title={sectionTitles.PROFILE}
          subtitle={`Buffer ${formatMoney(dashboard.profile.safetyBuffer)} · cushion ${dashboard.profile.cushionTargetDays} days`}
          accessibilityHint={sectionHint("PROFILE")}
          onPress={() => onToggleSection("PROFILE")}
        />
        <ListRow
          icon={ChartPie}
          title={sectionTitles.SPLIT}
          subtitle={splitFields
            .map(([key]) => String(dashboard.splitRule[key]))
            .join(" · ")}
          accessibilityHint={sectionHint("SPLIT")}
          onPress={() => onToggleSection("SPLIT")}
        />
        <ListRow
          icon={Link2}
          title={sectionTitles.SOURCES}
          subtitle={sourceSummary(dashboard.sources)}
          accessibilityHint={sectionHint("SOURCES")}
          onPress={() => onToggleSection("SOURCES")}
          last
        />
      </Card>

      {openSection === "PROFILE" && (
        <Card>
          <SectionHeader
            title="Personal and safety"
            description="Your name, city, and the money you always keep aside."
          />
          <Field
            label="Preferred name"
            required
            value={name}
            onChangeText={(value) => {
              setName(value);
              clearError("name");
            }}
            error={errors.name}
            autoComplete="name-given"
            textContentType="givenName"
          />
          <Field
            label="City"
            required
            value={city}
            onChangeText={(value) => {
              setCity(value);
              clearError("city");
            }}
            placeholder="Your city"
            error={errors.city}
            textContentType="addressCity"
          />
          <Field
            label="Money to always keep safe"
            required
            prefix="₹"
            keyboardType="decimal-pad"
            value={buffer}
            onChangeText={(value) => {
              setBuffer(value);
              clearError("buffer");
            }}
            hint="Kept out of Safe to spend, whatever happens."
            error={errors.buffer}
          />
          <Field
            label="Emergency cover goal"
            required
            suffix="days"
            keyboardType="number-pad"
            value={days}
            onChangeText={(value) => {
              setDays(value);
              clearError("days");
            }}
            hint="How many days of costs your cushion should cover. At least 7."
            error={errors.days}
          />
          {errorNotice("PROFILE")}
          {saved && (
            <Notice tone="good" live>
              Settings saved
            </Notice>
          )}
          <Button
            title="Save changes"
            tone="accent"
            loading={save.isPending}
            onPress={handleSave}
          />
        </Card>
      )}

      {openSection === "SPLIT" && (
        <Card>
          <SectionHeader
            title="Payout percentages"
            description="How each payout is divided the moment it arrives."
          />
          {splitFields.map(([key, label]) => (
            <Field
              key={key}
              label={label}
              required
              suffix="%"
              keyboardType="decimal-pad"
              value={split[key]}
              onChangeText={(value) =>
                setSplit((current) => ({ ...current, [key]: value }))
              }
            />
          ))}
          <Notice tone={total === 100 ? "good" : "warn"}>
            {splitError ?? "Total is 100%"}
          </Notice>
          {errorNotice("SPLIT")}
          {saved && (
            <Notice tone="good" live>
              Settings saved
            </Notice>
          )}
          <Button
            title="Save changes"
            tone="accent"
            loading={save.isPending}
            onPress={handleSave}
          />
        </Card>
      )}

      {openSection === "SOURCES" && (
        <Card>
          <SectionHeader
            title="Income sources"
            description="Pause or remove a connection at any time. Imported cashbook entries stay."
          />
          {dashboard.sources.length === 0 ? (
            <EmptyState
              icon={Link2}
              title="No income sources yet"
              body="Sources are added during setup and feed the payout forecast."
            />
          ) : (
            dashboard.sources.map((source, index) => (
              <SourceRow
                key={source.id}
                source={source}
                last={index === dashboard.sources.length - 1}
                busy={sourceUpdate.isPending}
                pendingStatus={
                  sourceUpdate.isPending &&
                  sourceUpdate.variables?.id === source.id
                    ? sourceUpdate.variables.status
                    : null
                }
                onUpdate={(status) =>
                  sourceUpdate.mutate({ id: source.id, status })
                }
              />
            ))
          )}
          <Notice tone="info">
            Prototype sources do not access a real bank or work platform.
          </Notice>
        </Card>
      )}

      <Card padded={false} style={styles.listCard}>
        <ListRow
          icon={LogOut}
          iconTone="bad"
          destructive
          title="Sign out"
          subtitle="Removes the session from this device"
          accessibilityHint="Asks you to confirm first"
          onPress={confirmSignOut}
          last
        />
      </Card>
    </Screen>
  );
}

function SourceRow({
  source,
  last,
  busy,
  pendingStatus,
  onUpdate,
}: {
  source: GigIncomeSourceDto;
  last: boolean;
  busy: boolean;
  pendingStatus: SourceStatus | null;
  onUpdate: (status: SourceStatus) => void;
}) {
  const status = statusMeta[source.status];
  const primary: { title: string; status: SourceStatus } =
    source.status === "ACTIVE"
      ? { title: "Pause", status: "PAUSED" }
      : source.status === "PAUSED"
        ? { title: "Resume", status: "ACTIVE" }
        : { title: "Reconnect", status: "ACTIVE" };
  const platform = source.prototype ? "Simulated platform" : "Connected platform";
  const sync = source.lastSyncAt
    ? `last sync ${formatDate(source.lastSyncAt)}`
    : "not synced yet";

  const confirmRevoke = () =>
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
    );

  return (
    <View style={[styles.source, last && styles.sourceLast]}>
      <ListRow title={source.name} subtitle={`${platform} · ${sync}`} chevron={false} last>
        <View style={styles.badges}>
          <Badge label={status.label} tone={status.tone} />
          {source.prototype && <Badge label="Prototype" tone="neutral" />}
        </View>
      </ListRow>
      <View style={styles.sourceActions}>
        <Button
          title={primary.title}
          size="sm"
          tone="quiet"
          inline
          disabled={busy}
          loading={pendingStatus === primary.status}
          onPress={() => onUpdate(primary.status)}
        />
        <Button
          title="Revoke"
          size="sm"
          tone="dangerSoft"
          inline
          disabled={busy || source.status === "REVOKED"}
          loading={pendingStatus === "REVOKED"}
          accessibilityHint="Asks you to confirm first"
          onPress={confirmRevoke}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** ListRow has no horizontal inset of its own; give flush cards one. */
  listCard: { paddingHorizontal: space.lg },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.onPrimary,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  accountText: { flex: 1, gap: 2 },
  source: {
    gap: space.sm,
    paddingBottom: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sourceLast: { borderBottomWidth: 0, paddingBottom: 0 },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    marginTop: space.xs,
  },
  sourceActions: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
});
