import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import {
  GIG_PRIORITIES,
  GIG_WORK_TYPES,
  type CommitmentRecurrence,
  type GigPriority,
  type GigWorkType,
} from "@superfinz/shared";
import { apiFetch } from "@/lib/api";
import {
  Button,
  Card,
  Field,
  Label,
  Money,
  Progress,
  Screen,
  ui,
} from "@/components/ui";
import { DateField } from "@/components/date-field";
import { colors } from "@/constants/theme";
import { useAuth } from "@/providers/auth-provider";

const workLabels: Record<GigWorkType, string> = {
  DELIVERY: "Delivery",
  RIDE_HAILING: "Driving / rides",
  HOME_SERVICES: "Home services",
  FREELANCE: "Freelance work",
  STREET_VENDING: "Street vending",
  DAILY_WAGE: "Daily wage work",
  DOMESTIC_WORK: "Domestic work",
  OTHER: "Other work",
};

const priorityLabels: Record<GigPriority, string> = {
  STABLE_WEEKLY_SPENDING: "Know what I can safely spend",
  EMERGENCY_CUSHION: "Build emergency savings",
  UPCOMING_BILLS: "Pay my bills on time",
  WORK_EXPENSES: "Protect fuel and work costs",
  AVOIDING_DEBT: "Avoid borrowing for daily needs",
};

const billPresets = [
  "Rent",
  "Electricity",
  "Gas",
  "School fees",
  "Mobile",
  "Loan / EMI",
  "Family support",
] as const;
const spendingCategories = [
  "Rent / home",
  "Food",
  "Transport / fuel",
  "Family support",
  "Utilities",
  "Personal spending",
] as const;

const recurrenceOptions: Array<{
  value: CommitmentRecurrence;
  label: string;
}> = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Every 3 months" },
  { value: "YEARLY", label: "Yearly" },
  { value: "ONE_TIME", label: "One time" },
];

const recurrenceLabels: Record<CommitmentRecurrence, string> = {
  WEEKLY: "Weekly",
  FORTNIGHTLY: "Every 2 weeks",
  MONTHLY: "Monthly",
  QUARTERLY: "Every 3 months",
  YEARLY: "Yearly",
  ONE_TIME: "One time",
};

const starterSplit = {
  essentialsPct: 55,
  workCostsPct: 15,
  emergencyPct: 10,
  longTermPct: 5,
  flexiblePct: 15,
};

const splitRows = [
  ["Bills and needs", starterSplit.essentialsPct],
  ["Work costs", starterSplit.workCostsPct],
  ["Emergency savings", starterSplit.emergencyPct],
  ["Future savings", starterSplit.longTermPct],
  ["Safe to spend", starterSplit.flexiblePct],
] as const;

const steps = [
  {
    title: "About you",
    subtitle: "Let’s start with the basics.",
    help: "Your name makes the app personal. Your city helps us use familiar examples. You can change both later.",
  },
  {
    title: "Your work",
    subtitle: "Choose all the work you do.",
    help: "This helps SuperFinz understand that your earnings may change from week to week.",
  },
  {
    title: "Your main goal",
    subtitle: "Choose what would help you most.",
    help: "There is no wrong choice. This only changes what SuperFinz shows first.",
  },
  {
    title: "Your payouts",
    subtitle: "Tell us where your main income comes from.",
    help: "A payout is money you receive from a platform, client, shop, or other work.",
  },
  {
    title: "A week of earnings",
    subtitle: "Enter what reaches you after app fees.",
    help: "Use rough take-home amounts. A low week is difficult, a normal week is most weeks, and a good week is one of your better weeks.",
  },
  {
    title: "Cost of working",
    subtitle: "Keep aside money needed to earn again.",
    help: "Work costs include fuel, travel, data, tools, repairs, or supplies. App fees are already excluded from the earnings you entered.",
  },
  {
    title: "Money you have now",
    subtitle: "This helps us avoid showing too much as safe to spend.",
    help: "Available balance is the money you can use today. Emergency savings should only be used when something goes wrong.",
  },
  {
    title: "Important bills",
    subtitle: "Add the payments your family cannot miss.",
    help: "Add rent, electricity, gas, school fees, EMIs, or family support. SuperFinz protects these before showing safe spending money.",
  },
  {
    title: "How should we learn?",
    subtitle: "Choose your starting pace.",
    help: "Start with a safe baseline, or let SuperFinz learn from your real entries for 1–2 months before personalising the split.",
  },
  {
    title: "Your starter plan",
    subtitle: "Review one simple rule for every payout.",
    help: "This is only a plan. SuperFinz does not move real money. You can change the percentages later.",
  },
] as const;

