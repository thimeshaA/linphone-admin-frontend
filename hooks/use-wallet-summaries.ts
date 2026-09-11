"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { walletApi } from "@/lib/api/wallet";
import type { Reseller } from "@/lib/telephony/types";

// `null` = confirmed no wallet on record (404 — the reseller predates the
// wallet feature and none was ever provisioned for them). Absent from the
// map entirely = not yet resolved (still loading, or a transient failure).
export type WalletSummary = {
  balanceUsd: number;
  owedAccounts: number;
  updatedAt: string;
} | null;

/**
 * Fetches a balance/owed-count/last-activity summary for every reseller in
 * one batch. There's no bulk wallet endpoint, so this is N requests (each
 * with `limit: 1` to keep the ledger payload minimal — only the summary
 * fields are used). Shared by the Resellers list's Wallet column and the
 * Wallets list page so this fetch-and-404-handling logic lives in exactly
 * one place instead of being copy-pasted between the two.
 */
export function useWalletSummaries(resellers: Reseller[], enabled: boolean) {
  const [summaries, setSummaries] = useState<Record<string, WalletSummary>>({});
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!enabled || resellers.length === 0) return;
    let cancelled = false;
    setLoading(true);
    Promise.all(
      resellers.map((r) =>
        walletApi
          .get(r.id, { limit: 1 })
          .then(
            (w) =>
              [
                r.id,
                {
                  balanceUsd: w.balanceUsd,
                  owedAccounts: w.owedAccounts,
                  updatedAt: w.updatedAt,
                },
              ] as const,
          )
          .catch((err) => {
            // 404 = confirmed no wallet on record for this reseller — a
            // real, displayable state, not a transient failure to hide.
            if (err instanceof ApiError && err.status === 404) {
              return [r.id, null] as const;
            }
            return null;
          }),
      ),
    ).then((results) => {
      if (cancelled) return;
      const next: Record<string, WalletSummary> = {};
      for (const entry of results) {
        if (entry) next[entry[0]] = entry[1];
      }
      setSummaries(next);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [resellers, enabled, refreshKey]);

  return { summaries, loading, refresh };
}
