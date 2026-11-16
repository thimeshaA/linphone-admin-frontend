# linphone-admin-frontend (Next.js App Router, pnpm) — built with rootless Podman.
#
# Build:
#   podman build --build-arg NEXT_PUBLIC_SIP_DOMAIN=<sip-domain> -f Containerfile .
#
# NEXT_PUBLIC_SIP_DOMAIN is a REQUIRED build arg. Next.js inlines NEXT_PUBLIC_*
# values into the client bundle at `next build`, so it must be present in the
# builder stage — setting it at run time has no effect, and changing it needs
# a rebuild. The build fails if it is missing (here and in next.config.mjs)
# rather than shipping a bundle without a SIP domain.
#
# BACKEND_URL is read server-side only (proxy.ts, per request), so it is a
# plain run-time env var supplied by the backend repo's compose/Quadlet files.
# Changing it needs only a container restart, not a rebuild.
#
# No HEALTHCHECK here: the healthcheck is defined at run time in the backend
# repo's compose/Quadlet files and runs `wget` inside this container.
#
# node:22 (not 20): pnpm@11.21.0 via corepack requires Node >=22.13 — on Node
# 20 the install crashes with ERR_UNKNOWN_BUILTIN_MODULE (node:sqlite).

FROM docker.io/library/node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM docker.io/library/node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_SIP_DOMAIN
RUN if [ -z "$NEXT_PUBLIC_SIP_DOMAIN" ]; then \
      echo "ERROR: NEXT_PUBLIC_SIP_DOMAIN build arg is required (--build-arg NEXT_PUBLIC_SIP_DOMAIN=<sip-domain>)." >&2; \
      exit 1; \
    fi
ENV NEXT_PUBLIC_SIP_DOMAIN=$NEXT_PUBLIC_SIP_DOMAIN
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM docker.io/library/node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# The run-time healthcheck uses wget (BusyBox, part of the Alpine base). Fail
# the build if a base-image change ever drops it.
RUN command -v wget >/dev/null \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
