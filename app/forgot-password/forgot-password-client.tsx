"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { BrandMark } from "@/components/telephony/brand-mark";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setState("loading");
    try {
      await authApi.forgotPassword(email.trim());
      setState("sent");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="dark flex min-h-dvh w-full flex-col items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="w-full max-w-[420px]">
        <div className="mb-10 flex justify-center">
          <BrandMark />
        </div>

        {state === "sent" ? (
          <div className="text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-full bg-primary/15 text-primary">
              <CheckCircle2 aria-hidden="true" className="size-5" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
              Check your email
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              If an account exists for <strong>{email.trim()}</strong>,
              we&apos;ve sent a link to reset your password. It expires in an
              hour.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="text-center font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Secure access
            </p>
            <h1 className="mt-3 text-center font-display text-2xl font-bold tracking-tight text-foreground">
              Reset your password
            </h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
              Enter the email on your account and we&apos;ll send you a link to
              set a new password.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
              <div className="space-y-2">
                <label
                  htmlFor="fp-email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <input
                  id="fp-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error}
                  placeholder="d.moreau@lineabridge.fr"
                  className="h-[52px] w-full rounded-[14px] border border-border bg-white/[0.03] px-4 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground/60 focus-visible:border-primary/70 focus-visible:ring-4 focus-visible:ring-primary/10"
                />
                {error ? (
                  <p role="alert" className="text-xs text-negative-foreground">
                    {error}
                  </p>
                ) : null}
              </div>

              {state === "error" ? (
                <div
                  role="alert"
                  className="rounded-[14px] border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground/80"
                >
                  Something went wrong sending the reset link. Please try again.
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
                    Send reset link
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </>
                )}
              </button>
            </form>

            <Link
              href="/"
              className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
