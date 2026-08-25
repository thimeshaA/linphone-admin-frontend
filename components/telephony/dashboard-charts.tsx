"use client";

import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EmptyState } from "./primitives";
import type {
  AccountStatusBreakdown,
  DayCount,
  ResellerAccountStats,
} from "@/lib/telephony/derived";
/** Parses a "YYYY-MM-DD" bucket key as a local date. `new Date(str)` parses
 * a date-only string as UTC midnight, which then mislabels by a day once
 * formatted back to local time in any negative-UTC-offset timezone. */
function parseDateKey(key: string): Date {
  const parts = key.split("-").map(Number);
  return new Date(parts[0] ?? 0, (parts[1] ?? 1) - 1, parts[2] ?? 1);
}

/** Same three tones as `<StatusPill>` — active/expiring/disabled — reused as
 * chart fills instead of pill backgrounds. `expiring` reads as the active
 * module accent (orange on SIP), same as the pill's `module-tint` treatment. */
const STATUS_CHART_CONFIG: ChartConfig = {
  active: { label: "Active", color: "var(--color-positive-foreground)" },
  expiring: { label: "Expiring soon", color: "var(--color-module-strong)" },
  disabled: { label: "Disabled", color: "var(--color-negative-foreground)" },
};

export function StatusDonutChart({
  breakdown,
}: {
  breakdown: AccountStatusBreakdown;
}) {
  const total = breakdown.active + breakdown.expiring + breakdown.disabled;
  const data = [
    { key: "active", label: "Active", value: breakdown.active },
    { key: "expiring", label: "Expiring soon", value: breakdown.expiring },
    { key: "disabled", label: "Disabled", value: breakdown.disabled },
  ];

  if (total === 0) {
    return (
      <EmptyState
        title="No accounts yet"
        description="Status breakdown appears once accounts exist."
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <ChartContainer
        config={STATUS_CHART_CONFIG}
        className="aspect-square max-h-[220px] w-full"
      >
        <PieChart>
          <ChartTooltip
            content={<ChartTooltipContent hideLabel nameKey="label" />}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="62%"
            outerRadius="100%"
            paddingAngle={3}
            cornerRadius={4}
            strokeWidth={0}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={`var(--color-${d.key})`} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-1.5 text-xs">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: `var(--color-${d.key})` }}
            />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="font-mono tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const TREND_CONFIG: ChartConfig = {
  count: { label: "Accounts created", color: "var(--color-module)" },
};

export function AccountsTrendChart({ series }: { series: DayCount[] }) {
  if (series.every((d) => d.count === 0)) {
    return (
      <EmptyState
        title="No accounts created recently"
        description="New accounts in the last 30 days will plot here."
      />
    );
  }

  return (
    <ChartContainer
      config={TREND_CONFIG}
      className="aspect-auto h-[220px] w-full"
    >
      <AreaChart data={series} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="0" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(value: string) =>
            parseDateKey(value).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            })
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) =>
                parseDateKey(String(value)).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              }
            />
          }
        />
        <defs>
          <linearGradient id="accountsCreatedFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-count)"
              stopOpacity={0.35}
            />
            <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          dataKey="count"
          type="monotone"
          stroke="var(--color-count)"
          strokeWidth={2}
          fill="url(#accountsCreatedFill)"
        />
      </AreaChart>
    </ChartContainer>
  );
}

/** Tiny inline stacked bar for a table row — active/disabled split without a
 * per-row chart. Same two status tones as the donut, decorative only (the
 * numbers beside it, plus the row's own `<StatusPill>`, carry the meaning). */
export function ActiveDisabledSplit({
  active,
  disabled,
}: {
  active: number;
  disabled: number;
}) {
  const total = active + disabled;
  return (
    <div className="flex items-center gap-2">
      <div
        aria-hidden="true"
        className="flex h-1.5 w-14 gap-[2px] overflow-hidden rounded-full bg-muted"
      >
        {total > 0 ? (
          <>
            <div
              className="h-full"
              style={{
                width: `${(active / total) * 100}%`,
                backgroundColor: "var(--color-positive-foreground)",
              }}
            />
            <div
              className="h-full"
              style={{
                width: `${(disabled / total) * 100}%`,
                backgroundColor: "var(--color-negative-foreground)",
              }}
            />
          </>
        ) : null}
      </div>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {active} / {disabled}
      </span>
    </div>
  );
}

const RESELLER_CHART_CONFIG: ChartConfig = {
  total: { label: "Accounts created", color: "var(--color-module)" },
};

export function TopResellersChart({
  stats,
  limit = 8,
}: {
  stats: ResellerAccountStats[];
  limit?: number;
}) {
  const router = useRouter();
  const top = [...stats]
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((s) => ({ ...s, label: s.reseller.username }));

  if (top.length === 0 || top.every((s) => s.total === 0)) {
    return (
      <EmptyState
        title="No resellers yet"
        description="Top resellers by account count appear once resellers create accounts."
      />
    );
  }

  const height = Math.max(180, top.length * 36);

  return (
    <ChartContainer
      config={RESELLER_CHART_CONFIG}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <BarChart
        data={top}
        layout="vertical"
        margin={{ left: 0, right: 28, top: 4, bottom: 4 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={104}
          tickFormatter={(value: string) =>
            value.length > 14 ? `${value.slice(0, 13)}…` : value
          }
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="label" />}
        />
        <Bar
          dataKey="total"
          radius={[0, 4, 4, 0]}
          maxBarSize={20}
          fill="var(--color-total)"
          className="cursor-pointer"
          onClick={(data: { reseller?: { id: string } }) => {
            const id = data?.reseller?.id;
            if (id) router.push(`/sip/accounts?reseller=${id}`);
          }}
        >
          <LabelList
            dataKey="total"
            position="right"
            className="fill-foreground font-mono text-xs"
          />
          {top.map((s) => (
            <Cell key={s.reseller.id} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
