# Frontend External-Dependency Audit

Scope: full repo (`app/`, `components/`, `lib/`, `contexts/`, `styles/`, config files), excluding `node_modules` and `.next`. Read-only — nothing was changed.

Bottom line: this codebase is almost entirely self-contained. There is **one runtime dependency on a third party** (Google Fonts, loaded via `<link>` tags), and everything else checked out clean.

---

## ✅ Fixed

### 1. Google Fonts loaded at runtime via `<link>` tags — RESOLVED
**File:** [app/layout.tsx](app/layout.tsx) (previously lines 31-41)

**Resolution:** replaced the `<link>` tags with self-hosted fonts via `@fontsource` packages, imported directly in `app/layout.tsx`:

- `@fontsource/space-grotesk` — imported `500.css` and `700.css` only (the two weights actually used via `font-display` + `font-bold`/`font-medium`).
- `@fontsource/dm-sans` — the **static** package, not `@fontsource-variable/dm-sans`. The variable package registers the family as `'DM Sans Variable'`, which would have required changing the `--font-sans` value in `styles/globals.css`; the static package registers it as `'DM Sans'`, matching the existing CSS custom property exactly, so no other file needed to change. Imported `400.css`, `500.css`, `700.css` — the three weights actually used across the app (`font-normal`/default body text, `font-medium`, `font-bold`).
- `@fontsource/jetbrains-mono` — imported `400.css` and `500.css` only (the two weights used via `font-mono` + `font-normal`/`font-medium`).

No other files needed changes — `styles/globals.css` already referenced the fonts by bare family name (`"DM Sans"`, `"Space Grotesk"`, `"JetBrains Mono"`), and `@font-face` registration doesn't depend on import order relative to usage.

