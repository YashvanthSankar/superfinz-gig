import { DynamicColorIOS, Platform, type ColorValue } from "react-native";

const adaptive = (light: string, dark: string): ColorValue =>
  Platform.OS === "ios" ? DynamicColorIOS({ light, dark }) : light;

export const lightColors = {
  paper: "#F7F9FC",
  paper2: "#EEF3F8",
  ink: "#122033",
  inkSoft: "#46566C",
  muted: "#64748B",
  accent: "#1D4ED8",
  action: "#2563EB",
  actionStrong: "#102A43",
  accentSoft: "#EAF2FF",
  green: "#087A55",
  greenSoft: "#E2F3EB",
  yellow: "#8A6200",
  red: "#B42318",
  white: "#FFFFFF",
  surface: "#FFFFFF",
  border: "#D6E0EB",
  inverseMuted: "#CFDCEB",
  inverseBorder: "#6683A3",
} as const;

export const darkColors = {
  paper: "#08111F",
  paper2: "#0D1B2A",
  ink: "#F4F7FC",
  inkSoft: "#CAD5E3",
  muted: "#91A3B8",
  accent: "#82AEFF",
  action: "#2D63D8",
  actionStrong: "#12375A",
  accentSoft: "#142E55",
  green: "#5AD3A5",
  greenSoft: "#12382D",
  yellow: "#EFC96F",
  red: "#FF8F86",
  white: "#FFFFFF",
  surface: "#0F1E30",
  border: "#263C56",
  inverseMuted: "#CFDCEB",
  inverseBorder: "#6683A3",
} as const;

export const colors = {
  paper: adaptive(lightColors.paper, darkColors.paper),
  paper2: adaptive(lightColors.paper2, darkColors.paper2),
  ink: adaptive(lightColors.ink, darkColors.ink),
  inkSoft: adaptive(lightColors.inkSoft, darkColors.inkSoft),
  muted: adaptive(lightColors.muted, darkColors.muted),
  accent: adaptive(lightColors.accent, darkColors.accent),
  action: adaptive(lightColors.action, darkColors.action),
  actionStrong: adaptive(lightColors.actionStrong, darkColors.actionStrong),
  accentSoft: adaptive(lightColors.accentSoft, darkColors.accentSoft),
  green: adaptive(lightColors.green, darkColors.green),
  greenSoft: adaptive(lightColors.greenSoft, darkColors.greenSoft),
  yellow: adaptive(lightColors.yellow, darkColors.yellow),
  red: adaptive(lightColors.red, darkColors.red),
  white: "#FFFFFF",
  surface: adaptive(lightColors.surface, darkColors.surface),
  border: adaptive(lightColors.border, darkColors.border),
  inverseMuted: "#CFDCEB",
  inverseBorder: "#6683A3",
};

export const shadow = Platform.select({
  ios: {
    shadowColor: "#122033",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  android: { elevation: 2 },
  default: {},
});
