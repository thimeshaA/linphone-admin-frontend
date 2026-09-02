"use client";

import { Minus, Plus } from "lucide-react";
import {
  addPeriods,
  MAX_PERIODS,
  MIN_PERIODS,
  periodLabel,
} from "@/lib/telephony/period";
import { formatDate } from "@/lib/telephony/status";

/**
 * Expiry/renewal duration picker — fixed 6-month increments only, no
 * free-form calendar date selection. Stepping +/- moves in whole periods;
 * the resulting date is shown as a computed preview, never editable.
 */
export function PeriodPicker({
  id,
  label,
  baseDate,
  periods,
  onChange,
  min = MIN_PERIODS,
  max = MAX_PERIODS,
}: {
  id: string;
  label: string;
  baseDate: Date;
  periods: number;
  onChange: (periods: number) => void;
  min?: number;
  max?: number;
}) {
  const labelId = `${id}-label`;
  const resultDate = addPeriods(baseDate, periods);

  return (
    <div className="space-y-2">
      <p id={labelId} className="text-sm font-medium">
        {label}
      </p>
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex items-center gap-3"
      >
        <button
          type="button"
          onClick={() => onChange(Math.max(min, periods - 1))}
          disabled={periods <= min}
          aria-label="Fewer 6-month periods"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary transition-colors hover:bg-accent disabled:opacity-40"
        >
          <Minus aria-hidden="true" className="size-4" />
        </button>
        <div className="flex-1 rounded-xl bg-background px-4 py-2.5 text-center">
          <p className="text-sm font-semibold">{periodLabel(periods)}</p>
          <p className="label-meta mt-1">
            Until {formatDate(resultDate.toISOString())}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, periods + 1))}
          disabled={periods >= max}
          aria-label="More 6-month periods"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary transition-colors hover:bg-accent disabled:opacity-40"
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  );
}
