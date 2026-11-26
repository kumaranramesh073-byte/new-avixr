"use client";

import * as React from "react";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconActivity,
  IconCurrencyDollar,
  IconClock,
} from "@tabler/icons-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { pctChange } from "@/lib/mock-data";
import { fmtInt, fmtUsd, fmtTokens, relativeTime } from "@/lib/format";

// ── Status styles ──────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "rate-limited": "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  error: "border-red-200 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function DashboardClient({ data }: { data: any }) {
  const { stats, daily, providers, requests } = data;

  const reqPct = pctChange(stats.requestsToday, stats.requestsYesterday);
  const reqUp = reqPct >= 0;

  const [range, setRange] = React.useState("30d");

  const filtered = daily.filter((d: any) => {
    const date = new Date(d.date);
    const ref = new Date(); // Use today instead of hardcoded date
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const start = new Date(ref);
    start.setDate(start.getDate() - days);
    return date >= start;
  });

  const totalProviderCost = providers.reduce((s: number, p: any) => s + p.costUsd, 0);
  const COLORS = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      
      {/* KPI Cards */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Requests Today</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {fmtInt(stats.requestsToday)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className={reqUp ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "border-red-200 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"}>
                {reqUp ? <IconTrendingUp className="size-3" /> : <IconTrendingDown className="size-3" />}
                {reqUp ? "+" : ""}{reqPct}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex items-center gap-2 font-medium">
              {reqUp ? "Up from yesterday" : "Down from yesterday"}
              {reqUp ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
            </div>
            <div className="text-muted-foreground">vs {fmtInt(stats.requestsYesterday)} yesterday</div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {fmtInt(stats.totalUsers)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                <IconUsers className="size-3" />
                {fmtInt(stats.activeToday)} active
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <IconUsers className="size-4" /> Registered accounts
            </div>
            <div className="text-muted-foreground">{stats.activeToday} active in last 7 days</div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Cost This Month</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {fmtUsd(stats.costMonth)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <IconTrendingUp className="size-3" />
                {fmtUsd(stats.costToday)} today
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <IconCurrencyDollar className="size-4" /> LLM + search APIs
            </div>
            <div className="text-muted-foreground">Total: {fmtUsd(stats.totalCost)} all time</div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Avg Latency</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {(stats.avgLatencyMs / 1000).toFixed(1)}s
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className={stats.errorRate > 5 ? "border-red-200 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"}>
                <IconActivity className="size-3" />
                {stats.errorRate.toFixed(1)}% errors
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <IconClock className="size-4" /> Response time
            </div>
            <div className="text-muted-foreground">{fmtTokens(stats.totalTokens)} tokens total</div>
          </CardFooter>
        </Card>
      </div>

      {/* Platform Entity Counts from Supabase */}
      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 lg:grid-cols-6 lg:px-6">
        {[
          { label: "Organizations", val: stats.totalOrganizations ?? 0 },
          { label: "Sessions", val: stats.totalSessions ?? 0 },
          { label: "Simulations", val: stats.totalSimulations ?? 0 },
          { label: "News Articles", val: stats.totalNewsArticles ?? 0 },
          { label: "Notifications", val: stats.totalNotifications ?? 0 },
          { label: "Data Sources", val: stats.totalDataSources ?? 0 },
        ].map((m) => (
          <Card key={m.label} className="p-3">
            <div className="text-[11px] text-muted-foreground">{m.label}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{fmtInt(m.val)}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <div className="lg:col-span-2">
          {/* Requests Chart */}
          <Card className="@container/card">
            <CardHeader>
              <CardTitle>Daily LLM Requests</CardTitle>
              <CardDescription>Volume + estimated cost over time</CardDescription>
              <CardAction>
                <Select value={range} onValueChange={setRange}>
                  <SelectTrigger className="w-36 text-xs h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </CardAction>
            </CardHeader>
            <CardContent className="px-2 pt-2 sm:px-6">
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filtered} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradReq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.03} />
                      </linearGradient>
                      <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={28}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) =>
                        new Date(v as string).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      }
                    />
                    <YAxis yAxisId="req" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => fmtInt(v as number)} width={44} />
                    <YAxis yAxisId="cost" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} width={40} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
                      labelFormatter={(v) => new Date(v as string).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      formatter={(v: unknown, name: unknown) =>
                        name === "requests" ? [fmtInt(v as number), "Requests"] : [fmtUsd(v as number), "Cost"]
                      }
                    />
                    <Area yAxisId="req" type="monotone" dataKey="requests" fill="url(#gradReq)" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Area yAxisId="cost" type="monotone" dataKey="costUsd" fill="url(#gradCost)" stroke="#10b981" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center gap-4 px-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-primary" />Requests</span>
                <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-emerald-500" />Cost (USD)</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Provider Split */}
        <Card>
          <CardHeader>
            <CardTitle>Cost by Provider</CardTitle>
            <CardDescription>Monthly spend split</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {providers.map((p: any, i: number) => {
              const pct = totalProviderCost ? (p.costUsd / totalProviderCost) * 100 : 0;
              return (
                <div key={p.provider}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{p.provider}</span>
                    <span className="tabular-nums text-muted-foreground">{fmtUsd(p.costUsd)} · {fmtInt(p.requests)} req</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${COLORS[i % COLORS.length]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <p className="pt-1 text-xs text-muted-foreground">Total: {fmtUsd(totalProviderCost)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 lg:px-6">
        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent LLM Requests</CardTitle>
            <CardDescription>Latest 8 agent invocations across all users</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Provider / Model</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Latency</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{relativeTime(r.created_at)}</TableCell>
                      <TableCell className="max-w-[140px] truncate text-xs">{r.user_email}</TableCell>
                      <TableCell className="text-xs">{r.module}</TableCell>
                      <TableCell className="text-xs">
                        <span className="font-medium">{r.provider}</span>
                        <span className="block max-w-[120px] truncate text-muted-foreground">{r.model}</span>
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{fmtTokens(r.prompt_tokens + r.completion_tokens)}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{fmtUsd(r.cost_usd)}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{(r.latency_ms / 1000).toFixed(1)}s</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] uppercase ${STATUS_STYLE[r.status]}`}>{r.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {requests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">No recent requests found. Setup the backend to start receiving logs.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
