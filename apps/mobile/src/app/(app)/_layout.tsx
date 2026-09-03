import { Tabs } from "expo-router";
import {
  CalendarClock,
  House,
  MessageCircle,
  ShieldCheck,
  WalletCards,
  type LucideIcon,
} from "lucide-react-native";
import type { ColorValue } from "react-native";
import { colors } from "@/constants/theme";

const Icon = ({
  icon: Glyph,
  color,
}: {
  icon: LucideIcon;
  color: ColorValue;
}) => (
  <Glyph
    accessible={false}
    color={color as string}
    size={23}
    strokeWidth={2.5}
  />
);
export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          minHeight: 70,
          paddingTop: 7,
        },
        tabBarItemStyle: { minHeight: 52 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarAccessibilityLabel: "Today tab",
          tabBarIcon: ({ color }) => <Icon icon={House} color={color} />,
        }}
      />
      <Tabs.Screen
        name="income"
        options={{
          title: "Money",
          tabBarAccessibilityLabel: "Money tab",
          tabBarIcon: ({ color }) => <Icon icon={WalletCards} color={color} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarAccessibilityLabel: "Plan tab",
          tabBarIcon: ({ color }) => (
            <Icon icon={CalendarClock} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="safety"
        options={{
          title: "Safety",
          tabBarAccessibilityLabel: "Safety tab",
          tabBarIcon: ({ color }) => <Icon icon={ShieldCheck} color={color} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: "Coach",
          tabBarAccessibilityLabel: "Coach tab",
          tabBarIcon: ({ color }) => (
            <Icon icon={MessageCircle} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
