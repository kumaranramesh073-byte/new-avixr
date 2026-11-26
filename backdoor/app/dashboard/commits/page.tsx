"use client";

import * as React from "react";
import {
  IconBrandGithub,
  IconGitBranch,
  IconGitCommit,
  IconShieldCheck,
  IconShieldX,
  IconCircleCheck,
  IconAlertTriangle,
  IconRefresh,
  IconExternalLink,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MOCK_COMMITS, MOCK_DEPLOY } from "@/lib/mock-data";
import { relativeTime, fmtDateTime } from "@/lib/format";

// ── Deploy status card ────────────────────────────────────────────────────────
function DeployCard() {
  const d = MOCK_DEPLOY;
  const isLive = d.status === "live";
  const isFailed = d.status === "failed";

  const statusCls = isLive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
    : isFailed
    ? "border-red-200 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
    : "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";

  const StatusIcon = isLive ? IconCircleCheck : isFailed ? IconAlertTriangle : IconRefresh;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
              <IconBrandGithub className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">Deploy Status</CardTitle>
              <CardDescription className="text-xs">Hosted on {d.provider}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={`gap-1 ${statusCls}`}>
            <StatusIcon className="size-3" />
            {d.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Provider", value: d.provider },
            { label: "Last deploy", value: relativeTime(d.lastDeploy) },
            { label: "Commit", value: d.commitSha },
            { label: "Build time", value: `${d.buildTimeSec}s` },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border bg-muted/30 p-3">
              <div className="text-[10px] uppercase text-muted-foreground">{item.label}</div>
              <div className="mt-0.5 font-mono text-sm font-medium">{item.value}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Last deployed {fmtDateTime(d.lastDeploy)} — commit{" "}
          <span className="font-mono">{d.commitSha}</span>
        </p>
      </CardContent>
    </Card>
  );
}

// ── Commit feed ────────────────────────────────────────────────────────────────
function CommitFeed() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <IconGitCommit className="size-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Recent Commits</CardTitle>
              <CardDescription className="text-xs">Latest activity from the main repository</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled>
            <IconRefresh className="size-3.5" /> Refresh (wire GitHub API)
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {MOCK_COMMITS.map((c, i) => (
            <div key={c.sha} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
              {/* Timeline dot */}
              <div className="relative mt-1 flex flex-col items-center">
                <div className="flex size-6 items-center justify-center rounded-full border bg-card shadow-sm">
                  <IconGitCommit className="size-3 text-muted-foreground" />
                </div>
                {i < MOCK_COMMITS.length - 1 && (
                  <div className="mt-1 h-6 w-px bg-border" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">{c.sha}</span>
                  <Badge variant="outline" className="gap-1 text-[10px] border-slate-200 bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                    <IconGitBranch className="size-2.5" />
                    {c.branch}
                  </Badge>
                  {c.verified ? (
                    <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                      <IconShieldCheck className="size-3" /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                      <IconShieldX className="size-3" /> Unverified
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-foreground leading-snug truncate max-w-2xl">
                  {c.message}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{c.author}</span>
                  <span>·</span>
                  <span>{relativeTime(c.ts)}</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline">{fmtDateTime(c.ts)}</span>
                </div>
              </div>

              {/* External link placeholder */}
              <button className="mt-1 shrink-0 text-muted-foreground hover:text-foreground" title="Open on GitHub (wire GitHub API)" disabled>
                <IconExternalLink className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Branch summary ─────────────────────────────────────────────────────────────
function BranchSummary() {
  const branches = [...new Set(MOCK_COMMITS.map((c) => c.branch))];
  const authors = [...new Set(MOCK_COMMITS.map((c) => c.author))];
  const verified = MOCK_COMMITS.filter((c) => c.verified).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repo Summary</CardTitle>
        <CardDescription>At a glance from the commit log</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-2xl font-bold tabular-nums">{MOCK_COMMITS.length}</div>
            <div className="text-xs text-muted-foreground">Commits</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-2xl font-bold tabular-nums">{branches.length}</div>
            <div className="text-xs text-muted-foreground">Branches</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-2xl font-bold tabular-nums">{authors.length}</div>
            <div className="text-xs text-muted-foreground">Authors</div>
          </div>
        </div>

        <Separator />

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Verified commits</span>
            <span className="font-medium tabular-nums">{verified} / {MOCK_COMMITS.length}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(verified / MOCK_COMMITS.length) * 100}%` }} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Active branches</p>
          <div className="flex flex-wrap gap-1.5">
            {branches.map((b) => (
              <Badge key={b} variant="outline" className="gap-1 text-xs">
                <IconGitBranch className="size-3" /> {b}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Contributors</p>
          <div className="flex flex-wrap gap-1.5">
            {authors.map((a) => (
              <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:bg-amber-950/40 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Live data:</strong> Replace <code className="font-mono">MOCK_COMMITS</code> in{" "}
            <code className="font-mono">lib/mock-data.ts</code> with a{" "}
            <code className="font-mono">fetch</code> to{" "}
            <code className="font-mono">GET /api/commits</code> on the main backend, which proxies the GitHub API using your{" "}
            <code className="font-mono">GITHUB_TOKEN</code>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CommitsPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <DeployCard />
      </div>
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <div className="lg:col-span-2">
          <CommitFeed />
        </div>
        <BranchSummary />
      </div>
    </div>
  );
}
