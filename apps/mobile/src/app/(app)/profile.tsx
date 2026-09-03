import { useState } from "react";
import { Alert, Text } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserDto } from "@superfinz/shared";
import { apiFetch } from "@/lib/api";
import { Button, Card, Field, Label, Loading, Screen, ui } from "@/components/ui";
import { useAuth } from "@/providers/auth-provider";

export default function Profile() {
  const query = useQuery({ queryKey: ["profile"], queryFn: () => apiFetch<{ user: UserDto }>("/api/profile") });
  if (!query.data?.user) return <Loading label="Loading profile…" />;
  return <ProfileForm key={query.data.user.updatedAt} user={query.data.user} />;
}

function ProfileForm({ user }: { user: UserDto }) {
  const { signOut } = useAuth(); const client = useQueryClient(); const [income, setIncome] = useState(String(user.profile?.monthlySalary ?? user.profile?.monthlyAllowance ?? 0)); const [budget, setBudget] = useState(String(user.profile?.monthlyBudget ?? 0)); const [savings, setSavings] = useState(String(user.profile?.savingsGoal ?? 0));
  const save = useMutation({ mutationFn: () => apiFetch("/api/profile", { method: "PATCH", body: JSON.stringify({ ...(user?.userType === "PROFESSIONAL" ? { monthlySalary: Number(income) } : { monthlyAllowance: Number(income) }), monthlyBudget: Number(budget), savingsGoal: Number(savings) }) }), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ["profile"] }), client.invalidateQueries({ queryKey: ["dashboard"] })]); Alert.alert("Saved", "Your plan is up to date."); }, onError: (e) => Alert.alert("Couldn’t save", e instanceof Error ? e.message : "Try again") });
  return <Screen title="Profile"><Card><Label>Account</Label><Text style={ui.h2}>{user.name}</Text><Text style={ui.body}>{user.email}</Text><Text style={ui.small}>{user.userType.replaceAll("_", " ")}</Text></Card><Card><Field label="Monthly income" value={income} onChangeText={setIncome} keyboardType="numeric" /><Field label="Monthly spending budget" value={budget} onChangeText={setBudget} keyboardType="numeric" /><Field label="Monthly savings goal" value={savings} onChangeText={setSavings} keyboardType="numeric" /><Button title={save.isPending ? "Saving…" : "Save plan"} disabled={save.isPending} onPress={() => save.mutate()} /></Card><Card><Label>Session</Label><Text style={ui.body}>Your login tokens are kept in the device’s encrypted secure storage and refresh automatically.</Text><Button title="Sign out" tone="ink" onPress={() => signOut()} /></Card></Screen>;
}
