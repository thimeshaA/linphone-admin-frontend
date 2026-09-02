"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from "lucide-react";
import { motion } from "motion/react";
import { useTelephony } from "@/contexts/telephony-context";
import { BrandMark } from "@/components/telephony/brand-mark";

const NOISE_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const SIGNAL_DOTS = [
  { top: "20%", left: "58%", size: 4, duration: 9, delay: 0 },
  { top: "58%", left: "78%", size: 3, duration: 11, delay: 2.5 },
];

/**
 * Large rounded diagonal wedge separating the illustration from the auth
 * column: narrow + flush at the top, a single tangent-continuous S-curve
 * through the middle, wide + flush at the bottom. objectBoundingBox units
 * (0-1) so the same path scales to whichever container it's applied to —
 * "tablet" uses a shallower version per the simplified-on-tablet brief.
 */
function wedgePath(xNarrow: number, xWide: number, y1: number, y2: number) {
  const dx = (xWide - xNarrow) / 2;
  const dy = (y2 - y1) / 2;
  const xm = xNarrow + dx;
  const ym = y1 + dy;
  const c1x = xNarrow + dx * 0.7;
  const c2x = xm + dx * 0.7;
  return `M0,0 L${xNarrow},0 L${xNarrow},${y1} C${xNarrow},${ym} ${c1x},${ym} ${xm},${ym} C${c2x},${ym} ${xWide},${ym} ${xWide},${y2} L${xWide},1 L0,1 Z`;
}

const WEDGE_DESKTOP = wedgePath(0.62, 1, 0.32, 0.68);
const WEDGE_TABLET = wedgePath(0.78, 1, 0.38, 0.62);

/**
 * Mobile counterpart of wedgePath, rotated: the illustration's bottom edge
 * (rather than its right edge) varies between a shallow depth and a deep
 * one, flush at both ends with a single tangent-continuous curve between —
 * same architectural language, translated to a horizontal hero band.
 */
function wedgePathBottom(
  yShallow: number,
  yDeep: number,
  xStart: number,
  xEnd: number,
) {
  const dx = (xEnd - xStart) / 2;
  const k = 0.55;
  const c1x = xEnd - k * dx;
  const c2x = xStart + k * dx;
  return `M0,0 L1,0 L1,${yDeep} L${xEnd},${yDeep} C${c1x},${yDeep} ${c2x},${yShallow} ${xStart},${yShallow} L0,${yShallow} L0,0 Z`;
}

const WEDGE_MOBILE = wedgePathBottom(1, 0.56, 0.32, 0.64);

