import { Tabs } from "expo-router/js-tabs";
import {
  CalendarClock,
  House,
  MessageCircle,
  ShieldCheck,
  WalletCards,
  type LucideIcon,
} from "lucide-react-native";
import type { ColorValue } from "react-native";
import { FloatingTabBar, TabBarInsetProvider } from "@/components/tab-bar";
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
    <TabBarInsetProvider>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          sceneStyle: { backgroundColor: colors.paper },
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
    </TabBarInsetProvider>
  );
}
