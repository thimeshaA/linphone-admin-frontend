import { apiFetchBlob } from "./client";

export type ReportPeriod =
  | { type: "monthly"; year: number; month: number } // month: 1-12
  | { type: "annual"; year: number };

function periodQuery(period: ReportPeriod): string {
  const params = new URLSearchParams({ period: period.type });
  if (period.type === "monthly") {
    params.set(
      "month",
      `${period.year}-${String(period.month).padStart(2, "0")}`,
    );
  } else {
    params.set("year", String(period.year));
  }
  return params.toString();
}

// Both endpoints return the generated PDF as a blob; scoping (reseller vs.
// platform-wide) is entirely server-side based on the caller's session.
export const reportsApi = {
  accounts: (period: ReportPeriod) =>
    apiFetchBlob(`/reports/accounts?${periodQuery(period)}`),
  resellers: (period: ReportPeriod) =>
    apiFetchBlob(`/reports/resellers?${periodQuery(period)}`),
};
