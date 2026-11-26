import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Sparkles } from 'lucide-react';
import type { Opportunity } from './types';

export function OpportunitiesPanel({ opportunities }: { opportunities: Opportunity[] }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100">
                        <Lightbulb size={15} className="text-amber-600" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Growth Opportunities</CardTitle>
                        <CardDescription className="text-xs">Highest-leverage plays ranked by potential</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {opportunities.map((o, i) => (
                    <div key={i} className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2">
                                <Sparkles size={14} className="mt-0.5 shrink-0 text-amber-500" />
                                <span className="text-sm font-semibold text-foreground">{o.title}</span>
                            </div>
                            <span className="shrink-0 text-sm font-bold tabular-nums text-amber-600">{o.potential}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-amber-100">
                            <div className="h-full rounded-full bg-amber-500" style={{ width: `${o.potential}%` }} />
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{o.note}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
