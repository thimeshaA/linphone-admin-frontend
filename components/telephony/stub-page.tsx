import type { ReactNode } from "react";
import { PageHeader, EmptyState } from "./primitives";

export function ComingSoon({
  module,
  eyebrow,
  title,
  description,
  icon,
  bullets,
}: {
  module?: "sip" | "esim";
  eyebrow: string;
  title: string;
  description: string;
  icon?: ReactNode;
  bullets?: string[];
}) {
  return (
    <div className="space-y-8">
      <PageHeader
        {...(module ? { module } : {})}
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      <div className="glass rounded-[20px]">
        <EmptyState
          icon={icon}
          title="Coming soon"
          description="This page is part of the platform's navigation, but the functionality behind it hasn't shipped yet."
        />
        {bullets?.length ? (
          <ul className="mx-auto max-w-md space-y-2.5 px-6 pb-10 text-sm text-muted-foreground">
            {bullets.map((b) => (
              <li key={b} className="flex gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1 shrink-0 rounded-full bg-module"
                />
                {b}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
