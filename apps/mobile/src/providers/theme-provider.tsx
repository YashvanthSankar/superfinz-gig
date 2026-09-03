import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance, useColorScheme } from "react-native";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

type AppTheme = "light" | "dark";
type ThemeContextValue = { theme: AppTheme; toggleTheme: () => void };

const STORAGE_KEY = "superfinz-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState<AppTheme>(
    systemTheme === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        const next =
          saved === "dark" || saved === "light"
            ? saved
            : systemTheme === "dark"
              ? "dark"
              : "light";
        Appearance.setColorScheme(next);
        setTheme(next);
      })
      .catch(() => undefined);
  }, [systemTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      Appearance.setColorScheme(next);
      void AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useAppTheme must be used inside ThemeProvider");
  return value;
}
