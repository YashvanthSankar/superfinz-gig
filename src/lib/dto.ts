import type { IncomeSource, UserDto } from "@superfinz/shared";
import type { UserWithProfile } from "@/types";

export function toUserDto(user: UserWithProfile): UserDto {
  const { googleId: _googleId, profile, ...publicUser } = user;
  void _googleId;
  return {
    ...publicUser,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    profile: profile ? {
      ...profile,
      incomeSources: profile.incomeSources as IncomeSource[],
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    } : null,
  };
}
