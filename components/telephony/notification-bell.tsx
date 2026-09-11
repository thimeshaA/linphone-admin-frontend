"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTelephony } from "@/contexts/telephony-context";
import { formatRelativeTime } from "@/lib/telephony/status";
import { notificationTypeLabel } from "@/lib/telephony/notifications";
import { cn } from "@/lib/utils";
import { EmptyState } from "./primitives";

/**
 * Header bell — unread badge + a dropdown of the most recent notifications.
 * Each row is its own `DropdownMenuItem` with `onSelect` marking it read and
 * (via `preventDefault`) NOT closing the menu, so several can be triaged in
 * one open. Deliberately not a nested button-inside-item (Radix's item
 * click/keyboard handling fights with nested interactive children) — the
 * whole row is the control, matching how `RowMenu` items work elsewhere.
 */
export function NotificationBell({
  side = "bottom",
  align = "end",
  className,
}: {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "end" | "center";
  className?: string;
}) {
  const {
    notifications,
    notificationsLoading,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useTelephony();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={
          unreadCount > 0
            ? `Notifications — ${unreadCount} unread`
            : "Notifications"
        }
        className={cn(
          "relative grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent",
          className,
        )}
      >
        <Bell aria-hidden="true" className="size-5" />
        {unreadCount > 0 ? (
          <span
            aria-hidden="true"
            className="module-bg absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 font-mono text-[10px] font-bold leading-none"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={side}
        align={align}
        className="w-80 max-w-[calc(100vw-2rem)] p-0"
      >
        <div className="flex items-center justify-between gap-2 px-1">
          <DropdownMenuLabel className="text-sm font-semibold text-foreground">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                void markAllNotificationsRead();
              }}
              className="mr-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <CheckCheck aria-hidden="true" className="size-3.5" />
              Mark all read
            </button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="my-1" />

        <div className="max-h-96 overflow-y-auto">
          {notificationsLoading && notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={<Bell aria-hidden="true" className="size-5" />}
              title="No notifications yet"
              description="Renewal deductions, invoices and payments will show up here."
            />
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onSelect={(e) => {
                  e.preventDefault();
                  if (!n.readAt) void markNotificationRead(n.id);
                }}
                className={cn(
                  "flex items-start gap-2 whitespace-normal rounded-xl px-3 py-2.5",
                  !n.readAt && "bg-accent/40",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    !n.readAt && "bg-module",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="label-meta">{notificationTypeLabel(n.type)}</p>
                  <p className="mt-0.5 text-sm font-medium leading-snug">
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {n.message}
                  </p>
                  <p className="label-meta mt-1.5">
                    {formatRelativeTime(n.createdAt)}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>

        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem asChild className="justify-center">
          <Link
            href="/notifications"
            className="w-full text-center text-xs font-medium text-module-strong"
          >
            See all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
