import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { UserType } from "@superfinz/shared";
import { apiFetch } from "@/lib/api";
import { Button, Card, Field, Label, Screen, ui } from "@/components/ui";
import { colors } from "@/constants/theme";
import { useAuth } from "@/providers/auth-provider";

const types: Array<{ value: UserType; label: string }> = [{ value: "SCHOOL_STUDENT", label: "School" }, { value: "COLLEGE_STUDENT", label: "College" }, { value: "PROFESSIONAL", label: "Professional" }];
export default function Onboarding() {
  const { user, reloadUser } = useAuth(); const [userType, setUserType] = useState<UserType>("COLLEGE_STUDENT"); const [age, setAge] = useState(String(user?.age ?? 21)); const [income, setIncome] = useState(""); const [budget, setBudget] = useState(""); const [savings, setSavings] = useState(""); const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try { await apiFetch("/api/profile/complete", { method: "POST", body: JSON.stringify({ age: Number(age), userType, ...(userType === "PROFESSIONAL" ? { monthlySalary: Number(income) } : { monthlyAllowance: Number(income) }), monthlyBudget: Number(budget), savingsGoal: Number(savings), spendingPattern: "BALANCED", cycleStartDate: 1 }) }); await reloadUser(); }
    catch (cause) { Alert.alert("Check your plan", cause instanceof Error ? cause.message : "Could not save your plan"); } finally { setSaving(false); }
  };
  return <Screen><Text style={ui.h1}>Let’s build your{`\n`}money baseline.</Text><Text style={ui.body}>A few numbers make every insight personal. You can change these later.</Text><Card><Label>I’m a</Label><View style={styles.choices}>{types.map((type) => <Pressable key={type.value} onPress={() => setUserType(type.value)} style={[styles.choice, userType === type.value && styles.selected]}><Text style={[styles.choiceText, userType === type.value && { color: colors.white }]}>{type.label}</Text></Pressable>)}</View><Field label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" /><Field label={userType === "PROFESSIONAL" ? "Monthly income" : "Monthly allowance"} value={income} onChangeText={setIncome} keyboardType="numeric" placeholder="₹ 40,000" /><Field label="Monthly spending budget" value={budget} onChangeText={setBudget} keyboardType="numeric" placeholder="₹ 25,000" /><Field label="Monthly savings goal" value={savings} onChangeText={setSavings} keyboardType="numeric" placeholder="₹ 8,000" /></Card><Button title={saving ? "Saving…" : "Create my plan"} disabled={saving || !income || !budget} onPress={submit} /></Screen>;
}
const styles = StyleSheet.create({ choices: { flexDirection: "row", gap: 8 }, choice: { flex: 1, borderWidth: 2, borderColor: colors.ink, minHeight: 44, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper }, selected: { backgroundColor: colors.ink }, choiceText: { fontSize: 11, fontWeight: "900", textTransform: "uppercase", color: colors.ink } });
