import type { User } from "@shared/models/auth";

type UserLike = Partial<User> | null | undefined;

export function displayName(u: UserLike): string {
  if (!u) return "User";
  const first = u.firstName?.trim();
  const last = u.lastName?.trim();
  if (first || last) return `${first ?? ""} ${last ?? ""}`.trim();
  if (u.username) return u.username;
  if (u.email) return u.email.split("@")[0];
  return "User";
}

export function userHandle(u: UserLike): string {
  if (!u) return "user";
  if (u.username) return u.username;
  if (u.email) return u.email.split("@")[0];
  if (u.firstName) return u.firstName.toLowerCase();
  return (u.id ?? "user").slice(0, 8);
}

export function userInitial(u: UserLike): string {
  if (!u) return "U";
  return (
    u.firstName?.[0] ||
    u.username?.[0] ||
    u.email?.[0] ||
    "U"
  ).toUpperCase();
}
