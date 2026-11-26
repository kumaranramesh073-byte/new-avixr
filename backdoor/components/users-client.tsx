"use client";

import * as React from "react";
import {
  IconSearch,
  IconUsers,
  IconTrendingUp,
  IconCircleCheck,
  IconClock,
  IconAlertTriangle,
} from "@tabler/icons-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { fmtInt, fmtUsd, fmtTokens, relativeTime } from "@/lib/format";

export type MonitoredUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
  company: string;
  plan: string;
  requests: number;
  tokens: number;
  costUsd: number;
  lastLogin: string;
  status: "active" | "idle" | "over-limit";
};

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_META: Record<MonitoredUser["status"], { label: string; cls: string; icon: React.ElementType }> = {
  active: {
    label: "Active",
    cls: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    icon: IconCircleCheck,
  },
  idle: {
    label: "Idle",
    cls: "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    icon: IconClock,
  },
  "over-limit": {
    label: "Over limit",
    cls: "border-red-200 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    icon: IconAlertTriangle,
  },
};

const PLAN_CLS: Record<string, string> = {
  Free: "border-slate-200 bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400",
  Pro: "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Enterprise: "border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
};

// ── Top KPI strip ─────────────────────────────────────────────────────────────
function UserStats({ users }: { users: MonitoredUser[] }) {
  const total = users.length;
  const byStatus = { active: 0, idle: 0, "over-limit": 0 };
  users.forEach((u) => { if (byStatus[u.status] !== undefined) byStatus[u.status]++; });
  const totalCost = users.reduce((s, u) => s + u.costUsd, 0);

  const cards = [
    { label: "Total Users", value: fmtInt(total), icon: IconUsers, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Active", value: fmtInt(byStatus.active), icon: IconCircleCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Idle (7d+)", value: fmtInt(byStatus.idle), icon: IconClock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Over Limit", value: fmtInt(byStatus["over-limit"]), icon: IconAlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Total Cost", value: fmtUsd(totalCost), icon: IconTrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
  ];

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-5 lg:px-6">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="@container/card">
            <CardHeader>
              <CardDescription>{c.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">{c.value}</CardTitle>
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

// ── Main table ────────────────────────────────────────────────────────────────
type SortKey = keyof Pick<MonitoredUser, "name" | "requests" | "tokens" | "costUsd" | "lastLogin">;

export function UsersClient({ users }: { users: MonitoredUser[] }) {
  const [search, setSearch] = React.useState("");
  const [planFilter, setPlanFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("costUsd");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const displayed = React.useMemo(() => {
    let rows = users.filter((u) => {
      const q = search.toLowerCase();
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !u.company.toLowerCase().includes(q)) return false;
      if (planFilter !== "all" && u.plan !== planFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [users, search, planFilter, statusFilter, sortKey, sortDir]);

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
      <UserStats users={users} />
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Every registered user with usage + cost breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-48">
                <IconSearch className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8 text-sm"
                  placeholder="Search name, email, company…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-36 text-sm h-8">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All plans</SelectItem>
                  <SelectItem value="Free">Free</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 text-sm h-8">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="over-limit">Over limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><Sortable col="name" label="User" /></TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right"><Sortable col="requests" label="Requests" /></TableHead>
                    <TableHead className="text-right"><Sortable col="tokens" label="Tokens" /></TableHead>
                    <TableHead className="text-right"><Sortable col="costUsd" label="Cost" /></TableHead>
                    <TableHead><Sortable col="lastLogin" label="Last Login" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                        No users match the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                  {displayed.map((u) => {
                    const statusMeta = STATUS_META[u.status] || STATUS_META.active;
                    const StatusIcon = statusMeta.icon;
                    const userRole = u.role || "user";
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="font-medium text-sm">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              userRole === "superadmin" || userRole === "admin"
                                ? "border-violet-200 bg-violet-50 text-violet-700 text-[10px] uppercase"
                                : "border-slate-200 bg-slate-50 text-slate-600 text-[10px] uppercase"
                            }
                          >
                            {userRole}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{u.company}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${PLAN_CLS[u.plan] || PLAN_CLS.Free}`}>
                            {u.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 text-[10px] ${statusMeta.cls}`}>
                            <StatusIcon className="size-3" />
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{fmtInt(u.requests)}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{fmtTokens(u.tokens)}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums font-medium">{fmtUsd(u.costUsd)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{relativeTime(u.lastLogin)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">{displayed.length} of {users.length} users</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
