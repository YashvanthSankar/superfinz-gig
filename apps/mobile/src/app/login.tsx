import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui";
import { colors } from "@/constants/theme";
import { useAuth } from "@/providers/auth-provider";

export default function Login() {
  const { signInWithGoogle, loading, error } = useAuth(); const [localError, setLocalError] = useState<string | null>(null);
  return <SafeAreaView style={styles.page}><View style={styles.brand}><View style={styles.mark}><Text style={styles.markText}>SF</Text></View><Text style={styles.logo}>SUPERFINZ</Text></View><View style={styles.hero}><Text style={styles.kicker}>MONEY, WITHOUT THE LECTURE</Text><Text style={styles.title}>Know where it goes.{"\n"}<Text style={{ color: colors.accent }}>Build what’s next.</Text></Text><Text style={styles.body}>A clear spending plan, savings goals, and a finance companion built for real life and irregular income.</Text></View><View style={styles.login}><Button title={loading ? "Signing in…" : "Continue with Google"} disabled={loading} onPress={() => signInWithGoogle().catch((cause) => setLocalError(cause instanceof Error ? cause.message : "Sign-in failed"))} />{(localError ?? error) && <Text style={styles.error}>{localError ?? error}</Text>}<Text style={styles.note}>Google sign-in requires the SuperFinz development build. Expo Go is not supported.</Text></View></SafeAreaView>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.paper, padding: 24, justifyContent: "space-between" }, brand: { flexDirection: "row", alignItems: "center", gap: 10 }, mark: { width: 42, height: 42, backgroundColor: colors.ink, borderWidth: 2, borderColor: colors.ink, alignItems: "center", justifyContent: "center" }, markText: { color: colors.white, fontWeight: "900" }, logo: { fontWeight: "900", fontSize: 18, letterSpacing: 1.5, color: colors.ink }, hero: { gap: 18 }, kicker: { fontSize: 11, letterSpacing: 2, fontWeight: "900", color: colors.inkSoft }, title: { fontSize: 46, lineHeight: 48, letterSpacing: -2, fontWeight: "900", color: colors.ink }, body: { fontSize: 17, lineHeight: 25, color: colors.inkSoft, fontWeight: "600" }, login: { gap: 14 }, error: { color: colors.red, fontWeight: "700", textAlign: "center" }, note: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: "center" } });
