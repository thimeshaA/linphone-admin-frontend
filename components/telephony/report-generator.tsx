"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, Download, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "./primitives";
import { periodLabel, PeriodSelect } from "./period-select";
import { ApiError } from "@/lib/api/client";
import type { ReportPeriod } from "@/lib/api/reports";
import { downloadBlob } from "@/lib/utils";

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
  const [period, setPeriod] = useState<ReportPeriod>({
    type: "monthly",
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleGenerate() {
    setState("loading");
    setError("");
    try {
      const { blob, filename } = await generate(period);
      const label =
        period.type === "monthly"
          ? `${period.year}-${String(period.month).padStart(2, "0")}`
          : String(period.year);
      downloadBlob(blob, filename ?? `${filenamePrefix}-${label}.pdf`);
      setState("idle");
      toast.success("Report downloaded", {
        description: `${periodLabel(period)} — saved to your downloads.`,
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
          <PeriodSelect value={period} onChange={setPeriod} />

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