**Verified:**
- `pnpm build` succeeds; production bundle CSS references only local, content-hashed `/_next/static/media/*.woff2` files — zero occurrences of `googleapis`/`gstatic` anywhere in the built output.
- Served HTML/CSS from a running dev server checked directly — no Google Fonts strings present.
- No remaining references to `fonts.googleapis.com` / `fonts.gstatic.com` anywhere in the source tree (this document's own historical description above is the only remaining string match, kept for record-keeping).
- Each `@fontsource` weight file only pulls in the weight it declares (fontsource ships per-weight files, not the whole family), so no unused weights are bundled beyond what's already scoped above.

Original finding, kept for reference:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=DM+Sans:...&family=JetBrains+Mono:wght@400;500&display=swap" />
```

This is **not** `next/font/google` — it's raw `<link>` tags in the root layout, which means every single page load has the visiting browser fetch CSS from `fonts.googleapis.com` and the actual font files from `fonts.gstatic.com`. This is the most direct violation of the "no outsourced links" policy in the whole codebase: it's a live, per-request, client-side network dependency on Google — worse than `next/font/google` would be, since that at least self-hosts the font file after a one-time fetch at build time.

Fonts in use: **Space Grotesk** (500/700), **DM Sans** (variable, 400/500/700), **JetBrains Mono** (400/500).

**Fix path:** download the three font families (all are open-source/OFL, available directly from Google Fonts or Fontsource) and either self-host static files with `next/font/local`, or install the matching `@fontsource/*` npm packages (which vendor the font files into `node_modules`, no network calls). Either removes the runtime dependency entirely.

---

## 🟡 Needs a decision

None. `next/font/google` itself is not used anywhere in the codebase — searched explicitly, zero hits — so there's no "acceptable build-time fetch" tradeoff to weigh here. The only Google Fonts usage is the runtime `<link>` case above, which isn't a judgment call — it's strictly worse than either of the self-hosting options.

---

## 🟢 Clearly fine

| Location | What it is | Why it's fine |
|---|---|---|
| [components.json:2](components.json#L2) `"$schema": "https://ui.shadcn.com/schema.json"` | JSON Schema reference for editor autocomplete / the `shadcn` CLI | Only consulted by your editor or by `npx shadcn add` when a developer runs it manually. Not read during `next build` or `next dev`, and never shipped to the browser. |
| [proxy.ts:7](proxy.ts#L7) `BACKEND_URL ?? "http://localhost:4000"` | Dev-time rewrite target for `/api/*` | Points at your own backend (Express), not a third party. `localhost` default, overridable via env var in real deployments. |
| [lib/api/client.ts](lib/api/client.ts) `apiFetch`/`apiFetchBlob` | All `fetch()` calls in the app | Every call goes to `/api/...` (same-origin), which `proxy.ts` rewrites to your own backend. Grepped the whole repo for `fetch(`/`axios`/`XMLHttpRequest` — no other network calls exist. |
| [app/login-client.tsx:20](app/login-client.tsx#L20) `xmlns='http://www.w3.org/2000/svg'` | SVG namespace declaration inside an inline `data:image/svg+xml` | Required XML boilerplate, not a URL that's ever fetched. |
| [app/request/request-client.tsx:344](app/request/request-client.tsx#L344) `placeholder="https://"` | Placeholder text in a form `<input>` | Just UI copy prompting the user to type a URL; not a reference itself. |
| Images (`app/login-client.tsx`, `components/telephony/logo.tsx`) | `next/image` with `src="/brand/login-illustration.png"`, `/logo-mark-light.png`, `/logo-mark-dark.png` | All local files served from `public/`. No `<img>` tags anywhere, and no remote `src` values found. |
| `public/*.png` | Local brand assets | Bundled in the repo, not fetched from elsewhere. |
| `styles/globals.css` `@import "tailwindcss" source(none)`, `@import "tw-animate-css"` | npm package imports resolved at build time | Resolve from `node_modules`, not the network. No `@font-face`/`url(...)` pointing at a remote host anywhere in the CSS. |
| `package.json` dependencies | Radix UI, `lucide-react`, `recharts`, `motion`, `sonner`, `date-fns`, `zod`, `react-hook-form`, etc. | All standard npm packages, bundled at build time. None of them phone home or load a CDN asset at runtime. No Stripe.js, Google Maps SDK, analytics, chat widgets, CAPTCHA, or similar found anywhere. |
| `components/ui/*` (shadcn-sourced) | 40+ Radix-based primitives (avatar, dialog, sidebar, chart, etc.) | Read through the set — no CDN icon/font references or leftover doc-example URLs. `avatar.tsx` in particular has no hardcoded fallback image URL (uses `AvatarFallback`, no `src`). |
| `public/robots.txt` | Static robots file with bot rules | Just text; no external references. |
| iframes / third-party widgets / embedded scripts | — | None exist anywhere in the codebase (`<iframe>`, `<script src=...>`, `next/script` all searched — zero hits). |
| Hardcoded API keys / third-party SDKs | — | None found (searched for Stripe, Google Maps, reCAPTCHA/hCaptcha/Turnstile, Sentry, analytics/tag-manager, chat-widget patterns — zero hits). |

---

## Search methodology (for reproducibility)

- `next/font/google` / `next/font/local` usage — none found for either.
- All `https?://...` literals across `.ts`/`.tsx`/`.js`/`.jsx`/`.css`/`.html`/`.json` (excluding `node_modules`/`.next`).
- `<img>`, `next/image` `Image` usages and their `src` values.
- `<iframe>`, `<script src=...>`, `next/script` usage.
- CDN host keywords: `cdnjs`, `unpkg.com`, `jsdelivr`, `gravatar`, `picsum`, `unsplash`, `cloudflare`.
- `fetch(`, `axios.`, `XMLHttpRequest`, `new URL(` call sites.
- `@font-face` / `url(...)` in all `.css` files.
- Known third-party SDK/widget keywords: Stripe, Google Maps, reCAPTCHA/hCaptcha/Turnstile, Mapbox, Sentry, Mixpanel, Segment, gtag/GTM, Hotjar, Intercom, Zendesk, Crisp, Tawk.
- Full `package.json` dependency review.
- Manual read of `app/layout.tsx`, `proxy.ts`, `next.config.js`, `components.json`, `lib/api/client.ts`, `components/ui/avatar.tsx`.
