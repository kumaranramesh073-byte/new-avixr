import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Boxes, ChevronRight } from 'lucide-react';
import type { Supplier } from './types';

const RISK: Record<string, { dot: string; badge: string; bar: string }> = {
    high:   { dot: 'bg-red-500',    badge: 'border-red-200 bg-red-50 text-red-700',       bar: 'bg-red-500' },
    medium: { dot: 'bg-amber-500',  badge: 'border-amber-200 bg-amber-50 text-amber-700', bar: 'bg-amber-500' },
    low:    { dot: 'bg-emerald-500',badge: 'border-emerald-200 bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500' },
};

export function SuppliersPanel({ suppliers }: { suppliers: Supplier[] }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-sky-100">
                        <Boxes size={15} className="text-sky-600" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Supplier & Vendor Network</CardTitle>
                        <CardDescription className="text-xs">Key dependencies and concentration risk</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {suppliers.map((s, i) => {
                    const r = RISK[s.risk] ?? RISK.low;
                    return (
                        <div key={i} className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`size-2 shrink-0 rounded-full ${r.dot}`} />
                                        <span className="truncate text-sm font-semibold text-foreground">{s.name}</span>
                                    </div>
                                    <div className="mt-0.5 text-xs text-muted-foreground">{s.category} · {s.region}</div>
                                </div>
                                <Badge variant="outline" className={`shrink-0 text-[10px] font-bold uppercase ${r.badge}`}>
                                    {s.risk}
                                </Badge>
                            </div>

                            <div className="mt-3">
                                <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                                    <span>Dependency</span>
                                    <span className="tabular-nums">{s.dependency}%</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div className={`h-full rounded-full ${r.bar}`} style={{ width: `${s.dependency}%` }} />
                                </div>
                            </div>

                            <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-foreground/70">
                                <ChevronRight size={11} className="mt-0.5 shrink-0 text-sky-400" />
                                {s.note}
                            </p>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
