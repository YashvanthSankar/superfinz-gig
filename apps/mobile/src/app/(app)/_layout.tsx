import { Tabs } from "expo-router";
import { StyleSheet, Text, type ColorValue } from "react-native";
import { colors } from "@/constants/theme";

const Icon = ({ text, color }: { text: string; color: ColorValue }) => <Text style={[styles.icon, { color }]}>{text}</Text>;
export default function AppLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.ink, borderTopWidth: 2, height: 66 }, tabBarLabelStyle: { fontSize: 10, fontWeight: "900", textTransform: "uppercase", paddingBottom: 6 } }}>
    <Tabs.Screen name="index" options={{ title: "Overview", tabBarIcon: ({ color }) => <Icon text="▦" color={color} /> }} />
    <Tabs.Screen name="transactions" options={{ title: "Spends", tabBarIcon: ({ color }) => <Icon text="₹" color={color} /> }} />
    <Tabs.Screen name="goals" options={{ title: "Goals", tabBarIcon: ({ color }) => <Icon text="◎" color={color} /> }} />
    <Tabs.Screen name="budgets" options={{ title: "Budgets", tabBarIcon: ({ color }) => <Icon text="▤" color={color} /> }} />
    <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: ({ color }) => <Icon text="•••" color={color} /> }} />
    {(["retirement", "calculators", "news", "heatmap", "profile", "learn/index", "learn/[id]"] as const).map((name) => <Tabs.Screen key={name} name={name} options={{ href: null }} />)}
  </Tabs>;
}
const styles = StyleSheet.create({ icon: { fontSize: 21, fontWeight: "900" } });
