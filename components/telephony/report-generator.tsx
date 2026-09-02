"use client";

import { useState } from "react";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
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
 * scope note and the endpoint called (via `generate`) differ between them.
 * Handles period selection, the download itself (blob -> object URL -> click
 * -> revoke) and the loading/error states around report generation, which
 * can take a moment server-side.
 */
export function ReportGenerator({
  eyebrow,
  title,
  description,
  scopeNote,
  filenamePrefix,
  generate,
}: {
  eyebrow: string;
  title: string;
  description: string;
  scopeNote?: string;
  filenamePrefix: string;
  generate: (
    period: ReportPeriod,
  ) => Promise<{ blob: Blob; filename: string | null }>;
}) {
  const now = new Date();
  const [periodType, setPeriodType] = useState<"monthly" | "annual">("monthly");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const years = Array.from({ length: 8 }, (_, i) => now.getFullYear() - i);

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

      <section
        aria-label="Generate report"
        className="glass max-w-xl space-y-6 rounded-[20px] p-6"
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

        <button
          type="button"
          onClick={handleGenerate}
          disabled={state === "loading"}
          className="module-bg inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {state === "loading" ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Download aria-hidden="true" className="size-4" />
          )}
          {state === "loading" ? "Generating report…" : "Generate report"}
        </button>
      </section>
    </div>
  );
}
