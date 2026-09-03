import type { ExpoConfig, ConfigContext } from "expo/config";

const googlePlugin: [string, Record<string, string>] | null = process.env
  .GOOGLE_IOS_URL_SCHEME
  ? [
      "react-native-nitro-google-signin",
      { iosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME },
    ]
  : process.env.GOOGLE_SERVICES_JSON && process.env.GOOGLE_SERVICE_INFO_PLIST
    ? ["react-native-nitro-google-signin", {}]
    : null;

const expoConfig = ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "SuperFinz",
  slug: "superfinz",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "superfinz",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.superfinz.app",
    ...(process.env.GOOGLE_SERVICE_INFO_PLIST
      ? { googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST }
      : {}),
  },
  android: {
    package: "com.superfinz.app",
    adaptiveIcon: {
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundColor: "#F7F9FC",
    },
    predictiveBackGestureEnabled: false,
    ...(process.env.GOOGLE_SERVICES_JSON
      ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON }
      : {}),
  },
  web: { output: "static", favicon: "./assets/images/favicon.png" },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "@react-native-community/datetimepicker",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 180,
        resizeMode: "contain",
        backgroundColor: "#F7F9FC",
        dark: { backgroundColor: "#08111F" },
      },
    ],
    ...(googlePlugin ? [googlePlugin] : []),
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  ...(process.env.EAS_PROJECT_ID
    ? { extra: { eas: { projectId: process.env.EAS_PROJECT_ID } } }
    : {}),
});

export default expoConfig;
