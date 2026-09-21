"use client";

import { useEffect, useState } from "react";
import { Wallet as WalletIcon } from "lucide-react";
import { EmptyState, PageHeader, StatBlock } from "./primitives";
import { useTelephony } from "@/contexts/telephony-context";
import { ApiError } from "@/lib/api/client";
import { walletApi } from "@/lib/api/wallet";
import type { Wallet } from "@/lib/telephony/types";
import { BalanceStat } from "./wallet-balance";
import { WalletLedgerTable } from "./wallet-ledger-table";

const LEDGER_PAGE_SIZE = 10;

/** A reseller's own wallet — balance, derived owed count, and their ledger
 * history. Admin-side equivalent for a specific reseller is
 * `ResellerWalletDetailView`, reached from the Wallets list or a reseller's
 * "View wallet" row action. */
export function WalletView() {
  const { user, visibleAccounts, accountsLoading } = useTelephony();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // A 404 means this login predates the wallet feature and none was ever
  // provisioned for it — a real, displayable state, not a failure.
  const [notFound, setNotFound] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user?.role !== "reseller") return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setNotFound(false);
    walletApi
      .get(user.id, { page, limit: LEDGER_PAGE_SIZE })
      .then((w) => {
        if (!cancelled) setWallet(w);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          return;
        }
        setError(
          err instanceof ApiError ? err.message : "Could not load your wallet.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, page]);

  if (user?.role !== "reseller") {
    return (
      <EmptyState
        title="Resellers only"
        description="Wallets belong to reseller logins — sign in as a reseller to view one."
      />
    );
  }

  const pageCount = wallet
    ? Math.max(1, Math.ceil(wallet.pagination.total / wallet.pagination.limit))
    : 1;

  return (
    <div className="space-y-10">
      <PageHeader
        module="sip"
        eyebrow="Account"
        title="Wallet"
        description="Your balance and ledger history — top-ups, initial credit, renewal deductions and payments."
      />

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-negative-muted px-4 py-3 text-sm text-negative-foreground"
        >
          {error}
        </p>
      ) : notFound ? (
        <div className="glass rounded-[20px]">
          <EmptyState
            icon={<WalletIcon aria-hidden="true" className="size-5" />}
            title="No wallet on record"
            description="Your login predates the wallet feature, so none was ever provisioned for it. Contact an administrator if you believe this is wrong."
          />
        </div>
      ) : (
        <>
          <section
            aria-label="Overview"
            className="grid grid-cols-2 gap-6 lg:grid-cols-4"
          >
            <BalanceStat
              balanceUsd={wallet?.balanceUsd ?? 0}
              loading={loading && !wallet}
              hint={
                wallet && wallet.balanceUsd < 0
                  ? "Negative — top up to avoid interrupted renewals"
                  : undefined
              }
            />
            <StatBlock
              label="Owed accounts"
              value={wallet?.owedAccounts ?? 0}
              tone={wallet && wallet.owedAccounts > 0 ? "negative" : "default"}
              hint="Renewal cycles the deficit represents"
              loading={loading && !wallet}
            />
          </section>

          <section aria-label="Ledger history" className="space-y-4">
            <h2 className="font-display text-lg font-bold tracking-tight">
              Ledger history
            </h2>
            <WalletLedgerTable
              entries={wallet?.ledger ?? []}
              accounts={visibleAccounts}
              loading={(loading && !wallet) || accountsLoading}
              page={wallet?.pagination.page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </section>
        </>
      )}
    </div>
  );
}