export function LoginClient() {
  const { signIn, user, hydrated } = useTelephony();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<
    "credentials" | "disabled" | "general" | null
  >(null);

  useEffect(() => {
    if (hydrated && user) {
      router.push(user.role === "enduser" ? "/my-account" : "/overview");
    }
  }, [hydrated, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const signed = await signIn(identifier, password);
      router.push(signed.role === "enduser" ? "/my-account" : "/overview");
    } catch (err) {
      const message = (err as Error).message;
      setError(
        message === "INVALID_CREDENTIALS"
          ? "credentials"
          : message === "ACCOUNT_DISABLED"
            ? "disabled"
            : "general",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dark flex min-h-dvh w-full flex-col bg-background text-foreground md:flex-row">
      <WedgeClipDefs />

      <IllustrationPanel
        className="hidden md:flex md:w-[46%] lg:hidden"
        clipPathId="login-wedge-tablet"
        pathD={WEDGE_TABLET}
      />
      <IllustrationPanel
        className="hidden lg:flex lg:w-[58%]"
        clipPathId="login-wedge-desktop"
        pathD={WEDGE_DESKTOP}
      />
      <MobileHero />

      <div className="relative z-0 -mt-6 flex w-full flex-1 flex-col justify-center px-6 py-10 sm:px-10 md:mt-0 md:px-12 lg:px-16 xl:px-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
          className="mx-auto w-full max-w-[440px]"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex size-1.5">
              <span
                aria-hidden="true"
                className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60"
              />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Secure access
            </p>
          </div>

          <h1 className="mt-4 font-display text-4xl leading-[1.05] font-bold tracking-tight text-foreground lg:text-[2.75rem]">
            Welcome back.
          </h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
            Access your workspace and manage telephony operations, accounts and
            connected services.
          </p>

          <form onSubmit={onSubmit} className="mt-9 space-y-5" noValidate>
            <div className="space-y-2">
              <label
                htmlFor="identifier"
                className="text-sm font-medium text-foreground"
              >
                Email or SIP identifier
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                aria-invalid={error === "credentials"}
                placeholder="n.varga@flexisip.ops"
                className="h-[52px] w-full rounded-[14px] border border-border bg-white/[0.03] px-4 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground/60 focus-visible:border-primary/70 focus-visible:ring-4 focus-visible:ring-primary/10"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={reveal ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={error === "credentials"}
                  className="h-[52px] w-full rounded-[14px] border border-border bg-white/[0.03] pr-12 pl-4 text-sm text-foreground transition-colors outline-none focus-visible:border-primary/70 focus-visible:ring-4 focus-visible:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  aria-label={reveal ? "Hide password" : "Show password"}
                  className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                >
                  {reveal ? (
                    <EyeOff aria-hidden="true" className="size-4" />
                  ) : (
                    <Eye aria-hidden="true" className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {error ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-[14px] border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground/80"
              >
                <AlertCircle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <span>
                  {error === "credentials"
                    ? "Those credentials didn't match an account. Check the identifier and password, then try again."
                    : error === "disabled"
                      ? "This account has been disabled. Contact your administrator for access."
                      : "Authentication service is unreachable right now. Please retry in a moment."}
                </span>
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-4 rounded accent-primary"
                />
                Keep me signed in
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-primary text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-px hover:brightness-95 hover:shadow-[0_10px_24px_-14px_color-mix(in_oklab,var(--color-primary)_55%,transparent)] active:translate-y-0 active:brightness-90 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            Need access?{" "}
            <Link
              href="/request"
              className="text-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
            >
              Request access from your administrator.
            </Link>
          </p>

          <div className="mt-10 flex items-center gap-1.5 text-muted-foreground/50">
            <Lock aria-hidden="true" className="size-3" />
            <span className="text-xs">
              Protected access · Secure authentication
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/** Hidden SVG housing the objectBoundingBox clip-path definitions used to
 * cut the illustration panels' diagonal wedge boundary. Defined once,
 * referenced by both breakpoint variants via clip-path: url(#id). */
function WedgeClipDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <clipPath id="login-wedge-desktop" clipPathUnits="objectBoundingBox">
          <path d={WEDGE_DESKTOP} />
        </clipPath>
        <clipPath id="login-wedge-tablet" clipPathUnits="objectBoundingBox">
          <path d={WEDGE_TABLET} />
        </clipPath>
        <clipPath id="login-wedge-mobile" clipPathUnits="objectBoundingBox">
          <path d={WEDGE_MOBILE} />
        </clipPath>
      </defs>
    </svg>
  );
}

/**
 * Sculpted-edge effect for a wedge boundary: a soft, blurred dark stroke
 * (contact shadow / ambient occlusion, sitting toward the recessed
 * illustration side) paired with a crisp, faint warm-white stroke (the
 * highlight catching light on the raised auth surface's edge). Both trace
 * the exact same path as the clip, so the "bevel" lines up perfectly with
 * the cut regardless of container size.
 */
function WedgeSeam({ pathD }: { pathD: string }) {
  return (
    <>
      {/* Ambient-occlusion groove: blur must live on a plain HTML wrapper —
       * CSS blur() applied directly inside an SVG scales with the SVG's own
       * viewBox transform, so a "9px" blur inside a viewBox="0 0 1 1" element
       * stretched ~900x would actually blur by ~900 real pixels (invisible).
       * Blurring the rasterized div output instead keeps it real screen px. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ filter: "blur(9px)" }}
      >
        <svg
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          className="block h-full w-full"
        >
          <path
            d={pathD}
            fill="none"
            stroke="rgba(0,0,0,0.6)"
            strokeWidth={0.018}
          />
        </svg>
      </div>
      <svg
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="wedge-seam-highlight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(245,255,230,0.9)" />
            <stop offset="45%" stopColor="rgba(245,255,230,0.35)" />
            <stop offset="100%" stopColor="rgba(245,255,230,0)" />
          </linearGradient>
        </defs>
        <path
          d={pathD}
          fill="none"
          stroke="url(#wedge-seam-highlight)"
          strokeWidth={0.0016}
        />
      </svg>
    </>
  );
}

function IllustrationContent() {
  return (
    <div className="relative flex h-full w-full flex-col p-10 lg:p-14">
      <BrandMark />

      <div className="mt-auto max-w-[26rem]">
        <p className="font-mono text-[11px] tracking-[0.14em] text-foreground/50 uppercase">
          <span className="text-sip/90">SIP</span>
          <span className="mx-2 text-foreground/25">·</span>
          Reseller networks
        </p>
        <h2 className="mt-4 font-display text-[2rem] leading-[1.08] font-bold text-foreground lg:text-[2.5rem]">
          Control your
          <br />
          communication infrastructure.
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-foreground/60">
          Manage SIP accounts, reseller networks and operations from one
          secure control plane.
        </p>
      </div>
    </div>
  );
}

function IllustrationPanel({
  className,
  clipPathId,
  pathD,
}: {
  className: string;
  clipPathId: string;
  pathD: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute inset-0"
        style={{ clipPath: `url(#${clipPathId})` }}
      >
        <Image
          src="/brand/login-illustration.png"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="(min-width: 1024px) 58vw, (min-width: 768px) 46vw, 0px"
          className="object-cover object-[8%_68%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(9,9,9,0.62) 0%, rgba(9,9,9,0.3) 30%, rgba(9,9,9,0.5) 68%, rgba(9,9,9,0.94) 100%), radial-gradient(38rem 26rem at 92% 4%, rgba(9,9,9,0.75), transparent 65%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{ backgroundImage: NOISE_TEXTURE }}
        />
        {SIGNAL_DOTS.map((dot, i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="absolute rounded-full bg-primary/70"
            style={{
              top: dot.top,
              left: dot.left,
              width: dot.size,
              height: dot.size,
            }}
            animate={{ opacity: [0.25, 0.6, 0.25] }}
            transition={{
              duration: dot.duration,
              delay: dot.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <WedgeSeam pathD={pathD} />
      <IllustrationContent />
    </div>
  );
}

function MobileHero() {
  return (
    <div className="relative z-10 h-[38vh] max-h-80 min-h-64 w-full overflow-hidden md:hidden">
      <div
        className="absolute inset-0"
        style={{ clipPath: `url(#login-wedge-mobile)` }}
      >
        <Image
          src="/brand/login-illustration.png"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[24%_55%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(9,9,9,0.4) 0%, rgba(9,9,9,0.28) 40%, rgba(9,9,9,0.9) 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{ backgroundImage: NOISE_TEXTURE }}
        />
      </div>
      <WedgeSeam pathD={WEDGE_MOBILE} />
      <div className="relative flex h-full items-start p-5">
        <BrandMark />
      </div>
    </div>
  );
}
