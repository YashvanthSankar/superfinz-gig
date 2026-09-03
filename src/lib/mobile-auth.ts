import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

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
  const session = await prisma.mobileSession.create({
    data: {
      userId,
      deviceLabel,
      refreshTokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
  return {
    accessToken: await createAccessToken(userId, session.id),
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

export async function rotateMobileSession(refreshToken: string) {
  const oldHash = hashRefreshToken(refreshToken);
  const session = await prisma.mobileSession.findUnique({
    where: { refreshTokenHash: oldHash },
    include: { user: { include: { profile: true } } },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;

  const replacement = newRefreshToken();
  const updated = await prisma.mobileSession.updateMany({
    where: { id: session.id, refreshTokenHash: oldHash, revokedAt: null },
    data: {
      refreshTokenHash: hashRefreshToken(replacement),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
  if (updated.count !== 1) return null;

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
    const session = await prisma.mobileSession.findUnique({
      where: { id: payload.sid },
      select: { userId: true, expiresAt: true, revokedAt: true, user: { select: { onboarded: true } } },
    });
    if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt <= new Date()) return null;
    return { userId: session.userId, onboarded: session.user.onboarded };
  } catch {
    return null;
  }
}

export async function revokeRefreshToken(refreshToken: string) {
  return prisma.mobileSession.updateMany({
    where: { refreshTokenHash: hashRefreshToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
