import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import type { UserDto } from "@superfinz/shared";
import { calculateFire, calculateSip } from "@superfinz/shared";
import { apiFetch } from "@/lib/api";
import { Card, Label, Loading, Money, Progress, Screen, ui } from "@/components/ui";
import { colors } from "@/constants/theme";

export default function Retirement() {
  const query = useQuery({ queryKey: ["profile"], queryFn: () => apiFetch<{ user: UserDto }>("/api/profile") }); if (!query.data) return <Loading label="Calculating your plan…" />;
  const user = query.data.user; const income = user.profile?.monthlySalary ?? user.profile?.monthlyAllowance ?? 0; const expenses = user.profile?.monthlyBudget || income; const sip = user.profile?.savingsGoal ?? 0; const years = Math.max(1, 45 - user.age); const fire = calculateFire(expenses); const projected = calculateSip(sip, 12, years).value; const readiness = fire ? Math.min(100, projected / fire * 100) : 0;
  return <Screen title="Retirement"><Card style={{ backgroundColor: colors.ink }}><Label>Readiness at 45</Label><Text style={styles.score}>{Math.round(readiness)}</Text><Progress value={readiness} tone={readiness >= 70 ? colors.green : colors.accent} /><Text style={[ui.small, { color: colors.paper2 }]}>{readiness >= 70 ? "On track" : "Your plan needs a stronger monthly investment."}</Text></Card><View style={styles.row}><Card style={{ flex: 1 }}><Label>FIRE target</Label><Money value={fire} compact /><Text style={ui.small}>25× annual expenses</Text></Card><Card style={{ flex: 1 }}><Label>Projected</Label><Money value={projected} compact /><Text style={ui.small}>12% illustration</Text></Card></View><Card><Label>Your current assumptions</Label><Text style={ui.body}>Retirement age: 45{`\n`}Years to invest: {years}{`\n`}Monthly SIP: ₹{sip.toLocaleString("en-IN")}{`\n`}Monthly expenses: ₹{expenses.toLocaleString("en-IN")}</Text></Card><Card style={{ backgroundColor: colors.accentSoft }}><Label>Important</Label><Text style={ui.body}>This is an educational projection, not a guarantee or investment recommendation. Returns, inflation, taxes and fees can materially change the outcome.</Text></Card></Screen>;
}
const styles = StyleSheet.create({ score: { fontSize: 60, fontWeight: "900", color: colors.white }, row: { flexDirection: "row", gap: 12 } });
