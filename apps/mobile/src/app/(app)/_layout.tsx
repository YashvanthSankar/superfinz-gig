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
import { colorString, colors } from "@/constants/theme";

const Icon = ({
  icon: Glyph,
  color,
  focused,
}: {
  icon: LucideIcon;
  color: ColorValue;
  focused: boolean;
}) => (
  <Glyph
    accessible={false}
    color={colorString(color)}
    size={23}
    strokeWidth={focused ? 2.4 : 1.9}
  />
);

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colorString(colors.accent),
        tabBarInactiveTintColor: colorString(colors.muted),
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          minHeight: 72,
          paddingTop: 8,
        },
        tabBarItemStyle: { minHeight: 52, paddingVertical: 2 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600", marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarAccessibilityLabel: "Today tab",
          tabBarIcon: ({ color, focused }) => (
            <Icon icon={House} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="income"
        options={{
          title: "Money",
          tabBarAccessibilityLabel: "Money tab",
          tabBarIcon: ({ color, focused }) => (
            <Icon icon={WalletCards} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarAccessibilityLabel: "Plan tab",
          tabBarIcon: ({ color, focused }) => (
            <Icon icon={CalendarClock} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="safety"
        options={{
          title: "Safety",
          tabBarAccessibilityLabel: "Safety tab",
          tabBarIcon: ({ color, focused }) => (
            <Icon icon={ShieldCheck} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: "Coach",
          tabBarAccessibilityLabel: "Coach tab",
          tabBarIcon: ({ color, focused }) => (
            <Icon icon={MessageCircle} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
