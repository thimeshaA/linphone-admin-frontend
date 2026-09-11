"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader } from "./primitives";
import { useTelephony } from "@/contexts/telephony-context";
import { ApiError } from "@/lib/api/client";
import { notificationsApi } from "@/lib/api/notifications";
import { formatDate, formatRelativeTime } from "@/lib/telephony/status";
import { notificationTypeLabel } from "@/lib/telephony/notifications";
import type { AppNotification } from "@/lib/telephony/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

/** Full notification history — the bell dropdown only ever shows the most
 * recent 20; this page is where older/paginated history and an "unread
 * only" filter live. Fetches its own page directly via `notificationsApi`
 * (same precedent as the report-generator pages calling their API module
 * straight, bypassing context, for view-specific paginated data) rather
 * than reusing the context's capped `notifications` list. */
export function NotificationsView() {
  const { user, unreadCount, markNotificationRead, markAllNotificationsRead } =
    useTelephony();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user || user.role === "enduser") return;
    let cancelled = false;
    setLoading(true);
    setError("");
    notificationsApi
      .list({ page, limit: PAGE_SIZE, unread: filter === "unread" })
      .then((res) => {
        if (cancelled) return;
        setItems(res.notifications);
        setTotal(res.pagination.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load notifications.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, page, filter, refreshKey]);

  async function handleMarkRead(n: AppNotification) {
    if (n.readAt) return;
    await markNotificationRead(n.id);
    setItems((prev) =>
      prev.map((item) =>
        item.id === n.id
          ? { ...item, readAt: item.readAt ?? new Date().toISOString() }
          : item,
      ),
    );
    if (filter === "unread") setRefreshKey((k) => k + 1);
  }

  async function handleMarkAll() {
    try {
      await markAllNotificationsRead();
      toast.success("All notifications marked as read");
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("Could not mark all as read", {
        description: "The backend rejected the request. Try again.",
      });
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Platform tools"
        title="Notifications"
        description="Renewal deductions, invoices and payments across your account."
        actions={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={handleMarkAll}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-medium hover:bg-accent"
            >
              <CheckCheck aria-hidden="true" className="size-4" />
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div
        role="group"
        aria-label="Filter"
        className="inline-flex rounded-xl bg-secondary p-1"
      >
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            className={cn(
              "h-9 rounded-lg px-4 text-sm font-medium capitalize transition-colors",
              filter === f
                ? "module-bg"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-negative-muted px-4 py-3 text-sm text-negative-foreground"
        >
          {error}
        </p>
      ) : loading && items.length === 0 ? (
        <div className="glass rounded-[20px]">
          <EmptyState
            title="Loading notifications…"
            description="Fetching your notification history."
          />
        </div>
      ) : items.length === 0 ? (
        <div className="glass rounded-[20px]">
          <EmptyState
            icon={<Bell aria-hidden="true" className="size-5" />}
            title={
              filter === "unread"
                ? "You're all caught up"
                : "No notifications yet"
            }
            description={
              filter === "unread"
                ? "No unread notifications right now."
                : "Renewal deductions, invoices and payments will show up here."
            }
          />
        </div>
      ) : (
        <>
          <ul className="space-y-2.5">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "glass rounded-[16px] px-4 py-3.5 md:px-5 md:py-4",
                  !n.readAt && "ring-1 ring-module/40",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-1.5 size-1.5 shrink-0 rounded-full",
                        !n.readAt && "bg-module",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="label-meta">
                        {notificationTypeLabel(n.type)}
                      </p>
                      <p className="mt-1 text-sm font-medium leading-snug">
                        {n.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {n.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p
                      className="text-xs text-muted-foreground"
                      title={formatDate(n.createdAt)}
                    >
                      {formatRelativeTime(n.createdAt)}
                    </p>
                    {!n.readAt ? (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n)}
                        className="text-xs font-medium text-module-strong hover:underline"
                      >
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between gap-3">
            <p className="label-meta">
              Page {page} of {pageCount}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="glass h-10 rounded-xl px-4 text-sm font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => p + 1)}
                className="glass h-10 rounded-xl px-4 text-sm font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