type BillDraft = {
  id: string;
  title: string;
  amount: string;
  dueDate: string;
  recurrence: CommitmentRecurrence;
};

type Draft = {
  preferredName: string;
  city: string;
  workTypes: GigWorkType[];
  priority: GigPriority;
  sourceName: string;
  low: string;
  typical: string;
  good: string;
  payoutDate: string;
  workDays: string;
  workCosts: string;
  balance: string;
  cushion: string;
  safetyBuffer: string;
  bills: BillDraft[];
  billName: string;
  billAmount: string;
  billDate: string;
  billRecurrence: CommitmentRecurrence;
  trackingMode: "START_NOW" | "OBSERVE_LEARN";
  essentialCategories: string[];
  hardestToProtect: string;
  confirmed: boolean;
};

const isNonNegative = (value: string) =>
  value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0;

const isPositive = (value: string) =>
  value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) > 0;

export default function Onboarding() {
  const { user, reloadUser } = useAuth();
  const draftKey = useMemo(
    () => `superfinz:gig-onboarding:v4:${user?.id ?? "pending"}`,
    [user?.id],
  );
  const [step, setStep] = useState(0);
  const [preferredName, setPreferredName] = useState(
    user?.name?.split(" ")[0] ?? "",
  );
  const [city, setCity] = useState("");
  const [workTypes, setWorkTypes] = useState<GigWorkType[]>([]);
  const [priority, setPriority] = useState<GigPriority>(
    "STABLE_WEEKLY_SPENDING",
  );
  const [sourceName, setSourceName] = useState("");
  const [low, setLow] = useState("");
  const [typical, setTypical] = useState("");
  const [good, setGood] = useState("");
  const [payoutDate, setPayoutDate] = useState(
    () => new Date(Date.now() + 3 * 86_400_000),
  );
  const [workDays, setWorkDays] = useState("");
  const [workCosts, setWorkCosts] = useState("");
  const [balance, setBalance] = useState("");
  const [cushion, setCushion] = useState("");
  const [safetyBuffer, setSafetyBuffer] = useState("");
  const [trackingMode, setTrackingMode] = useState<"START_NOW" | "OBSERVE_LEARN">("START_NOW");
  const [essentialCategories, setEssentialCategories] = useState<string[]>(["Rent / home", "Food"]);
  const [hardestToProtect, setHardestToProtect] = useState("");
  const [bills, setBills] = useState<BillDraft[]>([]);
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billDate, setBillDate] = useState(
    () => new Date(Date.now() + 8 * 86_400_000),
  );
  const [billRecurrence, setBillRecurrence] =
    useState<CommitmentRecurrence>("MONTHLY");
  const [confirmed, setConfirmed] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  const weeklyOrderValid =
    isNonNegative(low) &&
    isPositive(typical) &&
    isNonNegative(good) &&
    Number(low) <= Number(typical) &&
    Number(typical) <= Number(good);
  const workCostsValid =
    isPositive(workDays) && Number(workDays) <= 7 && isNonNegative(workCosts);
  const moneyNowValid =
    isNonNegative(balance) &&
    isNonNegative(cushion) &&
    isNonNegative(safetyBuffer);
  const stepValid = [
    Boolean(preferredName.trim() && city.trim()),
    workTypes.length > 0,
    Boolean(priority),
    Boolean(sourceName.trim()),
    weeklyOrderValid,
    workCostsValid,
    moneyNowValid,
    true,
    Boolean(trackingMode),
    confirmed,
  ][step];
  const meta = steps[step];

  const draft: Draft = useMemo(
    () => ({
      preferredName,
      city,
      workTypes,
      priority,
      sourceName,
      low,
      typical,
      good,
      payoutDate: payoutDate.toISOString(),
      workDays,
      workCosts,
      balance,
      cushion,
      safetyBuffer,
      bills,
      billName,
      billAmount,
      billDate: billDate.toISOString(),
      billRecurrence,
      trackingMode,
      essentialCategories,
      hardestToProtect,
      confirmed,
    }),
    [
      preferredName,
      city,
      workTypes,
      priority,
      sourceName,
      low,
      typical,
      good,
      payoutDate,
      workDays,
      workCosts,
      balance,
      cushion,
      safetyBuffer,
      bills,
      billName,
      billAmount,
      billDate,
      billRecurrence,
      trackingMode,
      essentialCategories,
      hardestToProtect,
      confirmed,
    ],
  );

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(draftKey)
      .then((raw) => {
        if (!mounted || !raw) return;
        const saved = JSON.parse(raw) as Draft;
        setPreferredName(saved.preferredName);
        setCity(saved.city);
        setWorkTypes(saved.workTypes);
        setPriority(saved.priority);
        setSourceName(saved.sourceName);
        setLow(saved.low);
        setTypical(saved.typical);
        setGood(saved.good);
        setPayoutDate(new Date(saved.payoutDate));
        setWorkDays(saved.workDays);
        setWorkCosts(saved.workCosts);
        setBalance(saved.balance);
        setCushion(saved.cushion);
        setSafetyBuffer(saved.safetyBuffer);
        setBills(saved.bills ?? []);
        setBillName(saved.billName ?? "");
        setBillAmount(saved.billAmount ?? "");
        setBillDate(new Date(saved.billDate));
        setBillRecurrence(saved.billRecurrence ?? "MONTHLY");
        setTrackingMode(saved.trackingMode ?? "START_NOW");
        setEssentialCategories(saved.essentialCategories ?? ["Rent / home", "Food"]);
        setHardestToProtect(saved.hardestToProtect ?? "");
        setConfirmed(saved.confirmed);
      })
      .catch(() => undefined)
      .finally(() => mounted && setReady(true));
    return () => {
      mounted = false;
    };
  }, [draftKey]);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(
      () =>
        AsyncStorage.setItem(draftKey, JSON.stringify(draft)).catch(
          () => undefined,
        ),
      250,
    );
    return () => clearTimeout(timer);
  }, [ready, draftKey, draft]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (step === 0) return false;
          setStep((value) => Math.max(0, value - 1));
          return true;
        },
      );
      return () => subscription.remove();
    }, [step]),
  );

  const toggleWork = (value: GigWorkType) =>
    setWorkTypes((items) =>
      items.includes(value)
        ? items.filter((item) => item !== value)
        : [...items, value],
    );

  const addBill = () => {
    if (!billName.trim() || !isPositive(billAmount)) {
      Alert.alert("Add the bill", "Enter a bill name and an amount above ₹0.");
      return;
    }
    setBills((items) => [
      ...items,
      {
        id: `${Date.now()}-${items.length}`,
        title: billName.trim(),
        amount: billAmount,
        dueDate: billDate.toISOString(),
        recurrence: billRecurrence,
      },
    ]);
    setBillName("");
    setBillAmount("");
  };

  const submit = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/gig/onboarding", {
        method: "POST",
        body: JSON.stringify({
          preferredName: preferredName.trim(),
          city: city.trim(),
          preferredLanguage: "English",
          workTypes,
          primaryPriority: priority,
          lowWeekIncome: Number(low),
          typicalWeekIncome: Number(typical),
          goodWeekIncome: Number(good),
          workDaysPerWeek: Number(workDays),
          platformDeductionRate: 0,
          weeklyWorkCosts: Number(workCosts),
          openingBalance: Number(balance),
          currentCushion: Number(cushion),
          safetyBuffer: Number(safetyBuffer),
          cushionTargetDays: 30,
          sources: [
            {
              name: sourceName.trim(),
              type: "PLATFORM_PAYOUT",
              frequency: "WEEKLY",
              typicalMin: Number(low),
              typicalMax: Number(good),
              nextPayoutAt: payoutDate.toISOString(),
              connectionMode: "MANUAL",
              prototype: true,
            },
          ],
          commitments: bills.map((bill, index) => ({
            title: bill.title,
            category: bill.title,
            amount: Number(bill.amount),
            dueDate: bill.dueDate,
            recurrence: bill.recurrence,
            essential: true,
            priority: Math.min(index + 1, 5),
            autopay: false,
          })),
          splitRule: {
            ...starterSplit,
            enabled: confirmed,
          },
          trackingMode,
          spendingProfile: {
            essentialCategories,
            flexibleCategories: [],
            hardestToProtect: hardestToProtect.trim() || null,
          },
        }),
      });
      await AsyncStorage.removeItem(draftKey);
      await reloadUser();
    } catch (cause) {
      Alert.alert(
        "Couldn’t build your plan",
        cause instanceof Error
          ? cause.message
          : "Check your details and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      title={meta.title}
      subtitle={meta.subtitle}
      back={step > 0}
      onBack={() => setStep((value) => Math.max(0, value - 1))}
      help={{ title: meta.title, body: meta.help }}
    >
      <View style={styles.progressBlock}>
        <Text style={styles.progressText}>
          Step {step + 1} of {steps.length} · saved automatically
        </Text>
        <Progress
          label={`Onboarding step ${step + 1} of ${steps.length}`}
          value={((step + 1) / steps.length) * 100}
        />
      </View>

      {step === 0 && (
        <Card>
          <Field
            label="What should we call you?"
            value={preferredName}
            onChangeText={setPreferredName}
            autoComplete="name-given"
            returnKeyType="next"
          />
          <Field
            label="Your city"
            value={city}
            onChangeText={setCity}
            returnKeyType="done"
          />
        </Card>
      )}

      {step === 1 && (
        <View style={styles.choiceList}>
          {GIG_WORK_TYPES.map((value) => (
            <Choice
              key={value}
              label={workLabels[value]}
              selected={workTypes.includes(value)}
              role="checkbox"
              onPress={() => toggleWork(value)}
            />
          ))}
        </View>
      )}

      {step === 2 && (
        <View style={styles.choiceList}>
          {GIG_PRIORITIES.map((value) => (
            <Choice
              key={value}
              label={priorityLabels[value]}
              selected={priority === value}
              role="radio"
              onPress={() => setPriority(value)}
            />
          ))}
        </View>
      )}

      {step === 3 && (
        <Card>
          <Field
            label="Main income source"
            value={sourceName}
            onChangeText={setSourceName}
            placeholder="For example: Swiggy, Uber, clients"
          />
          <DateField
            label="When is your next payout?"
            value={payoutDate}
            onChange={(value) => value && setPayoutDate(value)}
          />
          <Text style={ui.small}>No bank account is connected.</Text>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <Field
            label="Low week received (₹)"
            value={low}
            onChangeText={setLow}
            keyboardType="decimal-pad"
          />
          <Field
            label="Normal week received (₹)"
            value={typical}
            onChangeText={setTypical}
            keyboardType="decimal-pad"
          />
          <Field
            label="Good week received (₹)"
            value={good}
            onChangeText={setGood}
            keyboardType="decimal-pad"
          />
          {!weeklyOrderValid && (
            <Text accessibilityRole="alert" style={styles.error}>
              Enter amounts from lowest to highest.
            </Text>
          )}
        </Card>
      )}

      {step === 5 && (
        <Card>
          <Field
            label="Days you usually work each week"
            value={workDays}
            onChangeText={setWorkDays}
            keyboardType="number-pad"
          />
          <Field
            label="Fuel and other weekly work costs (₹)"
            value={workCosts}
            onChangeText={setWorkCosts}
            keyboardType="decimal-pad"
          />
          {!workCostsValid && (
            <Text accessibilityRole="alert" style={styles.error}>
              Work days must be from 1 to 7. Enter ₹0 or more for work costs.
            </Text>
          )}
        </Card>
      )}

      {step === 6 && (
        <Card>
          <Field
            label="Money available today (₹)"
            value={balance}
            onChangeText={setBalance}
            keyboardType="decimal-pad"
          />
          <Field
            label="Emergency savings already kept (₹)"
            value={cushion}
            onChangeText={setCushion}
            keyboardType="decimal-pad"
          />
          <Field
            label="Minimum money to always keep (₹)"
            value={safetyBuffer}
            onChangeText={setSafetyBuffer}
            keyboardType="decimal-pad"
          />
          {!moneyNowValid && (
            <Text accessibilityRole="alert" style={styles.error}>
              Enter ₹0 or more in each field.
            </Text>
          )}
        </Card>
      )}

      {step === 7 && (
        <>
          {bills.length > 0 && (
            <View style={styles.billList}>
              <Label>Added bills</Label>
              {bills.map((bill) => (
                <View key={bill.id} style={styles.billRow}>
                  <View style={styles.billText}>
                    <Text style={styles.billTitle}>{bill.title}</Text>
                    <Text style={ui.small}>
                      ₹{Number(bill.amount).toLocaleString("en-IN")} ·{" "}
                      {recurrenceLabels[bill.recurrence]}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${bill.title}`}
                    onPress={() =>
                      setBills((items) =>
                        items.filter((item) => item.id !== bill.id),
                      )
                    }
                    style={({ pressed }) => [
                      styles.removeButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Card>
            <Label>Choose a common bill or type your own</Label>
            <View style={styles.wrap}>
              {billPresets.map((name) => (
                <Pressable
                  key={name}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${name}`}
                  onPress={() => setBillName(name)}
                  style={({ pressed }) => [
                    styles.preset,
                    billName === name && styles.presetActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.presetText}>{name}</Text>
                </Pressable>
              ))}
            </View>
            <Field
              label="Bill name"
              value={billName}
              onChangeText={setBillName}
              placeholder="For example: Water bill"
            />
            <Field
              label="Amount (₹)"
              value={billAmount}
              onChangeText={setBillAmount}
              keyboardType="decimal-pad"
            />
            <DateField
              label="Next due date"
              value={billDate}
              onChange={(value) => value && setBillDate(value)}
            />
            <Label>How often?</Label>
            <View style={styles.wrap}>
              {recurrenceOptions.map((option) => (
                <Choice
                  key={option.value}
                  label={option.label}
                  selected={billRecurrence === option.value}
                  role="radio"
                  compact
                  onPress={() => setBillRecurrence(option.value)}
                />
              ))}
            </View>
            <Button
              title="Add this bill"
              tone="quiet"
              disabled={!billName.trim() || !isPositive(billAmount)}
              onPress={addBill}
            />
          </Card>
          {bills.length === 0 && (
            <Text style={styles.centerHint}>
              No bill to add now? Continue and add one later from Plan.
            </Text>
          )}
        </>
      )}

      {step === 8 && (
        <>
          <View style={styles.choiceList}>
            <Choice
              label="Start now · use a safe baseline estimate"
              selected={trackingMode === "START_NOW"}
              role="radio"
              onPress={() => setTrackingMode("START_NOW")}
            />
            <Choice
              label="Observe & learn · track quietly for 1–2 months"
              selected={trackingMode === "OBSERVE_LEARN"}
              role="radio"
              onPress={() => setTrackingMode("OBSERVE_LEARN")}
            />
          </View>
          <Card>
            <Label>Where does essential money usually go?</Label>
            <View style={styles.wrap}>
              {spendingCategories.map((category) => (
                <Choice
                  key={category}
                  label={category}
                  selected={essentialCategories.includes(category)}
                  role="checkbox"
                  compact
                  onPress={() =>
                    setEssentialCategories((items) =>
                      items.includes(category)
                        ? items.filter((item) => item !== category)
                        : [...items, category],
                    )
                  }
                />
              ))}
            </View>
            <Field
              label="Hardest expense to protect (optional)"
              value={hardestToProtect}
              onChangeText={setHardestToProtect}
            />
          </Card>
        </>
      )}

      {step === 9 && (
        <>
          <Card>
            <View style={styles.reviewHeader}>
              <View>
                <Label>Example normal payout</Label>
                <Money value={Number(typical)} />
              </View>
              <Text style={styles.changeLater}>Change later</Text>
            </View>
            <View style={styles.splitList}>
              {splitRows.map(([label, percentage]) => (
                <View key={label} style={styles.splitRow}>
                  <View style={styles.splitLabel}>
                    <Text style={styles.billTitle}>{label}</Text>
                    <Text style={ui.small}>{percentage}% of each payout</Text>
                  </View>
                  <Text style={styles.splitAmount}>
                    ₹
                    {Math.round(
                      (Number(typical) * percentage) / 100,
                    ).toLocaleString("en-IN")}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.summaryCard}>
            <Label>What SuperFinz will remember</Label>
            <Text style={ui.body}>
              {workTypes.map((item) => workLabels[item]).join(", ")} · {city}
            </Text>
            <Text style={ui.body}>
              {bills.length} important {bills.length === 1 ? "bill" : "bills"}{" "}
              protected
            </Text>
            <Text style={ui.small}>
              No real transfer happens. This is a planning guide.
            </Text>
          </Card>

          <Choice
            label="Yes, use this starter plan"
            selected={confirmed}
            role="checkbox"
            onPress={() => setConfirmed((value) => !value)}
          />
        </>
      )}

      <View style={styles.actions}>
        <Button
          title={step === steps.length - 1 ? "Create my dashboard" : "Continue"}
          loading={saving}
          disabled={!stepValid}
          accessibilityHint={
            step === steps.length - 1
              ? "Saves your answers and opens your dashboard"
              : "Moves to the next short step"
          }
          onPress={
            step === steps.length - 1
              ? submit
              : () => setStep((value) => Math.min(steps.length - 1, value + 1))
          }
        />
      </View>
    </Screen>
  );
}

function Choice({
  label,
  selected,
  role,
  compact = false,
  onPress,
}: {
  label: string;
  selected: boolean;
  role: "checkbox" | "radio";
  compact?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        compact && styles.choiceCompact,
        selected && styles.choiceActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.choiceMark, selected && styles.choiceMarkActive]}>
        {selected && <Text style={styles.check}>✓</Text>}
      </View>
      <Text style={styles.choiceText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  progressBlock: { gap: 8 },
  progressText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  choiceList: { gap: 10 },
  choice: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  choiceCompact: { minHeight: 48, flexGrow: 1 },
  choiceActive: {
    borderColor: colors.action,
    backgroundColor: colors.accentSoft,
  },
  choiceMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceMarkActive: {
    borderColor: colors.action,
    backgroundColor: colors.action,
  },
  check: { color: colors.white, fontSize: 15, fontWeight: "800" },
  choiceText: {
    flexShrink: 1,
    color: colors.ink,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  preset: {
    minHeight: 48,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.paper,
    paddingHorizontal: 14,
  },
  presetActive: {
    borderColor: colors.action,
    backgroundColor: colors.accentSoft,
  },
  presetText: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  pressed: { opacity: 0.7 },
  error: { color: colors.red, fontWeight: "700", lineHeight: 21 },
  billList: { gap: 8 },
  billRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  billText: { flex: 1, gap: 2 },
  billTitle: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  removeButton: {
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  removeText: { color: colors.red, fontSize: 14, fontWeight: "700" },
  centerHint: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  changeLater: { color: colors.action, fontSize: 13, fontWeight: "700" },
  splitList: { gap: 2 },
  splitRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: 9,
  },
  splitLabel: { flex: 1, gap: 2 },
  splitAmount: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  summaryCard: { backgroundColor: colors.accentSoft },
  actions: { marginTop: 4 },
});
