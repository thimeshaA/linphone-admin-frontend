/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't autogenerate AGENTS.md/CLAUDE.md — this repo manages its own docs.
  agentRules: false,
};

export default nextConfig;
