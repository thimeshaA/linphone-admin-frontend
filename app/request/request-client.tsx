"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
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
  return (
    <Suspense fallback={null}>
      <RequestForm />
    </Suspense>
  );
}

function RequestForm() {
  const { submitRequest } = useTelephony();
  const searchParams = useSearchParams();
  const [kind, setKind] = useState<RequestKind>(() =>
    searchParams.get("type") === "account" ? "account" : "reseller",
  );
  const [module, setModule] = useState<ModuleKey>(() => {
    const requested = searchParams.get("module");
    // "account" + "sip" is never a valid combination — see selectKind below.
    if (requested === "sip" && searchParams.get("type") === "account")
      return "esim";
    return requested === "esim" ? "esim" : "sip";
  });
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<Errors>({});
  const [showValidationBanner, setShowValidationBanner] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );

  // "Request an account" only ever applies to eSIM here — SIP accounts come
  // from a reseller, not self-service — so switching to it while SIP is
  // selected must not leave an invalid combination on screen.
  function selectKind(next: RequestKind) {
    setKind(next);
    if (next === "account" && module === "sip") setModule("esim");
  }

  const set =
    (k: FieldName) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [k]: e.target.value }) as FormValues);

  // Field order matches the form's visual top-to-bottom order, so the first
  // key present in `next` is always the first invalid field on screen.
  const FIELD_ORDER: FieldName[] = [
    "name",
    "email",
    "phone",
    "company",
    "country",
    "website",
    "reason",
    "note",
  ];

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

    // A validation failure has to be impossible to miss — silently blocking
    // submit with only a small red line under one field reads as "the button
    // is broken" if that field is scrolled out of view.
    const firstInvalid = FIELD_ORDER.find((f) => next[f]);
    if (firstInvalid) {
      requestAnimationFrame(() => {
        const el = document.getElementById(firstInvalid);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
      });
    }

    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      setShowValidationBanner(true);
      return;
    }
    setShowValidationBanner(false);
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
              Request submitted
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Your{" "}
              {kind === "reseller" ? "reseller application" : "account request"}{" "}
              for the {module.toUpperCase()} module has been sent to our
              operations team, who will follow up by email at{" "}
              <span className="font-mono text-foreground">{values.email}</span>.
              We&apos;ve also sent a copy to that address for your records.
            </p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
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
                className="inline-flex h-11 items-center justify-center rounded-xl bg-module px-5 text-sm font-semibold text-ink"
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
              No sign-in required. Tell us what you need and our operations team
              will follow up by email.
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
                      onChange={() => selectKind(value)}
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
                  ).map(([value, title, desc]) => {
                    const disabled = kind === "account" && value === "sip";
                    return (
                      <Choice
                        key={value}
                        name="module"
                        checked={module === value}
                        onChange={() => setModule(value)}
                        title={title}
                        desc={desc}
                        disabled={disabled}
                        disabledNote={
                          disabled
                            ? "SIP accounts are provisioned by resellers, not self-requested."
                            : undefined
                        }
                      />
                    );
                  })}
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

              {showValidationBanner && Object.keys(errors).length > 0 ? (
                <div
                  role="alert"
                  className="rounded-xl bg-negative-muted px-4 py-4 text-sm text-negative-foreground"
                >
                  Some required fields need attention — check the highlighted
                  fields above.
                </div>
              ) : null}

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
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-module px-6 text-sm font-semibold text-ink transition-transform active:scale-[0.99] disabled:opacity-70"
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
                  Submitting emails your request to our operations team.
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
  disabled,
  disabledNote,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  desc: string;
  disabled?: boolean;
  disabledNote?: string | undefined;
}) {
  return (
    <label
      className={cn(
        "glass rounded-2xl p-4 ring-1 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer ring-transparent hover:bg-accent/40",
        !disabled && checked && "ring-2 ring-primary",
      )}
    >
      <span className="flex items-start gap-3">
        <input
          type="radio"
          name={name}
          checked={checked && !disabled}
          disabled={disabled}
          onChange={onChange}
          className="mt-0.5 size-4 shrink-0 accent-primary disabled:cursor-not-allowed"
        />
        <span>
          <span className="block text-sm font-semibold">{title}</span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
            {disabled && disabledNote ? disabledNote : desc}
          </span>
        </span>
      </span>
    </label>
  );
}
