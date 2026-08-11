"use client";

import { FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTelephony } from "@/contexts/telephony-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function RoleSwitcher({ compact }: { compact?: boolean }) {
  const { users, user, impersonate } = useTelephony();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Demo role switcher"
        className={
          compact
            ? "grid size-10 shrink-0 place-items-center rounded-full border border-dashed border-input text-muted-foreground transition-colors hover:text-foreground"
            : "inline-flex h-9 w-full items-center gap-2 rounded-full border border-dashed border-input px-3 text-left font-mono text-[11px] tracking-wider uppercase text-muted-foreground transition-colors hover:text-foreground"
        }
      >
        <FlaskConical aria-hidden="true" className="size-3.5 shrink-0" />
        {compact ? null : <span className="truncate">Demo role</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="font-mono text-[11px] tracking-wider uppercase">
          Prototype only — not production auth
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {users.map((u) => (
          <DropdownMenuItem
            key={u.id}
            onSelect={() => {
              const next = impersonate(u.id);
              if (!next) return;
              router.push(
                next.role === "enduser" ? "/my-account" : "/overview",
              );
            }}
            className="flex-col items-start gap-0.5 py-2"
          >
            <span className="text-sm font-medium">
              {u.name}
              {user?.id === u.id ? " — current" : ""}
            </span>
            <span className="text-xs text-muted-foreground">{u.blurb}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
