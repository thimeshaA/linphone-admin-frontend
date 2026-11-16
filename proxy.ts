import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The API path in every environment, dev and production: the browser only
// ever calls same-origin /api/*, and this rewrites each request to the
// Express backend, so there is no cross-origin/CORS setup. BACKEND_URL is
// read per request at run time, so it must be set correctly in every
// deployment (the container's run-time env), not at build time.
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
