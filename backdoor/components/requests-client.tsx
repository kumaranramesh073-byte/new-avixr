"use client";

import * as React from "react";
import {
  IconSearch,
  IconActivity,
  IconClockHour4,
  IconCoins,
  IconAlertTriangle,
  IconBolt,
} from "@tabler/icons-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { fmtInt, fmtUsd, fmtTokens, relativeTime, fmtDateTime } from "@/lib/format";

export type RequestLog = {
  id: string;
  created_at: string;
  user_id: string;
  user_email: string;
  company: string;
  plan: string;
  module: string;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  cost_usd: number;
  latency_ms: number;
  status: string;
};

// ── Status styles ─────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "rate-limited": "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  error: "border-red-200 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

// ── KPI strip ─────────────────────────────────────────────────────────────────
function RequestStats({ requests }: { requests: RequestLog[] }) {
  const total = requests.length;
  const errors = requests.filter((r) => r.status === "error").length;
  const rateLimited = requests.filter((r) => r.status === "rate-limited").length;
  const totalTokens = requests.reduce((s, r) => s + r.prompt_tokens + r.completion_tokens, 0);
  const totalCost = requests.reduce((s, r) => s + Number(r.cost_usd), 0);
  const avgLatency = total > 0 ? Math.round(requests.reduce((s, r) => s + r.latency_ms, 0) / total) : 0;

  const cards = [
    { label: "Total Requests", value: fmtInt(total), icon: IconActivity, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total Tokens", value: fmtTokens(totalTokens), icon: IconCoins, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Total Cost", value: fmtUsd(totalCost), icon: IconBolt, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Avg Latency", value: `${(avgLatency / 1000).toFixed(1)}s`, icon: IconClockHour4, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Errors", value: `${errors} (${total > 0 ? ((errors / total) * 100).toFixed(1) : "0.0"}%)`, icon: IconAlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Rate Limited", value: fmtInt(rateLimited), icon: IconClockHour4, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-6 lg:px-6">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="@container/card">
            <CardHeader>
              <CardDescription>{c.label}</CardDescription>
              <CardTitle className="text-lg font-semibold tabular-nums">{c.value}</CardTitle>
              <CardAction>
                <div className={`flex size-7 items-center justify-center rounded-lg ${c.bg}`}>
                  <Icon className={`size-3.5 ${c.color}`} />
                </div>
              </CardAction>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}

// ── Latency histogram ─────────────────────────────────────────────────────────
function LatencyChart({ requests }: { requests: RequestLog[] }) {
  const buckets = [
    { label: "<1s", min: 0, max: 1000 },
    { label: "1-2s", min: 1000, max: 2000 },
    { label: "2-4s", min: 2000, max: 4000 },
    { label: "4-8s", min: 4000, max: 8000 },
    { label: "8s+", min: 8000, max: Infinity },
  ];
  const data = buckets.map((b) => ({
    label: b.label,
    count: requests.filter((r) => r.latency_ms >= b.min && r.latency_ms < b.max).length,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latency Distribution</CardTitle>
        <CardDescription>Response time buckets across all requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
                formatter={(v: unknown) => [(v as number), "Requests"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={i < 2 ? "#10b981" : i < 4 ? "#f59e0b" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Module usage bars ─────────────────────────────────────────────────────────
function ModuleUsage({ requests }: { requests: RequestLog[] }) {
  const byModule: Record<string, number> = {};
  requests.forEach((r) => { byModule[r.module] = (byModule[r.module] ?? 0) + 1; });
  const sorted = Object.entries(byModule).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 1;
  const COLORS = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-sky-500", "bg-pink-500", "bg-teal-500"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Requests by Module</CardTitle>
        <CardDescription>Which modules are called most</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {sorted.map(([module, count], i) => (
          <div key={module}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium">{module}</span>
              <span className="tabular-nums text-muted-foreground">{count}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${COLORS[i % COLORS.length]}`} style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Full log table ────────────────────────────────────────────────────────────
type SortKey = keyof Pick<RequestLog, "created_at" | "prompt_tokens" | "completion_tokens" | "cost_usd" | "latency_ms">;

export function RequestsClient({ requests }: { requests: RequestLog[] }) {
  const [search, setSearch] = React.useState("");
  const [providerFilter, setProviderFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("created_at");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  const providers = React.useMemo(() => {
    const s = new Set(requests.map((r) => r.provider));
    return ["all", ...Array.from(s)];
  }, [requests]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const displayed = React.useMemo(() => {
    let rows = requests.filter((r) => {
      const q = search.toLowerCase();
      if (q && !r.user_email?.toLowerCase().includes(q) && !r.module.toLowerCase().includes(q) && !r.model.toLowerCase().includes(q)) return false;
      if (providerFilter !== "all" && r.provider !== providerFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [requests, search, providerFilter, statusFilter, sortKey, sortDir]);

  function Sortable({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <button onClick={() => toggleSort(col)} className={`flex items-center gap-1 hover:text-foreground ${active ? "text-foreground font-semibold" : ""}`}>
        {label}
        <span className="text-[10px]">{active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <RequestStats requests={requests} />

      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
        <LatencyChart requests={requests} />
        <ModuleUsage requests={requests} />
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Full Request Log</CardTitle>
            <CardDescription>Every LLM + search-API call with token + cost breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-48">
                <IconSearch className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8 text-sm"
                  placeholder="Search user, module, model…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="w-36 text-sm h-8"><SelectValue placeholder="Provider" /></SelectTrigger>
                <SelectContent>
                  {providers.map((p) => <SelectItem key={p} value={p}>{p === "all" ? "All providers" : p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 text-sm h-8"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="rate-limited">Rate limited</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><Sortable col="created_at" label="Time" /></TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right"><Sortable col="prompt_tokens" label="Prompt tkns" /></TableHead>
                    <TableHead className="text-right"><Sortable col="completion_tokens" label="Compl tkns" /></TableHead>
                    <TableHead className="text-right"><Sortable col="cost_usd" label="Cost" /></TableHead>
                    <TableHead className="text-right"><Sortable col="latency_ms" label="Latency" /></TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="py-12 text-center text-sm text-muted-foreground">No requests match the filters.</TableCell>
                    </TableRow>
                  )}
                  {displayed.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDateTime(r.created_at)}</TableCell>
                      <TableCell className="max-w-[130px] truncate text-xs">{r.user_email}</TableCell>
                      <TableCell className="text-xs">{r.module}</TableCell>
                      <TableCell className="text-xs font-medium">{r.provider}</TableCell>
                      <TableCell className="max-w-[130px] truncate text-xs text-muted-foreground">{r.model}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{fmtInt(r.prompt_tokens)}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{fmtInt(r.completion_tokens)}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums font-medium">{fmtUsd(r.cost_usd)}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{(r.latency_ms / 1000).toFixed(1)}s</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] uppercase ${STATUS_STYLE[r.status] || STATUS_STYLE.success}`}>{r.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">{displayed.length} of {requests.length} requests</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
