"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "./primitives";
import { ApiError } from "@/lib/api/client";
import type { ReportPeriod } from "@/lib/api/reports";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const selectClass =
  "h-11 w-full rounded-xl bg-background px-4 text-sm outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Shared by the account- and reseller-reports pages — only the eyebrow copy,
 * scope note, highlight bullets, icon and the endpoint called (via
 * `generate`) differ between them. Handles period selection, the download
 * itself (blob -> object URL -> click -> revoke) and the loading/error
 * states around report generation, which can take a moment server-side.
 */
export function ReportGenerator({
  eyebrow,
  title,
  description,
  scopeNote,
  filenamePrefix,
  generate,
  icon,
  highlights,
}: {
  eyebrow: string;
  title: string;
  description: string;
  scopeNote?: string;
  filenamePrefix: string;
  generate: (
    period: ReportPeriod,
  ) => Promise<{ blob: Blob; filename: string | null }>;
  icon: ReactNode;
  highlights: string[];
}) {
  const now = new Date();
  const [periodType, setPeriodType] = useState<"monthly" | "annual">("monthly");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const years = Array.from({ length: 8 }, (_, i) => now.getFullYear() - i);
  const periodLabel =
    periodType === "monthly"
      ? `${MONTH_NAMES[month - 1]} ${year}`
      : `Full year ${year}`;

  async function handleGenerate() {
    setState("loading");
    setError("");
    try {
      const period: ReportPeriod =
        periodType === "monthly"
          ? { type: "monthly", year, month }
          : { type: "annual", year };
      const { blob, filename } = await generate(period);
      const label =
        periodType === "monthly"
          ? `${year}-${String(month).padStart(2, "0")}`
          : String(year);
      downloadBlob(blob, filename ?? `${filenamePrefix}-${label}.pdf`);
      setState("idle");
      toast.success("Report downloaded", {
        description: `${periodLabel} — saved to your downloads.`,
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Report generation failed. Try again.",
      );
      setState("error");
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        module="sip"
        eyebrow={eyebrow}
        title={title}
        description={description}
      />

      {scopeNote ? (
        <div className="glass rounded-xl px-4 py-2.5 text-sm text-muted-foreground">
          {scopeNote}
        </div>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <section className="glass glass-hairline space-y-6 rounded-[20px] p-6 sm:p-7">
          <span className="module-tint grid size-12 place-items-center rounded-2xl">
            {icon}
          </span>
          <div>
            <h3 className="font-display text-lg font-bold tracking-tight text-module-strong">
              What&apos;s in the report
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Generated fresh from live data for the period you choose, and
              delivered as a ready-to-share PDF.
            </p>
          </div>
          <ul className="space-y-3">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-module-strong"
                />
                <span className="leading-relaxed">{h}</span>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-label="Generate report"
          className="glass-strong glass-hairline space-y-6 rounded-[20px] p-6 lg:sticky lg:top-6"
        >
          <div className="space-y-2">
            <p className="text-sm font-medium">Period</p>
            <div
              role="group"
              aria-label="Period type"
              className="inline-flex rounded-xl bg-secondary p-1"
            >
              {(["monthly", "annual"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={periodType === t}
                  onClick={() => setPeriodType(t)}
                  className={cn(
                    "h-9 rounded-lg px-4 text-sm font-medium capitalize transition-colors",
                    periodType === t
                      ? "module-bg"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {periodType === "monthly" ? (
              <div className="space-y-1.5">
                <label htmlFor="report-month" className="text-sm font-medium">
                  Month
                </label>
                <select
                  id="report-month"
                  className={selectClass}
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {MONTH_NAMES.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <label htmlFor="report-year" className="text-sm font-medium">
                Year
              </label>
              <select
                id="report-year"
                className={selectClass}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="module-tint flex items-center justify-between rounded-xl px-4 py-3 text-sm">
            <span className="text-muted-foreground">Covering</span>
            <span className="font-semibold text-module-strong">
              {periodLabel}
            </span>
          </div>

          {state === "error" ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-negative-muted px-4 py-3 text-sm text-negative-foreground"
            >
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={state === "loading"}
              className="module-bg inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {state === "loading" ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Download aria-hidden="true" className="size-4" />
              )}
              {state === "loading" ? "Generating report…" : "Generate report"}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Downloads as a PDF file
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
