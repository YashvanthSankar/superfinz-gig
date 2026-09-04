import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import brandMark from "../../assets/images/brand-mark.png";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CircleGauge,
  LogIn,
  ShieldCheck,
  WalletCards,
} from "lucide-react-native";
import { Button, Card, Label, ListRow, Notice, ui } from "@/components/ui";
import { colors, radius, space } from "@/constants/theme";
import { useAuth } from "@/providers/auth-provider";

export default function Login() {
  const { signInWithGoogle, reloadUser, loading, error } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  const message = localError ?? error;

  const handleSignIn = () => {
    setLocalError(null);
    signInWithGoogle().catch((cause) =>
      setLocalError(cause instanceof Error ? cause.message : "Sign-in failed"),
    );
  };

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <View style={styles.mark}>
            <Image
              accessibilityIgnoresInvertColors
              alt="SuperFinz"
              source={brandMark}
              style={styles.markImage}
            />
          </View>
          <Text style={styles.logo}>SuperFinz</Text>
        </View>

        <View style={styles.middle}>
          <View style={styles.hero}>
            <Label tone="accent">
              Financial resilience for irregular earners
            </Label>
            <Text accessibilityRole="header" style={ui.display}>
              Know what is <Text style={styles.highlight}>safe</Text> today.
            </Text>
            <Text style={ui.body}>
              SuperFinz turns irregular payouts into a simple plan: bills
              protected, work costs covered, and one safe-to-spend number.
            </Text>
          </View>

          <Card padded={false} style={styles.listCard}>
            <ListRow
              icon={CircleGauge}
              title="Know today's safe amount"
              chevron={false}
            />
            <ListRow
              icon={ShieldCheck}
              title="Protect essentials and earning costs"
              chevron={false}
            />
            <ListRow
              icon={WalletCards}
              title="Prepare for low-income weeks"
              chevron={false}
              last
            />
          </Card>
        </View>

        <View style={styles.login}>
          <Button
            title="Continue with Google"
            tone="ink"
            size="lg"
            icon={LogIn}
            loading={loading}
            accessibilityHint="Signs in securely with your Google account"
            onPress={handleSignIn}
          />
          {message && (
            <Notice tone="bad">
              <View style={styles.noticeBody}>
                <Text style={styles.noticeText}>{message}</Text>
                {error && (
                  <Button
                    title="Try loading my account again"
                    tone="quiet"
                    size="sm"
                    inline
                    onPress={() => void reloadUser()}
                  />
                )}
              </View>
            </Notice>
          )}
          <View style={styles.captions}>
            <Text style={[ui.caption, styles.centered]}>
              Only your basic Google identity is used. SuperFinz never moves
              money.
            </Text>
            <Text style={[ui.caption, styles.centered]}>
              Google sign-in needs the SuperFinz development build. Expo Go is
              not supported.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: {
    flexGrow: 1,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: space.xxl,
    justifyContent: "space-between",
    gap: space.xxl,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: space.md },
  mark: {
    width: 44,
    height: 44,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  markImage: { width: 38, height: 38, resizeMode: "contain" },
  logo: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.4,
  },
  middle: { gap: space.xl },
  hero: { gap: space.md },
  highlight: { color: colors.accent },
  /** ListRow has no horizontal inset of its own; give the flush card one. */
  listCard: { paddingHorizontal: space.lg },
  login: { gap: space.lg },
  noticeBody: { gap: space.sm },
  noticeText: { fontSize: 14, lineHeight: 20, color: colors.ink },
  captions: { gap: space.xs },
  centered: { textAlign: "center" },
});
