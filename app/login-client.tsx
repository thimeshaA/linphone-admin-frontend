"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useTelephony } from "@/contexts/telephony-context";
import { Brand } from "@/components/telephony/app-shell";
import { ThemeToggle } from "@/components/telephony/theme-toggle";

export function LoginClient() {
  const { signIn, user, hydrated, users } = useTelephony();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<"credentials" | "general" | null>(null);

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
      setError(
        (err as Error).message === "INVALID_CREDENTIALS"
          ? "credentials"
          : "general",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh px-5 py-6 md:grid md:grid-cols-[1.05fr_1fr] md:gap-10 md:px-10 md:py-10">
      <div className="flex items-center justify-between md:col-span-2">
        <Brand />
        <ThemeToggle />
      </div>

      <main
        id="main"
        className="mx-auto flex w-full max-w-md flex-col justify-center py-10 md:py-20"
      >
        <p className="label-meta">Secure access</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Sign in to the control plane
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          One credential set, three levels of access. Administrators, resellers
          and account holders all sign in here — your access level is resolved
          after authentication.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
          <div className="space-y-2">
            <label htmlFor="identifier" className="text-sm font-medium">
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
              className="h-12 w-full glass rounded-xl px-4 text-sm outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="n.varga@flexisip.ops"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
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
                className="h-12 w-full glass rounded-xl pl-4 pr-12 text-sm outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                aria-label={reveal ? "Hide password" : "Show password"}
                className="absolute right-1.5 top-1.5 grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
              >
                {reveal ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 accent-primary"
            />
            Keep me signed in on this device
          </label>

          {error ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl bg-negative-muted px-4 py-3 text-sm text-negative-foreground"
            >
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <span>
                {error === "credentials"
                  ? "Those credentials didn't match an account. Check the identifier and password, then try again."
                  : "Authentication service is unreachable right now. Please retry in a moment."}
              </span>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-module text-sm font-semibold text-background transition-transform active:scale-[0.99] disabled:opacity-70"
          >
            {loading ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            {loading ? "Verifying…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Need an account or reseller access?{" "}
          <Link
            href="/request"
            className="font-medium text-module underline-offset-4 hover:underline"
          >
            Submit a request
          </Link>
          . Account holders sign in with the SIP credentials issued to them —
          there is no self signup.
        </p>
      </main>

      <aside className="mx-auto w-full max-w-md self-center glass rounded-[20px] p-6 md:max-w-none md:p-8">
        <p className="label-meta">Prototype credentials — password “command”</p>
        <ul className="mt-5 divide-y divide-border">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0"
            >
              <button
                type="button"
                onClick={() => {
                  setIdentifier(u.identifier);
                  setPassword("command");
                  setError(null);
                }}
                className="text-left"
              >
                <span className="block font-mono text-xs text-module">
                  {u.identifier}
                </span>
                <span className="mt-1 block text-sm">{u.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          This panel exists for evaluation only and would not ship with the
          production authentication flow.
        </p>
      </aside>
    </div>
  );
}
