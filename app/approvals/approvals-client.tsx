"use client";

import { useMemo, useState } from "react";
import { Check, CircleX, Inbox, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/telephony/app-shell";
import { EmptyState, PageHeader } from "@/components/telephony/primitives";
import { MetaTag, ModuleTag } from "@/components/telephony/status-pill";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTelephony } from "@/contexts/telephony-context";
import { formatDate } from "@/lib/telephony/status";
import type { AccessRequest } from "@/lib/telephony/types";
import { cn } from "@/lib/utils";

export function ApprovalsClient() {
  return (
    <AppShell>
      <ApprovalsPage />
    </AppShell>
  );
}

function ApprovalsPage() {
  const { user, requests, decideRequest } = useTelephony();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | "reseller" | "account">("all");
  const [module, setModule] = useState<"all" | "sip" | "esim">("all");
  const [status, setStatus] = useState<
    "pending" | "approved" | "rejected" | "all"
  >("pending");
  const [review, setReview] = useState<AccessRequest | null>(null);
  const [rejecting, setRejecting] = useState<AccessRequest | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter(
      (r) =>
        (!q ||
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.company ?? "").toLowerCase().includes(q)) &&
        (kind === "all" || r.kind === kind) &&
        (module === "all" || r.module === module) &&
        (status === "all" || r.status === status),
    );
  }, [requests, query, kind, module, status]);

  if (user?.role !== "admin") {
    return (
      <EmptyState
        title="Administrators only"
        description="The approval queue is restricted to platform administrators."
      />
    );
  }

  const pending = requests.filter((r) => r.status === "pending").length;

  async function approve(r: AccessRequest) {
    setBusy(true);
    await decideRequest(r.id, "approved");
    setBusy(false);
    setReview(null);
    toast.success(`${r.name} approved`, {
      description:
        r.kind === "reseller"
          ? `${r.module.toUpperCase()} reseller access granted.`
          : `${r.module.toUpperCase()} account request queued for provisioning.`,
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations workflow"
        title="Approval queue"
        description={`${pending} request${pending === 1 ? "" : "s"} awaiting a decision from the public intake form.`}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:w-80">
          <Search
            aria-hidden="true"
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            aria-label="Search requests"
            placeholder="Search name, email or company"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="glass h-11 w-full rounded-xl border-0 pl-11 pr-4 text-sm outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            label="Type"
            value={kind}
            onChange={(v) => setKind(v as typeof kind)}
            options={[
              ["all", "All types"],
              ["reseller", "Reseller"],
              ["account", "Account"],
            ]}
          />
          <Select
            label="Module"
            value={module}
            onChange={(v) => setModule(v as typeof module)}
            options={[
              ["all", "All modules"],
              ["sip", "SIP"],
              ["esim", "eSIM"],
            ]}
          />
          <Select
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as typeof status)}
            options={[
              ["pending", "Pending"],
              ["approved", "Approved"],
              ["rejected", "Rejected"],
              ["all", "All statuses"],
            ]}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="glass rounded-[20px]">
          <EmptyState
            icon={<Inbox aria-hidden="true" className="size-5" />}
            title={
              status === "pending" ? "Queue is clear" : "No requests found"
            }
            description={
              status === "pending"
                ? "Every incoming request has been reviewed. New submissions from the public form will appear here."
                : "No requests match the current filters. Widen the type, module or status filter."
            }
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              data-module={r.module}
              className="glass-module rounded-[20px] p-5 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <ModuleTag module={r.module} />
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[11px] leading-none tracking-wider uppercase",
                        r.kind === "reseller"
                          ? "module-tint"
                          : "bg-neutral-pill text-muted-foreground",
                      )}
                    >
                      {r.kind === "reseller"
                        ? "Reseller application"
                        : "Account request"}
                    </span>
                    {r.status !== "pending" ? (
                      <MetaTag
                        className={cn(
                          "gap-1.5",
                          r.status === "rejected"
                            ? "bg-negative-muted text-negative-foreground"
                            : "bg-positive-muted text-positive-foreground",
                        )}
                      >
                        {r.status === "rejected" ? (
                          <CircleX aria-hidden="true" className="size-3.5" />
                        ) : (
                          <Check aria-hidden="true" className="size-3.5" />
                        )}
                        {r.status}
                      </MetaTag>
                    ) : null}
                  </div>
                  <p className="mt-3 font-display text-lg font-bold tracking-tight">
                    {r.name}
                    {r.company ? (
                      <span className="text-muted-foreground">
                        {" "}
                        · {r.company}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {r.email} · {r.phone}
                  </p>
                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 font-mono text-[11px] tracking-wider uppercase text-muted-foreground">
                    <div className="flex gap-1.5">
                      <dt>Source:</dt>
                      <dd className="text-foreground">
                        {r.kind === "reseller"
                          ? "Public intake"
                          : (r.company ?? "Direct")}
                      </dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt>Assigned to:</dt>
                      <dd className="text-foreground">Platform operations</dd>
                    </div>
                  </dl>
                  {r.reason || r.note ? (
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {r.reason ?? r.note}
                    </p>
                  ) : null}
                  {r.decisionReason ? (
                    <p className="mt-3 max-w-2xl text-sm text-negative-foreground">
                      Rejected: {r.decisionReason}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-3">
                  <span className="label-meta">
                    {formatDate(r.submittedAt)}
                  </span>
                  {r.status === "pending" ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setReview(r)}
                        className="glass h-10 rounded-xl px-4 text-sm font-medium"
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        onClick={() => void approve(r)}
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-positive px-4 text-sm font-semibold text-background"
                      >
                        <Check aria-hidden="true" className="size-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReason("");
                          setRejecting(r);
                        }}
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-negative-muted px-4 text-sm font-semibold text-foreground"
                      >
                        <CircleX aria-hidden="true" className="size-4" />
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Review dialog */}
      <Dialog
        open={!!review}
        onOpenChange={(v) => (!v ? setReview(null) : undefined)}
      >
        <DialogContent
          data-module={review?.module ?? "sip"}
          className="max-h-[90dvh] overflow-y-auto rounded-[20px] sm:max-w-lg"
        >
          <DialogHeader>
            {review ? (
              <ModuleTag module={review.module} className="mb-1 w-fit" />
            ) : null}
            <DialogTitle className="font-display text-xl">
              Review request
            </DialogTitle>
            <DialogDescription>
              Full submission as received from the public intake form.
            </DialogDescription>
          </DialogHeader>
          {review ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  [
                    "Type",
                    review.kind === "reseller"
                      ? "Reseller application"
                      : "Account request",
                  ],
                  ["Module", review.module.toUpperCase()],
                  ["Name", review.name],
                  ["Email", review.email],
                  ["Phone", review.phone],
                  ["Company", review.company ?? "—"],
                  ["Country", review.country ?? "—"],
                  ["Website", review.website ?? "—"],
                  ["Submitted", formatDate(review.submittedAt)],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <dt className="label-meta">{k}</dt>
                  <dd className="mt-1.5 text-sm break-words">{v}</dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="label-meta">Notes</dt>
                <dd className="mt-1.5 text-sm leading-relaxed">
                  {review.reason ?? review.note ?? "—"}
                </dd>
              </div>
            </dl>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              className="glass inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium"
              onClick={() => setReview(null)}
            >
              Close
            </button>
            <button
              type="button"
              disabled={busy}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-positive px-5 text-sm font-semibold text-background disabled:opacity-60"
              onClick={() => review && void approve(review)}
            >
              {busy ? "Approving…" : "Approve request"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog
        open={!!rejecting}
        onOpenChange={(v) => (!v ? setRejecting(null) : undefined)}
      >
        <DialogContent className="rounded-[20px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Reject this request?
            </DialogTitle>
            <DialogDescription>
              The applicant is notified with the reason you provide. The request
              stays on record as rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="reject-reason" className="text-sm font-medium">
              Reason for rejection
            </label>
            <textarea
              id="reject-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="glass w-full rounded-xl p-4 text-sm outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-5 text-sm font-medium"
              onClick={() => setRejecting(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || reason.trim().length < 5}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-destructive px-5 text-sm font-semibold text-destructive-foreground ring-1 ring-input disabled:opacity-60"
              onClick={async () => {
                if (!rejecting) return;
                setBusy(true);
                await decideRequest(rejecting.id, "rejected", reason.trim());
                setBusy(false);
                toast.success(`${rejecting.name}'s request rejected`, {
                  description: "The applicant has been notified.",
                });
                setRejecting(null);
              }}
            >
              {busy ? "Rejecting…" : "Reject request"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  const id = `filter-${label.toLowerCase()}`;
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass h-11 rounded-xl px-3.5 font-mono text-[11px] tracking-wider uppercase outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </>
  );
}
