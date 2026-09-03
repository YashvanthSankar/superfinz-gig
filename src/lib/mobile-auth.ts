import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import {
  createSessionRecord,
  getSessionById,
  getSessionByRefreshHash,
  revokeSessionByRefreshHash,
  rotateSessionRecord,
} from "@/lib/convex-store";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function signingSecret() {
  const value = process.env.MOBILE_JWT_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("MOBILE_JWT_SECRET (or AUTH_SECRET) is not configured");
  return new TextEncoder().encode(value);
}

export function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function newRefreshToken() {
  return randomBytes(48).toString("base64url");
}

export async function createAccessToken(userId: string, sessionId: string) {
  return new SignJWT({ sid: sessionId, type: "mobile-access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(signingSecret());
}

export async function createMobileSession(userId: string, deviceLabel?: string) {
  const refreshToken = newRefreshToken();
  const sessionId = await createSessionRecord({
    userId,
    deviceLabel,
    refreshTokenHash: hashRefreshToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  return {
    accessToken: await createAccessToken(userId, sessionId),
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

export async function rotateMobileSession(refreshToken: string) {
  const oldHash = hashRefreshToken(refreshToken);
  const session = await getSessionByRefreshHash(oldHash);
  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;

  const replacement = newRefreshToken();
  const updated = await rotateSessionRecord({
    id: session.id,
    oldRefreshTokenHash: oldHash,
    newRefreshTokenHash: hashRefreshToken(replacement),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  if (!updated) return null;

  return {
    accessToken: await createAccessToken(session.userId, session.id),
    refreshToken: replacement,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    user: session.user,
  };
}

export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, signingSecret(), { algorithms: ["HS256"] });
    if (payload.type !== "mobile-access" || !payload.sub || typeof payload.sid !== "string") return null;
    const session = await getSessionById(payload.sid);
    if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt <= new Date()) return null;
    return { userId: session.userId, onboarded: session.user.onboarded };
  } catch {
    return null;
  }
}

export async function revokeRefreshToken(refreshToken: string) {
  return revokeSessionByRefreshHash(hashRefreshToken(refreshToken));
}
