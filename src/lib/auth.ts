import { auth } from "@/auth";
import { getUserByEmail, getUserById } from "@/lib/convex-store";
import { verifyAccessToken } from "@/lib/mobile-auth";

// Always reads onboarded from DB. Falls back to email lookup if
// session.user.id is the Google OAuth sub (not our cuid).
export async function getSession(request?: Request) {
  const authorization = request?.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return verifyAccessToken(authorization.slice(7).trim());
  }

  const session = await auth();
  if (!session?.user) return null;

  try {
    // Primary: look up by our DB id stored in session
    let user: { id: string; onboarded: boolean } | null = null;

    if (session.user.id) {
      const found = await getUserById(session.user.id);
      user = found ? { id: found.id, onboarded: found.onboarded } : null;
    }

    // Fallback: session.user.id might be the Google OAuth sub (numeric string).
    // Try by email which is always correct.
    if (!user && session.user.email) {
      const found = await getUserByEmail(session.user.email);
      user = found ? { id: found.id, onboarded: found.onboarded } : null;
    }

    if (!user) return null;
    return { userId: user.id, onboarded: user.onboarded };
  } catch {
    return null;
  }
}
