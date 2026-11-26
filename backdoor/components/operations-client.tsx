"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { relativeTime } from "@/lib/format";

interface OperationsProps {
  organizations: any[];
  activity: {
    sessions: any[];
    simulations: any[];
    agentLogs: any[];
    agentOutputs: any[];
  };
  news: {
    articles: any[];
    jobs: any[];
  };
  notifications: {
    notifications: any[];
    alerts: any[];
  };
  dataSources: any[];
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

export function OperationsClient({
  organizations,
  activity,
  news,
  notifications,
  dataSources,
}: OperationsProps) {
  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Supabase Operations & Audit</h1>
        <p className="text-sm text-muted-foreground">
          Live database records across organizations, AI agents, sessions, validated news, notifications (read-only), and data sources.
        </p>
      </div>

      <Tabs defaultValue="orgs" className="w-full">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="orgs">Organizations ({organizations.length})</TabsTrigger>
          <TabsTrigger value="activity">
            Sessions & Agents ({activity.sessions.length + activity.simulations.length + activity.agentOutputs.length})
          </TabsTrigger>
          <TabsTrigger value="logs">Agent Logs ({activity.agentLogs.length})</TabsTrigger>
          <TabsTrigger value="news">News & Validation ({news.articles.length})</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications ({notifications.notifications.length})
          </TabsTrigger>
          <TabsTrigger value="sources">Data Sources ({dataSources.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="orgs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>Tenant workspaces and active Business DNA</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {organizations.length === 0 ? (
                <EmptyState label="No organizations found in Supabase." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Active DNA Company</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{o.name}</TableCell>
                        <TableCell className="font-mono text-xs">{o.slug}</TableCell>
                        <TableCell>{o.memberCount}</TableCell>
                        <TableCell>{o.activeCompany || "—"}</TableCell>
                        <TableCell>{o.industry || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {relativeTime(o.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>Persisted orchestration sessions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {activity.sessions.length === 0 ? (
                <EmptyState label="No sessions recorded in Supabase yet." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activity.sessions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="max-w-md truncate font-medium">{s.query}</TableCell>
                        <TableCell>{s.agent_mode}</TableCell>
                        <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
                        <TableCell>{s.progress}%</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {relativeTime(s.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Simulations</CardTitle>
              <CardDescription>Stored AI simulation runs</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {activity.simulations.length === 0 ? (
                <EmptyState label="No simulations persisted in Supabase yet." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Market</TableHead>
                      <TableHead>Threat</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activity.simulations.map((sim) => (
                      <TableRow key={sim.id}>
                        <TableCell className="font-medium">{sim.title}</TableCell>
                        <TableCell>{sim.simulation_type}</TableCell>
                        <TableCell>{sim.market_score ?? "—"}</TableCell>
                        <TableCell>{sim.competitor_threat ?? "—"}</TableCell>
                        <TableCell>{sim.decision_rank || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {relativeTime(sim.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent Outputs</CardTitle>
              <CardDescription>Persisted outputs from public.agent_outputs</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {activity.agentOutputs.length === 0 ? (
                <EmptyState label="No agent outputs recorded in Supabase yet." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Query</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Latency</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activity.agentOutputs.map((out) => (
                      <TableRow key={out.id}>
                        <TableCell className="font-medium">{out.agent_name}</TableCell>
                        <TableCell>{out.module_name || "—"}</TableCell>
                        <TableCell className="max-w-sm truncate">{out.query}</TableCell>
                        <TableCell>{out.confidence_score != null ? `${out.confidence_score}%` : "—"}</TableCell>
                        <TableCell>{out.execution_time_ms ? `${out.execution_time_ms}ms` : "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {relativeTime(out.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Agent Execution Logs</CardTitle>
              <CardDescription>Recent rows from public.agent_logs</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {activity.agentLogs.length === 0 ? (
                <EmptyState label="No agent logs found." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activity.agentLogs.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.agent_type}</TableCell>
                        <TableCell>{l.action}</TableCell>
                        <TableCell><Badge variant="outline">{l.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {relativeTime(l.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>News Articles & URL Verification</CardTitle>
              <CardDescription>
                Shows source domain, duplicate flags, and URL verification status (placeholder/fake URLs are flagged as rejected).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {news.articles.length === 0 ? (
                <EmptyState label="No news articles found in Supabase." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {news.articles.slice(0, 60).map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="max-w-sm truncate font-medium">{a.title}</TableCell>
                        <TableCell>{a.source}</TableCell>
                        <TableCell className="font-mono text-xs">{a.sourceDomain || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              a.verificationStatus === "verified"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : a.verificationStatus === "rejected"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }
                          >
                            {a.verificationStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                          {(a.reasons || []).join("; ") || "OK"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications (Read-Only)</CardTitle>
              <CardDescription>
                Historical notification records from Supabase. SMS sending is disabled/excluded in this phase.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {notifications.notifications.length === 0 ? (
                <EmptyState label="No notifications found in Supabase." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.notifications.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell className="uppercase text-xs font-semibold">{n.channel}</TableCell>
                        <TableCell>{n.provider}</TableCell>
                        <TableCell><Badge variant="outline">{n.status}</Badge></TableCell>
                        <TableCell className="max-w-md truncate text-xs text-muted-foreground">
                          {n.error_message || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {relativeTime(n.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configured Data Sources</CardTitle>
              <CardDescription>Rows from public.data_source_configs</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {dataSources.length === 0 ? (
                <EmptyState label="No data sources configured yet in Supabase (0 rows)." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Last Sync</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataSources.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell>{d.source_type}</TableCell>
                        <TableCell><Badge variant="outline">{d.status}</Badge></TableCell>
                        <TableCell>{d.record_count ?? 0}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {d.last_sync_at ? relativeTime(d.last_sync_at) : "Never"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
