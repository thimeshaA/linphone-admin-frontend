"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useTelephony } from "@/contexts/telephony-context";
import { Brand } from "@/components/telephony/app-shell";
import { ThemeToggle } from "@/components/telephony/theme-toggle";
import type { ModuleKey, RequestKind } from "@/lib/telephony/types";
import { cn } from "@/lib/utils";

type FieldName =
  | "name"
  | "email"
  | "phone"
  | "company"
  | "country"
  | "website"
  | "reason"
  | "note";
type FormValues = Partial<Record<FieldName, string>>;
type Errors = Partial<Record<FieldName, string>>;

function Field({
  id,
  label,
  hint,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="flex items-baseline gap-2 text-sm font-medium"
      >
        {label}
        <span className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">
          {required ? "Required" : "Optional"}
        </span>
      </label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs text-negative-foreground"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inputClass =
  "h-11 w-full glass rounded-xl px-4 text-sm outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring";

export function RequestClient() {
  const { submitRequest } = useTelephony();
  const [kind, setKind] = useState<RequestKind>("reseller");
  const [module, setModule] = useState<ModuleKey>("sip");
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );

  const set =
    (k: FieldName) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [k]: e.target.value }) as FormValues);

  function validate() {
    const next: Errors = {};
    if (!values.name?.trim())
      next.name = "Enter the full name of the contact person.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email ?? ""))
      next.email = "Enter a valid email address we can reply to.";
    if (!values.phone?.trim())
      next.phone = "A reachable phone number is required.";
    if (kind === "reseller") {
      if (!values.company?.trim())
        next.company = "Enter your registered business name.";
      if (!values.country?.trim())
        next.country = "Enter the country of operation.";
      if ((values.reason ?? "").trim().length < 30)
        next.reason = "Describe your business in at least 30 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    try {
      await submitRequest({
        kind,
        module,
        name: values.name!.trim(),
        email: values.email!.trim(),
        phone: values.phone!.trim(),
        company: kind === "reseller" ? values.company?.trim() : undefined,
        country: kind === "reseller" ? values.country?.trim() : undefined,
        website: kind === "reseller" ? values.website?.trim() : undefined,
        reason: kind === "reseller" ? values.reason?.trim() : undefined,
        note: values.note?.trim() || undefined,
      });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-dvh px-5 py-6 md:px-10 md:py-10">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <Brand />
        <ThemeToggle />
      </div>

      <main id="main" className="mx-auto mt-10 w-full max-w-3xl pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to sign in
        </Link>

        {status === "done" ? (
          <section className="mt-8 glass rounded-[20px] p-8">
            <div className="grid size-11 place-items-center rounded-full bg-positive-muted text-positive-foreground">
              <CheckCircle2 aria-hidden="true" className="size-5" />
            </div>
            <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">
              Request submitted for review
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Your{" "}
              {kind === "reseller" ? "reseller application" : "account request"}{" "}
              for the {module.toUpperCase()} module is now in the operations
              approval queue. A reviewer typically responds within two business
              days at{" "}
              <span className="font-mono text-foreground">{values.email}</span>.
            </p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                [
                  "Reference",
                  `REQ-${(Math.abs(hash(values.email ?? "")) % 9000) + 1000}`,
                ],
                [
                  "Type",
                  kind === "reseller"
                    ? "Reseller application"
                    : "Account request",
                ],
                ["Module", module.toUpperCase()],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="label-meta">{k}</dt>
                  <dd className="mt-1.5 font-mono text-sm">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-module px-5 text-sm font-semibold text-background"
              >
                Return to sign in
              </Link>
              <button
                type="button"
                onClick={() => {
                  setStatus("idle");
                  setValues({});
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-5 text-sm font-medium"
              >
                Submit another request
              </button>
            </div>
          </section>
        ) : (
          <>
            <p className="label-meta mt-8">Public intake</p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Request access to the network
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              No sign-in required. Tell us what you need and the operations team
              will review it in the same queue used for every provisioning
              decision.
            </p>

            <form onSubmit={onSubmit} className="mt-10 space-y-10" noValidate>
              <fieldset>
                <legend className="label-meta">01 — Request type</legend>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      [
                        "reseller",
                        "Become a reseller",
                        "Provision and manage accounts for your own customers.",
                      ],
                      [
                        "account",
                        "Request an account",
                        "A single line or data profile for yourself or your organisation.",
                      ],
                    ] as const
                  ).map(([value, title, desc]) => (
                    <Choice
                      key={value}
                      name="kind"
                      checked={kind === value}
                      onChange={() => setKind(value)}
                      title={title}
                      desc={desc}
                    />
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="label-meta">02 — Module</legend>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      [
                        "sip",
                        "SIP",
                        "Voice accounts on the Flexisip infrastructure.",
                      ],
                      [
                        "esim",
                        "eSIM",
                        "Data and voice profiles — currently limited availability.",
                      ],
                    ] as const
                  ).map(([value, title, desc]) => (
                    <Choice
                      key={value}
                      name="module"
                      checked={module === value}
                      onChange={() => setModule(value)}
                      title={title}
                      desc={desc}
                    />
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-5">
                <legend className="label-meta">
                  03 —{" "}
                  {kind === "reseller" ? "Business details" : "Contact details"}
                </legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id="name"
                    label="Full name"
                    required
                    error={errors.name}
                  >
                    <input
                      id="name"
                      className={inputClass}
                      value={values.name ?? ""}
                      onChange={set("name")}
                      autoComplete="name"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "name-error" : undefined}
                    />
                  </Field>
                  <Field id="email" label="Email" required error={errors.email}>
                    <input
                      id="email"
                      type="email"
                      inputMode="email"
                      className={inputClass}
                      value={values.email ?? ""}
                      onChange={set("email")}
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                      aria-describedby={
                        errors.email ? "email-error" : undefined
                      }
                    />
                  </Field>
                  <Field
                    id="phone"
                    label="Phone number"
                    required
                    error={errors.phone}
                  >
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      className={inputClass}
                      value={values.phone ?? ""}
                      onChange={set("phone")}
                      autoComplete="tel"
                      aria-invalid={!!errors.phone}
                      aria-describedby={
                        errors.phone ? "phone-error" : undefined
                      }
                    />
                  </Field>
                  {kind === "reseller" ? (
                    <>
                      <Field
                        id="company"
                        label="Business name"
                        required
                        error={errors.company}
                      >
                        <input
                          id="company"
                          className={inputClass}
                          value={values.company ?? ""}
                          onChange={set("company")}
                          autoComplete="organization"
                          aria-invalid={!!errors.company}
                          aria-describedby={
                            errors.company ? "company-error" : undefined
                          }
                        />
                      </Field>
                      <Field
                        id="country"
                        label="Country of operation"
                        required
                        error={errors.country}
                      >
                        <input
                          id="country"
                          className={inputClass}
                          value={values.country ?? ""}
                          onChange={set("country")}
                          autoComplete="country-name"
                          aria-invalid={!!errors.country}
                          aria-describedby={
                            errors.country ? "country-error" : undefined
                          }
                        />
                      </Field>
                      <Field id="website" label="Website">
                        <input
                          id="website"
                          type="url"
                          inputMode="url"
                          placeholder="https://"
                          className={inputClass}
                          value={values.website ?? ""}
                          onChange={set("website")}
                        />
                      </Field>
                    </>
                  ) : null}
                </div>

                {kind === "reseller" ? (
                  <Field
                    id="reason"
                    label="Business description"
                    hint="Who your customers are, expected volume, and why you need direct provisioning."
                    required
                    error={errors.reason}
                  >
                    <textarea
                      id="reason"
                      rows={4}
                      className="w-full glass rounded-xl p-4 text-sm leading-relaxed outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
                      value={values.reason ?? ""}
                      onChange={set("reason")}
                      aria-invalid={!!errors.reason}
                      aria-describedby={
                        errors.reason ? "reason-error" : undefined
                      }
                    />
                  </Field>
                ) : null}

                <Field id="note" label="Additional note">
                  <textarea
                    id="note"
                    rows={3}
                    className="w-full glass rounded-xl p-4 text-sm leading-relaxed outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
                    value={values.note ?? ""}
                    onChange={set("note")}
                  />
                </Field>
              </fieldset>

              {status === "error" ? (
                <div
                  role="alert"
                  className="flex flex-col gap-3 rounded-xl bg-negative-muted px-4 py-4 text-sm text-negative-foreground sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    We couldn&apos;t deliver your request. Nothing was lost —
                    retry and your answers stay filled in.
                  </span>
                  <button
                    type="submit"
                    className="shrink-0 glass rounded-lg px-4 py-2 font-medium text-foreground"
                  >
                    Retry submission
                  </button>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-module px-6 text-sm font-semibold text-background transition-transform active:scale-[0.99] disabled:opacity-70"
                >
                  {status === "loading" ? (
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : null}
                  {status === "loading"
                    ? "Submitting…"
                    : "Submit request for review"}
                </button>
                <p className="text-xs text-muted-foreground">
                  Submitting adds your request to the operations approval queue.
                </p>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

function Choice({
  name,
  checked,
  onChange,
  title,
  desc,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  desc: string;
}) {
  return (
    <label
      className={cn(
        "cursor-pointer glass rounded-2xl p-4 ring-1 transition-colors",
        checked ? "ring-2 ring-primary" : "ring-transparent hover:bg-accent/40",
      )}
    >
      <span className="flex items-start gap-3">
        <input
          type="radio"
          name={name}
          checked={checked}
          onChange={onChange}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <span>
          <span className="block text-sm font-semibold">{title}</span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
            {desc}
          </span>
        </span>
      </span>
    </label>
  );
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
