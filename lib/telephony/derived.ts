import type { ModuleKey, MockUser, SipAccount } from "./types";

export interface ResellerRow {
  user: MockUser;
  accountCount: number;
}

/** Resellers who hold access to the given module, with their account count. */
export function getResellers(
  users: MockUser[],
  accounts: SipAccount[],
  module: ModuleKey,
): ResellerRow[] {
  return users
    .filter((u) => u.role === "reseller" && u.modules.includes(module))
    .map((user) => ({
      user,
      accountCount:
        module === "sip"
          ? accounts.filter((a) => a.createdById === user.id).length
          : 0,
    }));
}

/**
 * "End users" scoped to a module = the identities held by that module's
 * accounts. Today only SIP has a real account entity, so this is a thin
 * wrapper — it's the seam where an EsimProfile holder list would plug in.
 */
export function getEndUsers(
  accounts: SipAccount[],
  module: ModuleKey,
): SipAccount[] {
  return module === "sip" ? accounts : [];
}
