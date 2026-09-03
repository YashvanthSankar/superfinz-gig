import { DynamicColorIOS, Platform, type ColorValue } from "react-native";

const adaptive = (light: string, dark: string): ColorValue =>
  Platform.OS === "ios" ? DynamicColorIOS({ light, dark }) : light;

export const lightColors = {
  paper: "#F4F8F7",
  paper2: "#EAF2F0",
  ink: "#132A2E",
  inkSoft: "#3E5659",
  muted: "#647C7E",
  accent: "#0F766E",
  action: "#0F766E",
  actionStrong: "#153F43",
  accentSoft: "#D9EFEB",
  green: "#087A55",
  greenSoft: "#D9F2E8",
  yellow: "#D9A624",
  red: "#B42318",
  white: "#FFFFFF",
  surface: "#FFFFFF",
  border: "#C9D9D6",
  inverseMuted: "#C5DBD8",
  inverseBorder: "#5C8486",
} as const;

export const darkColors = {
  paper: "#081416",
  paper2: "#0F2023",
  ink: "#ECF7F5",
  inkSoft: "#BED0CD",
  muted: "#91AAA6",
  accent: "#65DDCA",
  action: "#187C72",
  actionStrong: "#20565A",
  accentSoft: "#123F3C",
  green: "#58D6A5",
  greenSoft: "#10382D",
  yellow: "#F0C45E",
  red: "#FF8C83",
  white: "#FFFFFF",
  surface: "#102124",
  border: "#294246",
  inverseMuted: "#C5DBD8",
  inverseBorder: "#5C8486",
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
  inverseMuted: "#C5DBD8",
  inverseBorder: "#5C8486",
};

export const shadow = Platform.select({
  ios: {
    shadowColor: "#102F33",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  android: { elevation: 2 },
  default: {},
});
