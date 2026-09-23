# linphone-admin-frontend (Next.js App Router, pnpm)
#
# BACKEND_URL is read server-side only (proxy.ts, request time) — it is NOT
# NEXT_PUBLIC_-prefixed and is not referenced by next.config.mjs's `env` block,
# so it is a plain runtime env var. It is supplied by docker-compose at
# container start, not as a build arg, and changing it does NOT require a
# rebuild — just a container restart with the new value.
#
# NEXT_PUBLIC_API_URL (see .env.example) was checked and is not referenced
# anywhere in the app/lib code, so it needs no build-time handling here.

FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
