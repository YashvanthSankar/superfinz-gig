import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Label, Screen, ui } from "@/components/ui";
import { colors } from "@/constants/theme";
import { useAuth } from "@/providers/auth-provider";

const links = [
  ["Retirement plan", "FIRE target and readiness", "/(app)/retirement"], ["Learn", "Straightforward money lessons", "/(app)/learn"],
  ["Calculators", "SIP, FD and FIRE", "/(app)/calculators"], ["Money news", "Indian finance headlines", "/(app)/news"],
  ["Spending heatmap", "Your last 3 months", "/(app)/heatmap"], ["Profile & plan", "Income, budget and account", "/(app)/profile"],
] as const;
export default function More() { const { user } = useAuth(); return <Screen title="More"><Card style={{ backgroundColor: colors.ink }}><Label>Signed in as</Label><Text style={[ui.h2, { color: colors.white }]}>{user?.name}</Text><Text style={[ui.small, { color: colors.paper2 }]}>{user?.email}</Text></Card>{links.map(([title, body, href]) => <Pressable key={title} onPress={() => router.push(href)}><Card style={styles.link}><View style={{ flex: 1 }}><Text style={ui.h2}>{title}</Text><Text style={ui.small}>{body}</Text></View><Text style={styles.arrow}>→</Text></Card></Pressable>)}</Screen>; }
const styles = StyleSheet.create({ link: { flexDirection: "row", alignItems: "center" }, arrow: { color: colors.accent, fontWeight: "900", fontSize: 28 } });
