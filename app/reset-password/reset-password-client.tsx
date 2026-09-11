"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { BrandMark } from "@/components/telephony/brand-mark";

// Matches the backend's isValidPassword minimum (utils/validators.js on the
// backend) — this form posts to the same token-based reset endpoint that
// enforces it server-side.
const MIN_LENGTH = 10;

const inputClass =
  "h-[52px] w-full rounded-[14px] border border-border bg-white/[0.03] pr-12 pl-4 text-sm text-foreground transition-colors outline-none focus-visible:border-primary/70 focus-visible:ring-4 focus-visible:ring-primary/10";

export function ResetPasswordClient() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [revealPassword, setRevealPassword] = useState(false);
  const [revealConfirm, setRevealConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [serverError, setServerError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (password.length < MIN_LENGTH)
      next["password"] = `Use at least ${MIN_LENGTH} characters.`;
    if (confirm !== password) next["confirm"] = "Passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setState("loading");
    try {
      await authApi.resetPassword(token ?? "", password);
      setState("success");
    } catch (err) {
      setServerError(
        err instanceof ApiError
          ? err.message
          : "Could not reset your password. Please try again.",
      );
      setState("error");
    }
  }

  return (
    <div className="dark flex min-h-dvh w-full flex-col items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="w-full max-w-[420px]">
        <div className="mb-10 flex justify-center">
          <BrandMark />
        </div>

        {!token ? (
          <InvalidLink />
        ) : state === "success" ? (
          <div className="text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-full bg-primary/15 text-primary">
              <CheckCircle2 aria-hidden="true" className="size-5" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
              Password updated
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Your password has been reset. Sign in with your new password to
              continue.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-8 inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-primary text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-px hover:brightness-95 active:translate-y-0 active:brightness-90"
            >
              Continue to sign in
              <ArrowRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        ) : (
          <>
            <p className="text-center font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Secure access
            </p>
            <h1 className="mt-3 text-center font-display text-2xl font-bold tracking-tight text-foreground">
              Set a new password
            </h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
              Choose a new password for your Admin Control login.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
              <div className="space-y-2">
                <label
                  htmlFor="rp-password"
                  className="text-sm font-medium text-foreground"
                >
                  New password
                </label>
                <div className="relative">
                  <input
                    id="rp-password"
                    type={revealPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!errors["password"]}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setRevealPassword((v) => !v)}
                    aria-label={
                      revealPassword ? "Hide password" : "Show password"
                    }
                    className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                  >
                    {revealPassword ? (
                      <EyeOff aria-hidden="true" className="size-4" />
                    ) : (
                      <Eye aria-hidden="true" className="size-4" />
                    )}
                  </button>
                </div>
                {errors["password"] ? (
                  <p role="alert" className="text-xs text-negative-foreground">
                    {errors["password"]}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="rp-confirm"
                  className="text-sm font-medium text-foreground"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    id="rp-confirm"
                    type={revealConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    aria-invalid={!!errors["confirm"]}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setRevealConfirm((v) => !v)}
                    aria-label={
                      revealConfirm ? "Hide password" : "Show password"
                    }
                    className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                  >
                    {revealConfirm ? (
                      <EyeOff aria-hidden="true" className="size-4" />
                    ) : (
                      <Eye aria-hidden="true" className="size-4" />
                    )}
                  </button>
                </div>
                {errors["confirm"] ? (
                  <p role="alert" className="text-xs text-negative-foreground">
                    {errors["confirm"]}
                  </p>
                ) : null}
              </div>

              {state === "error" ? (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-[14px] border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground/80"
                >
                  <AlertCircle
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <span>
                    {serverError}{" "}
                    <Link
                      href="/forgot-password"
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Request a new link
                    </Link>
                    .
                  </span>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={state === "loading"}
                className="inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-primary text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-px hover:brightness-95 active:translate-y-0 active:brightness-90 disabled:opacity-70"
              >
                {state === "loading" ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <>
                    Reset password
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function InvalidLink() {
  return (
    <div className="text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-full bg-white/[0.06] text-muted-foreground">
        <AlertCircle aria-hidden="true" className="size-5" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
        This link is invalid
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        The reset link is missing or malformed. Request a new one to continue.
      </p>
      <Link
        href="/forgot-password"
        className="mt-8 inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-primary text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-px hover:brightness-95"
      >
        Request a new link
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </div>
  );
}
