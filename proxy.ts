import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Dev-time proxy: rewrites same-origin /api/* requests to the Express backend
// so client code can call `/api/...` without hitting cross-origin/CORS issues
// from a different port.
const BACKEND_URL = process.env["BACKEND_URL"] ?? "http://localhost:4000";

export function proxy(request: NextRequest) {
  const url = new URL(
    request.nextUrl.pathname + request.nextUrl.search,
    BACKEND_URL,
  );
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: "/api/:path*",
};
