/** Subscription/renewal periods come in fixed 6-month blocks — no free-form
 * calendar dates. See components/telephony/period-picker.tsx. */
const MONTHS_PER_PERIOD = 6;
export const MIN_PERIODS = 1;
export const MAX_PERIODS = 20; // 10 years — a sane ceiling, not a real limit

/** Adds `periods * 6` calendar months to `base`, clamping the day-of-month
 * to the target month's length (e.g. Jan 31 + 6mo -> Jul 31, not Aug 2). */
export function addPeriods(base: Date, periods: number): Date {
  const d = new Date(base);
  const targetMonth = d.getMonth() + periods * MONTHS_PER_PERIOD;
  d.setDate(1);
  d.setMonth(targetMonth);
  const daysInTargetMonth = new Date(
    d.getFullYear(),
    d.getMonth() + 1,
    0,
  ).getDate();
  d.setDate(Math.min(base.getDate(), daysInTargetMonth));
  return d;
}

export function periodLabel(periods: number): string {
  const months = periods * MONTHS_PER_PERIOD;
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  const parts: string[] = [];
  if (years) parts.push(`${years} year${years > 1 ? "s" : ""}`);
  if (remainder) parts.push(`${remainder} month${remainder > 1 ? "s" : ""}`);
  return parts.join(" ") || "0 months";
}
