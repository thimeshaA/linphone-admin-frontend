/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't autogenerate AGENTS.md/CLAUDE.md — this repo manages its own docs.
  agentRules: false,
  // Produces the minimal .next/standalone server bundle for Docker, instead of
  // requiring the full node_modules tree in the final image.
  output: 'standalone',
};

export default nextConfig;
