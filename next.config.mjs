/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't autogenerate AGENTS.md/CLAUDE.md — this repo manages its own docs.
  agentRules: false,
  // Produces the minimal .next/standalone server bundle for Docker, instead of
  // requiring the full node_modules tree in the final image.
  output: "standalone",
  // Drop the `X-Powered-By: Next.js` response header — no reason to hand out
  // framework fingerprinting for free.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // No embedding in a frame anywhere — this is an internal admin
          // panel, never meant to be iframed.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Every page here is authenticated admin/reseller data (even
          // though the real payloads are fetched client-side, not baked
          // into the HTML shell) — never let a shared machine's browser
          // cache or back-button navigation resurface it after logout.
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
