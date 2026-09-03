import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import * as Device from "expo-device";
import { GoogleOneTapSignIn, isNoSavedCredentialFoundResponse, isSuccessResponse } from "react-native-nitro-google-signin";
import type { UserDto } from "@superfinz/shared";
import { apiFetch, getRefreshToken, mobileGoogleLogin, revokeCurrentSession } from "@/lib/api";

type AuthContextValue = { user: UserDto | null; loading: boolean; error: string | null; signInWithGoogle: () => Promise<void>; signOut: () => Promise<void>; reloadUser: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<UserDto | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const reloadUser = useCallback(async () => { try { if (!await getRefreshToken()) { setUser(null); return; } const result = await apiFetch<{ user: UserDto }>("/api/auth/me"); setUser(result.user); } catch { setUser(null); } }, []);
  useEffect(() => { reloadUser().finally(() => setLoading(false)); }, [reloadUser]);
  const signInWithGoogle = useCallback(async () => {
    setError(null); setLoading(true);
    try {
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      if (!webClientId) throw new Error("Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in apps/mobile/.env");
      GoogleOneTapSignIn.configure({ webClientId, scopes: ["email", "profile"], offlineAccess: false });
      let response = await GoogleOneTapSignIn.signIn();
      if (isNoSavedCredentialFoundResponse(response)) response = await GoogleOneTapSignIn.createAccount();
      if (!isSuccessResponse(response) || !response.data.idToken) throw new Error("Google sign-in was cancelled");
      const result = await mobileGoogleLogin(response.data.idToken, Device.deviceName ?? undefined); setUser(result.user);
    } catch (cause) { const message = cause instanceof Error ? cause.message : "Unable to sign in"; setError(message); throw cause; }
    finally { setLoading(false); }
  }, []);
  const signOut = useCallback(async () => { await Promise.all([revokeCurrentSession(), GoogleOneTapSignIn.signOut().catch(() => undefined)]); setUser(null); }, []);
  const value = useMemo(() => ({ user, loading, error, signInWithGoogle, signOut, reloadUser }), [user, loading, error, signInWithGoogle, signOut, reloadUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be used inside AuthProvider"); return value; }
