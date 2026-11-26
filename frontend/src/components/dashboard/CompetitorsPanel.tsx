import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Swords, TrendingUp, Minus, TrendingDown } from 'lucide-react';
import type { CompetitorProfile } from './types';

const MOMENTUM: Record<string, { icon: typeof TrendingUp; class: string; label: string }> = {
    rising:    { icon: TrendingUp,   class: 'border-neon-pink/30 bg-neon-pink/10 text-neon-pink-bright',   label: 'Rising' },
    stable:    { icon: Minus,        class: 'border-white/15 bg-white/5 text-muted-foreground',            label: 'Stable' },
    declining: { icon: TrendingDown, class: 'border-neon-teal/30 bg-neon-teal/10 text-neon-teal',          label: 'Declining' },
};

function threatColor(t: number) {
    return t >= 70 ? 'bg-red-500' : t >= 45 ? 'bg-amber-500' : 'bg-emerald-500';
}

export function CompetitorsPanel({ competitors }: { competitors: CompetitorProfile[] }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-rose-100">
                        <Swords size={15} className="text-rose-600" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Competitive Landscape</CardTitle>
                        <CardDescription className="text-xs">Rival positioning, momentum and threat level</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {competitors.map((c, i) => {
                    const m = MOMENTUM[c.momentum] ?? MOMENTUM.stable;
                    const MIcon = m.icon;
                    return (
                        <div key={i} className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-foreground">{c.name}</div>
                                    <div className="mt-0.5 text-xs text-muted-foreground">{c.positioning}</div>
                                </div>
                                <Badge variant="outline" className={`shrink-0 gap-1 text-[10px] font-bold ${m.class}`}>
                                    <MIcon className="size-3" /> {m.label}
                                </Badge>
                            </div>

                            <div className="mt-3 flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                                        <span>Threat level</span>
                                        <span className="tabular-nums">{c.threat}/100</span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div className={`h-full rounded-full ${threatColor(c.threat)}`} style={{ width: `${c.threat}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-foreground/80">
                                <span className="font-semibold text-rose-600">Recent move · </span>{c.recent_move}
                            </div>
                            <p className="mt-2 text-xs italic leading-relaxed text-muted-foreground">{c.note}</p>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
