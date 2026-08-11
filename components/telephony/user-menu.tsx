"use client";

import { LogOut } from "lucide-react";
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

export function UserMenu() {
  const { user, signOut } = useTelephony();
  const router = useRouter();
  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu — ${user.name}`}
        className="module-bg grid size-10 shrink-0 place-items-center rounded-full font-display text-xs font-bold"
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" className="w-56">
        <DropdownMenuLabel className="flex flex-col items-start gap-0.5">
          <span className="text-sm font-medium text-foreground">
            {user.name}
          </span>
          <span className="label-meta">
            {user.role === "admin" ? "Administrator" : (user.org ?? "Reseller")}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            signOut();
            router.push("/");
          }}
          className="gap-2"
        >
          <LogOut aria-hidden="true" className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
