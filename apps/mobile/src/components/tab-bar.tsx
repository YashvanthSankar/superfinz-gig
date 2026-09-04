import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { TOUCH, colorString, colors, radius, shadowLg } from "@/constants/theme";
import { useAppTheme } from "@/providers/theme-provider";

/** Height of the floating bar itself, excluding the gap below it. */
export const TAB_BAR_HEIGHT = 64;
/** Gap between the bar and the bottom safe-area edge. */
export const TAB_BAR_GAP = 10;
/** Horizontal inset from the screen edges. */
export const TAB_BAR_SIDE = 16;

const TabBarPresenceContext = createContext(false);

/** Wrap a tab navigator so screens inside can pad themselves beneath the floating bar. */
export function TabBarInsetProvider({ children }: PropsWithChildren) {
  return (
    <TabBarPresenceContext.Provider value>{children}</TabBarPresenceContext.Provider>
  );
}

/** Bottom padding a screen needs so content clears the floating bar (0 outside tabs). */
export function useTabBarInset() {
  const insideTabs = useContext(TabBarPresenceContext);
  const insets = useSafeAreaInsets();
  if (!insideTabs) return 0;
  return insets.bottom + TAB_BAR_GAP + TAB_BAR_HEIGHT;
}

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

const glassAvailable = Platform.OS === "ios" && isLiquidGlassAvailable();

/**
 * Floating frosted-glass tab bar. Uses Apple's Liquid Glass on iOS 26+ and a
 * translucent surface with a hairline border everywhere else.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const keyboardVisible = useKeyboardVisible();
  if (keyboardVisible) return null;

  const routes = state.routes.filter((route) => {
    const itemStyle = StyleSheet.flatten(descriptors[route.key]?.options.tabBarItemStyle) as
      | ViewStyle
      | undefined;
    return itemStyle?.display !== "none";
  });

  const items = routes.map((route) => {
    const { options } = descriptors[route.key];
    const focused = state.routes[state.index]?.key === route.key;
    const label =
      typeof options.title === "string" ? options.title : route.name;
    const color = focused ? colors.accent : colors.muted;
    const icon = options.tabBarIcon?.({
      focused,
      color: colorString(color),
      size: 23,
    });
    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };
    const onLongPress = () => {
      navigation.emit({ type: "tabLongPress", target: route.key });
    };
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
        accessibilityState={{ selected: focused }}
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      >
        <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>{icon}</View>
        <Text
          numberOfLines={1}
          style={[styles.label, { color }, focused && styles.labelActive]}
        >
          {label}
        </Text>
      </Pressable>
    );
  });

  const frame: ViewStyle = {
    position: "absolute",
    left: TAB_BAR_SIDE,
    right: TAB_BAR_SIDE,
    bottom: insets.bottom + TAB_BAR_GAP,
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
  };

  if (glassAvailable) {
    return (
      <View pointerEvents="box-none" style={[frame, styles.shadow]}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={theme}
          isInteractive
          style={[styles.glass, { borderRadius: TAB_BAR_HEIGHT / 2 }]}
        >
          <View style={styles.row}>{items}</View>
        </GlassView>
      </View>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={[frame, styles.shadow]}
    >
      <View
        style={[
          styles.fallback,
          { borderRadius: TAB_BAR_HEIGHT / 2 },
          theme === "dark" ? styles.fallbackDark : styles.fallbackLight,
        ]}
      >
        <View style={styles.row}>{items}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { ...shadowLg },
  glass: { flex: 1, overflow: "hidden" },
  fallback: {
    flex: 1,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  fallbackLight: { backgroundColor: "rgba(255,255,255,0.88)" },
  fallbackDark: { backgroundColor: "rgba(15,30,48,0.9)" },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 6,
  },
  item: {
    flex: 1,
    minHeight: TOUCH,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 4,
  },
  itemPressed: { opacity: 0.7 },
  iconWrap: {
    width: 44,
    height: 30,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: { backgroundColor: colors.accentSoft },
  label: { fontSize: 12, lineHeight: 15, fontWeight: "600" },
  labelActive: { fontWeight: "700" },
});
