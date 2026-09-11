"use client";

import type { ReportPeriod } from "@/lib/api/reports";
import type { InvoicePeriodType } from "@/lib/telephony/types";
import { cn } from "@/lib/utils";

export const MONTH_NAMES = [
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

export function periodLabel(period: ReportPeriod): string {
  return period.type === "monthly"
    ? `${MONTH_NAMES[period.month - 1]} ${period.year}`
    : `Full year ${period.year}`;
}

/** Compact form for table cells: "August 2026" / "2026", no "Full year"
 * prefix. Parses the `periodValue` slug ("YYYY-MM" / "YYYY") the invoices
 * API stores and returns, rather than a `ReportPeriod` object. */
export function formatPeriodValue(
  periodType: InvoicePeriodType,
  periodValue: string,
) {
  if (periodType === "annual") return periodValue;
  const [year, month] = periodValue.split("-");
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

/**
 * A period's last calendar day - mirrors the backend's own
 * `lastDayOfPeriod` (controllers/invoicesController.js) exactly: day 0 of
 * the month *after* the period rolls back to the period's own last day, so
 * month length/leap years are handled by `Date` itself rather than a lookup
 * table. Local `Date` construction throughout (no UTC conversion), same
 * convention the rest of this app already uses for date comparisons (see
 * `daysUntil` in lib/telephony/status.ts) - this is what lets the frontend's
 * disabled-state cutoff agree with the backend's send restriction exactly.
 */
export function lastDayOfPeriodValue(
  periodType: InvoicePeriodType,
  periodValue: string,
): Date {
  if (periodType === "annual") {
    return new Date(Number(periodValue), 11, 31);
  }
  const [year, month] = periodValue.split("-");
  return new Date(Number(year), Number(month), 0);
}

/** Whether an invoice's period has reached its last day (or already passed)
 * - the same date-only rule (the whole last day counts) the backend enforces
 * on `POST /api/invoices/:id/send`. Generation/regeneration/preview are
 * unaffected by this - it only gates the send action. */
export function periodHasEnded(
  periodType: InvoicePeriodType,
  periodValue: string,
) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return today >= lastDayOfPeriodValue(periodType, periodValue);
}

/**
 * Monthly/annual period picker — Reports' one true implementation, shared
 * (not duplicated) with the invoice-generation dialog so both feel like the
 * same feature. Originally lived inline inside `ReportGenerator`.
 */
export function PeriodSelect({
  value,
  onChange,
}: {
  value: ReportPeriod;
  onChange: (period: ReportPeriod) => void;
}) {
  const now = new Date();
  const years = Array.from({ length: 8 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-4">
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
              aria-pressed={value.type === t}
              onClick={() =>
                onChange(
                  t === "monthly"
                    ? {
                        type: "monthly",
                        year: value.year,
                        month:
                          value.type === "monthly"
                            ? value.month
                            : now.getMonth() + 1,
                      }
                    : { type: "annual", year: value.year },
                )
              }
              className={cn(
                "h-9 rounded-lg px-4 text-sm font-medium capitalize transition-colors",
                value.type === t
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
        {value.type === "monthly" ? (
          <div className="space-y-1.5">
            <label htmlFor="period-month" className="text-sm font-medium">
              Month
            </label>
            <select
              id="period-month"
              className={selectClass}
              value={value.month}
              onChange={(e) =>
                onChange({
                  type: "monthly",
                  year: value.year,
                  month: Number(e.target.value),
                })
              }
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
          <label htmlFor="period-year" className="text-sm font-medium">
            Year
          </label>
          <select
            id="period-year"
            className={selectClass}
            value={value.year}
            onChange={(e) =>
              onChange({
                ...value,
                year: Number(e.target.value),
              } as ReportPeriod)
            }
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
          {periodLabel(value)}
        </span>
      </div>
    </div>
  );
}
