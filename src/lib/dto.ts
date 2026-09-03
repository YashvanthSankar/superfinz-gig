import type { UserDto } from "@superfinz/shared";
import type { Prisma } from "@/generated/prisma/client";

type UserWithProfile = Prisma.UserGetPayload<{ include: { profile: true } }>;

export function toUserDto(user: UserWithProfile): UserDto {
  const { googleId: _googleId, profile, ...publicUser } = user;
  void _googleId;
  return {
    ...publicUser,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    profile: profile ? {
      ...profile,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    } : null,
  };
}
