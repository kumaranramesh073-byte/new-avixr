"use client";

import * as React from "react";
import {
  IconBrandGithub,
  IconGitBranch,
  IconGitCommit,
  IconShieldCheck,
  IconShieldX,
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
import { relativeTime, fmtDateTime } from "@/lib/format";

interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  ts: string;
  url: string;
  verified: boolean;
}

export default function CommitsPage() {
  const [commits, setCommits] = React.useState<GitHubCommit[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadCommits = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "https://api.github.com/repos/kumaranramesh073-byte/new-avixr/commits?sha=main&per_page=10",
        { cache: "no-store" }
      );
      if (!res.ok) {
        throw new Error(`GitHub API returned HTTP ${res.status}`);
      }
      const rows = (await res.json()) as any[];
      setCommits(
        rows.map((r) => ({
          sha: String(r.sha || "").slice(0, 7),
          message: String(r.commit?.message || "").split("\n")[0],
          author: r.commit?.author?.name || r.author?.login || "Unknown",
          ts: r.commit?.author?.date || new Date().toISOString(),
          url: r.html_url || "",
          verified: !!r.commit?.verification?.verified,
        }))
      );
    } catch (err: any) {
      setError(err?.message || "Unable to reach GitHub API");
      setCommits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadCommits();
  }, [loadCommits]);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <IconBrandGithub className="size-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Repository Commits (kumaranramesh073-byte/new-avixr)</CardTitle>
                <CardDescription className="text-xs">Live commits on branch main</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={loadCommits} disabled={loading}>
              <IconRefresh className="size-3.5" /> {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading commits from GitHub...</div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-muted-foreground">{error}</div>
          ) : commits.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No commits found on main.</div>
          ) : (
            <div className="divide-y">
              {commits.map((c) => (
                <div key={c.sha} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                  <div className="relative mt-1 flex flex-col items-center">
                    <div className="flex size-6 items-center justify-center rounded-full border bg-card shadow-sm">
                      <IconGitCommit className="size-3 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{c.sha}</span>
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <IconGitBranch className="size-2.5" />
                        main
                      </Badge>
                      {c.verified ? (
                        <span className="flex items-center gap-0.5 text-[10px] text-emerald-600">
                          <IconShieldCheck className="size-3" /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                          <IconShieldX className="size-3" /> Unverified
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-foreground leading-snug truncate max-w-2xl">{c.message}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{c.author}</span>
                      <span>·</span>
                      <span>{relativeTime(c.ts)}</span>
                      <span className="hidden sm:inline">·</span>
                      <span className="hidden sm:inline">{fmtDateTime(c.ts)}</span>
                    </div>
                  </div>
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 shrink-0 text-muted-foreground hover:text-foreground"
                      title="Open on GitHub"
                    >
                      <IconExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
