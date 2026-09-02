// MySQL DATETIME columns reject JS's `.toISOString()` output (`T`, millis,
// trailing `Z`) — they need the literal `YYYY-MM-DD HH:MM:SS` form.
export function toMySqlDatetime(iso: string): string {
  return new Date(iso).toISOString().slice(0, 19).replace("T", " ");
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, extractErrorMessage(body, res.status));
  }
  return body as T;
}

// For endpoints that return a file (e.g. generated report PDFs) rather than
// JSON. A failed request still comes back as JSON, so errors are decoded the
// same way as apiFetch; only the success path differs.
export async function apiFetchBlob(
  path: string,
  init: RequestInit = {},
): Promise<{ blob: Blob; filename: string | null }> {
  const res = await fetch(`/api${path}`, { ...init, credentials: "include" });
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => ({}));
    throw new ApiError(res.status, extractErrorMessage(body, res.status));
  }
  return {
    blob: await res.blob(),
    filename: filenameFromContentDisposition(
      res.headers.get("Content-Disposition"),
    ),
  };
}

function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

// The backend reports validation failures in three different shapes across
// endpoints: a single `error` string, an `errors` object keyed by field
// (account/reseller creation), or an `errors` array of messages (batch
// account requests). Handle all three so the real reason reaches the UI
// instead of a generic "Request failed (400)".
function extractErrorMessage(body: unknown, status: number): string {
  if (typeof body === "object" && body !== null) {
    const record = body as Record<string, unknown>;
    if (typeof record["error"] === "string") return record["error"];
    if (Array.isArray(record["errors"])) {
      return record["errors"].map(String).join(" ");
    }
    if (typeof record["errors"] === "object" && record["errors"] !== null) {
      return Object.values(record["errors"] as Record<string, unknown>)
        .map(String)
        .join(" ");
    }
  }
  return `Request failed (${status})`;
}
