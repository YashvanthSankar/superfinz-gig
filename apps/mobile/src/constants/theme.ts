import { DynamicColorIOS, Platform, type ColorValue } from "react-native";

const adaptive = (light: string, dark: string): ColorValue =>
  Platform.OS === "ios" ? DynamicColorIOS({ light, dark }) : light;

/**
 * SuperFinz mobile palette. Mirrors the web tokens in src/app/globals.css.
 * Every pair passes WCAG AA for its intended use:
 * text on paper/surface ≥ 4.5:1, borders on paper ≥ 3:1 for `borderStrong`.
 */
export const lightColors = {
  paper: "#F7F9FC",
  paper2: "#EEF3F8",
  paper3: "#DFE7F1",
  surface: "#FFFFFF",
  ink: "#122033",
  inkSoft: "#46566C",
  muted: "#596A82",
  /** Navy fill (hero cards, primary buttons). */
  primary: "#102A43",
  onPrimary: "#FFFFFF",
  onPrimarySoft: "#C3CDD9",
  onPrimaryBorder: "rgba(255,255,255,0.22)",
  onPrimaryPanel: "rgba(255,255,255,0.10)",
  accentOnPrimary: "#A8C6FF",
  /** Blue fill and blue text. */
  action: "#2563EB",
  onAction: "#FFFFFF",
  accent: "#1D4ED8",
  accentSoft: "#EAF2FF",
  good: "#087A55",
  goodSoft: "#E2F3EB",
  onGood: "#FFFFFF",
  warn: "#8A6200",
  warnSoft: "#FFF3D6",
  onWarn: "#FFFFFF",
  bad: "#B42318",
  badSoft: "#FDE9E7",
  onBad: "#FFFFFF",
  border: "#C9D4E1",
  borderStrong: "#7A8DA5",
  white: "#FFFFFF",
} as const;

export const darkColors = {
  paper: "#08111F",
  paper2: "#0D1B2A",
  paper3: "#142740",
  surface: "#0F1E30",
  ink: "#F4F7FC",
  inkSoft: "#CAD5E3",
  muted: "#91A3B8",
  primary: "#12375A",
  onPrimary: "#FFFFFF",
  onPrimarySoft: "#C7D2E0",
  onPrimaryBorder: "rgba(255,255,255,0.22)",
  onPrimaryPanel: "rgba(255,255,255,0.10)",
  accentOnPrimary: "#B3CDFF",
  action: "#2D63D8",
  onAction: "#FFFFFF",
  accent: "#82AEFF",
  accentSoft: "#142E55",
  good: "#5AD3A5",
  goodSoft: "#12382D",
  onGood: "#08261B",
  warn: "#EFC96F",
  warnSoft: "#3C321D",
  onWarn: "#2A1F05",
  bad: "#FF8F86",
  badSoft: "#451F21",
  onBad: "#2A0D0B",
  border: "#2E4664",
  borderStrong: "#5E7A9C",
  white: "#FFFFFF",
} as const;

type TokenName = keyof typeof lightColors;

const pick = (name: TokenName): ColorValue =>
  adaptive(lightColors[name], darkColors[name]);

export const colors = {
  paper: pick("paper"),
  paper2: pick("paper2"),
  paper3: pick("paper3"),
  surface: pick("surface"),
  ink: pick("ink"),
  inkSoft: pick("inkSoft"),
  muted: pick("muted"),
  primary: pick("primary"),
  onPrimary: pick("onPrimary"),
  onPrimarySoft: pick("onPrimarySoft"),
  onPrimaryBorder: pick("onPrimaryBorder"),
  onPrimaryPanel: pick("onPrimaryPanel"),
  accentOnPrimary: pick("accentOnPrimary"),
  action: pick("action"),
  onAction: pick("onAction"),
  accent: pick("accent"),
  accentSoft: pick("accentSoft"),
  good: pick("good"),
  goodSoft: pick("goodSoft"),
  onGood: pick("onGood"),
  warn: pick("warn"),
  warnSoft: pick("warnSoft"),
  onWarn: pick("onWarn"),
  bad: pick("bad"),
  badSoft: pick("badSoft"),
  onBad: pick("onBad"),
  border: pick("border"),
  borderStrong: pick("borderStrong"),
  white: "#FFFFFF" as ColorValue,

  // Legacy aliases kept so existing screens keep compiling. Prefer the names above.
  actionStrong: pick("primary"),
  green: pick("good"),
  greenSoft: pick("goodSoft"),
  yellow: pick("warn"),
  red: pick("bad"),
  inverseMuted: pick("onPrimarySoft"),
  inverseBorder: pick("onPrimaryBorder"),
};

/** Spacing scale in points. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

/** Corner radii. Controls 12, cards 20, pills 999. */
export const radius = {
  sm: 10,
  md: 12,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

/** Minimum touch target. */
export const TOUCH = 44;

export const shadow = Platform.select({
  ios: {
    shadowColor: "#122033",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  android: { elevation: 2 },
  default: {},
});

export const shadowLg = Platform.select({
  ios: {
    shadowColor: "#122033",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
  },
  android: { elevation: 6 },
  default: {},
});

/** Lucide and other native props need a plain string in the current scheme. */
export function colorString(value: ColorValue): string {
  return value as string;
}
