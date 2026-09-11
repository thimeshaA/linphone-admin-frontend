import type { MockUser } from "./types";

/**
 * A role is just a bundle of permission keys. Admin gets every namespace as
 * a wildcard; a reseller gets the platform basics plus a wildcard per module
 * they've been granted. New roles/modules plug in here without touching the
 * nav config or any page component.
 */
export function permissionsFor(user: MockUser | null): Set<string> {
  if (!user) return new Set();
  if (user.role === "admin") {
    return new Set([
      "platform.overview",
      "platform.notifications",
      "platform.settings",
      "sip.*",
    ]);
  }
  const perms = new Set<string>([
    "platform.overview",
    "platform.notifications",
    "platform.settings",
  ]);
  for (const m of user.modules) perms.add(`${m}.*`);
  return perms;
}

export function hasPermission(perms: Set<string>, key: string): boolean {
  if (perms.has(key)) return true;
  const ns = key.split(".")[0];
  return perms.has(`${ns}.*`);
}
