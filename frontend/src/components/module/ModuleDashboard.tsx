/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON — Reusable Module Dashboard Shell
   Renders the Standard Module Intelligence schema for ANY module. Each module
   page is just <ModuleDashboard moduleKey="forecasting" ... extraCharts={…} />.
   Bakes in: Narrative · KPIs+confidence · Why-This-Matters · Alerts · Scenarios
   · Recommendations · Opportunities · Timeline · Ripple · Root-cause.
   ═══════════════════════════════════════════════════════════════════════════ */

import { type ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RefreshCw, Zap, AlertTriangle, TrendingUp, TrendingDown, Minus,
    Lightbulb, Compass, ChevronRight, ShieldAlert, Activity, Clock,
    Globe, ExternalLink, Download, Loader2,
} from 'lucide-react';
import { useModule } from '../../hooks/useModule';
import MermaidRenderer from '../shared/MermaidRenderer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type {
    StandardModuleOutput, ModuleKPI, ModuleAlert, ModuleScenario, ModuleRecommendation,
} from './types';

const SEVERITY: Record<string, string> = {
    critical: 'border-neon-pink/30 bg-neon-pink/10 text-neon-pink-bright',
    high: 'border-neon-gold/30 bg-neon-gold/10 text-neon-gold',
    medium: 'border-neon-gold/30 bg-neon-gold/10 text-neon-gold',
    low: 'border-neon-teal/30 bg-neon-teal/10 text-neon-teal',
};
const PRIORITY: Record<string, string> = {
    high: 'border-neon-pink/30 bg-neon-pink/10 text-neon-pink-bright',
    medium: 'border-neon-gold/30 bg-neon-gold/10 text-neon-gold',
    low: 'border-white/15 bg-white/5 text-muted-foreground',
};

function TrendIcon({ t }: { t: ModuleKPI['trend'] }) {
    if (t === 'up') return <TrendingUp className="size-3" />;
    if (t === 'down') return <TrendingDown className="size-3" />;
    return <Minus className="size-3" />;
}

function KPIStrip({ kpis }: { kpis: ModuleKPI[] }) {
    return (
        <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
            {kpis.slice(0, 4).map((k, i) => {
                const good = k.trend === 'up';
                return (
                    <Card key={i} className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
                        <CardHeader>
                            <CardDescription>{k.label}</CardDescription>
                            <CardTitle className="text-3xl font-bold tabular-nums">
                                {k.value}<span className="text-base font-normal text-muted-foreground">{k.unit}</span>
                            </CardTitle>
                            {k.delta && (
                                <div className="absolute right-4 top-4">
                                    <Badge variant="outline" className={`gap-1 ${good ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : k.trend === 'down' ? 'border-red-200 bg-red-50 text-red-500' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                                        <TrendIcon t={k.trend} />{k.delta}
                                    </Badge>
                                </div>
                            )}
                        </CardHeader>
                        {typeof k.confidence === 'number' && (
                            <CardContent className="pt-0">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>Confidence</span>
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-primary/60" style={{ width: `${k.confidence}%` }} />
                                    </div>
                                    <span className="tabular-nums font-medium">{k.confidence}%</span>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}

function ConfidencePanel({ data }: { data: StandardModuleOutput }) {
    const c = data.confidence;
    const ring = c.overall >= 75 ? '#22c55e' : c.overall >= 50 ? '#eab308' : '#ef4444';
    const bars: Array<[string, number]> = [
        ['Data Quality', c.data_quality], ['Signal Strength', c.signal_strength], ['Scenario Stability', c.scenario_stability],
    ];
    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">AI Confidence</CardTitle>
                <CardDescription className="text-xs">How much to trust this read</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-5">
                <div className="relative size-20 shrink-0">
                    <svg viewBox="0 0 36 36" className="size-20 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke={ring} strokeWidth="3" strokeLinecap="round"
                            strokeDasharray={`${c.overall} 100`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-black tabular-nums" style={{ color: ring }}>{c.overall}</span>
                        <span className="text-[9px] text-muted-foreground">overall</span>
                    </div>
                </div>
                <div className="flex-1 space-y-2">
                    {bars.map(([label, v]) => (
                        <div key={label}>
                            <div className="mb-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                                <span>{label}</span><span className="tabular-nums">{v}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div className="h-full rounded-full bg-primary/50" style={{ width: `${v}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function WhyItMatters({ data }: { data: StandardModuleOutput }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-100"><Activity size={15} className="text-indigo-600" /></div>
                    <div><CardTitle className="text-base">Why This Matters</CardTitle>
                        <CardDescription className="text-xs">Interpretation, not just numbers</CardDescription></div>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {data.why_it_matters.map((w, i) => (
                    <div key={i} className="rounded-xl border bg-card p-4">
                        <div className="text-sm font-semibold text-foreground">{w.signal}</div>
                        <div className="mt-2 space-y-1.5 text-xs">
                            <p><span className="font-semibold text-muted-foreground">Why: </span><span className="text-foreground/80">{w.why}</span></p>
                            <p><span className="font-semibold text-orange-600">Impact: </span><span className="text-foreground/80">{w.impact}</span></p>
                            <p className="flex items-start gap-1.5 rounded-lg bg-primary/5 px-2 py-1.5">
                                <ChevronRight size={11} className="mt-0.5 shrink-0 text-primary" />
                                <span className="font-medium text-primary">{w.recommended_action}</span></p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function AlertsFeed({ alerts }: { alerts: ModuleAlert[] }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-red-100"><ShieldAlert size={15} className="text-red-600" /></div>
                    <div><CardTitle className="text-base">Live Alerts</CardTitle>
                        <CardDescription className="text-xs">Predictive early warnings</CardDescription></div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
                {alerts.map((a, i) => (
                    <div key={i} className="rounded-xl border bg-card p-3">
                        <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium text-foreground">{a.title}</span>
                            <Badge variant="outline" className={`shrink-0 text-[10px] font-bold uppercase ${SEVERITY[a.severity] ?? SEVERITY.low}`}>{a.severity}</Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock size={11} /> {a.timeline}</span>
                            <span>·</span><span className="tabular-nums">{a.probability}% probability</span>
                        </div>
                        <p className="mt-1 text-xs text-foreground/70">{a.impact}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function OpportunitiesPanel({ data }: { data: StandardModuleOutput }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100"><Lightbulb size={15} className="text-amber-600" /></div>
                    <div><CardTitle className="text-base">Opportunity Radar</CardTitle>
                        <CardDescription className="text-xs">Highest-leverage upside plays</CardDescription></div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {data.opportunities.map((o, i) => (
                    <div key={i} className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">{o.title}</span>
                            <span className="text-sm font-bold tabular-nums text-amber-600">{o.potential}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-amber-100">
                            <div className="h-full rounded-full bg-amber-500" style={{ width: `${o.potential}%` }} />
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">{o.note}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function ScenarioCompare({ scenarios }: { scenarios: ModuleScenario[] }) {
    return (
        <div className="px-4 lg:px-6">
            <div className="mb-3 flex items-center gap-2">
                <Compass size={16} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">Scenario Simulation</h3>
                <span className="text-xs text-muted-foreground">— what each path leads to</span>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {scenarios.map((s, i) => {
                    const up = s.revenue_impact.trim().startsWith('+');
                    return (
                        <Card key={i} className={s.recommended ? 'border-primary/40 ring-1 ring-primary/20' : ''}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">{s.name}</CardTitle>
                                    {s.recommended && <Badge className="bg-primary text-[10px] text-primary-foreground">Recommended</Badge>}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="text-[10px] uppercase text-muted-foreground">Revenue Impact</div>
                                    <div className={`text-2xl font-black ${up ? 'text-emerald-600' : 'text-red-500'}`}>{s.revenue_impact}</div>
                                </div>
                                <div>
                                    <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                                        <span>Risk Index</span><span className="tabular-nums">{s.risk_index}</span></div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div className={`h-full rounded-full ${s.risk_index > 65 ? 'bg-red-500' : s.risk_index > 45 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${s.risk_index}%` }} />
                                    </div>
                                </div>
                                {s.market_share && <div className="text-xs"><span className="text-muted-foreground">Market share: </span><span className="font-semibold text-foreground">{s.market_share}</span></div>}
                                <p className="text-xs leading-relaxed text-muted-foreground">{s.note}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

function Recommendations({ recs }: { recs: ModuleRecommendation[] }) {
    const order = { high: 0, medium: 1, low: 2 } as Record<string, number>;
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100"><Zap size={15} className="text-emerald-600" /></div>
                    <div><CardTitle className="text-base">Recommended Actions</CardTitle>
                        <CardDescription className="text-xs">Priority-ranked, with ROI</CardDescription></div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
                {[...recs].sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3)).map((r, i) => (
                    <div key={i} className="rounded-xl border bg-card p-3">
                        <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-semibold text-foreground">{r.action}</span>
                            <Badge variant="outline" className={`shrink-0 text-[10px] font-bold uppercase ${PRIORITY[r.priority] ?? PRIORITY.low}`}>{r.priority}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{r.impact}</p>
                        <div className="mt-2 flex items-center gap-3 text-[11px]">
                            <span className="rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">ROI {r.roi}</span>
                            <span className="text-muted-foreground">Complexity: {r.complexity}</span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function RootCause({ data }: { data: StandardModuleOutput }) {
    const colors = ['bg-indigo-500', 'bg-sky-500', 'bg-amber-500', 'bg-rose-500'];
    return (
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Root-Cause Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
                {data.root_cause.map((r, i) => (
                    <div key={i}>
                        <div className="mb-0.5 flex items-center justify-between text-xs">
                            <span className="text-foreground/80">{r.factor}</span><span className="font-semibold tabular-nums">{r.pct}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${r.pct}%` }} />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function LiveSources({ data }: { data: StandardModuleOutput }) {
    const sources = data.sources ?? [];
    if (!sources.length) return null;
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-sky-100"><Globe size={15} className="text-sky-600" /></div>
                    <div>
                        <CardTitle className="text-base">Live Sources</CardTitle>
                        <CardDescription className="text-xs">Real web results this analysis was grounded on</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                {sources.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                        className="group flex items-start gap-2 rounded-lg border bg-card p-2.5 transition-colors hover:bg-muted">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-sky-100 text-[10px] font-bold tabular-nums text-sky-700">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 text-xs font-medium text-foreground group-hover:text-sky-700">
                                <span className="truncate">{s.title || s.url}</span>
                                <ExternalLink size={11} className="shrink-0 text-muted-foreground" />
                            </div>
                            {s.snippet && <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{s.snippet}</p>}
                            <p className="mt-0.5 truncate text-[10px] text-muted-foreground/70">{s.url}</p>
                        </div>
                    </a>
                ))}
            </CardContent>
        </Card>
    );
}

// ─── PDF Export ─────────────────────────────────────────────────────────────
async function exportModuleToPDF(data: StandardModuleOutput, title: string, moduleKey: string) {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
    ]);

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const PW = 210;
    const PH = 297;
    const MARGIN = 14;

    // Cover page
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, PW, PH, 'F');
    pdf.setFillColor(99, 102, 241);
    pdf.rect(0, 0, PW, 2, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(28);
    pdf.setTextColor(255, 255, 255);
    pdf.text(data.company_name, MARGIN, 54);

    pdf.setFontSize(13);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Q-SIMUTRON — ${title} Report`, MARGIN, 64);
    pdf.text(new Date(data.generated_at).toLocaleString(), MARGIN, 71);

    // KPI row (up to 4)
    const kpis = data.kpis.slice(0, 4);
    let sx = MARGIN;
    kpis.forEach(k => {
        pdf.setFillColor(30, 41, 59);
        pdf.roundedRect(sx, 82, 42, 22, 3, 3, 'F');
        pdf.setFontSize(13);
        pdf.setTextColor(99, 102, 241);
        pdf.setFont('helvetica', 'bold');
        const val = `${k.value}${k.unit ?? ''}`;
        pdf.text(val.length > 8 ? val.slice(0, 8) : val, sx + 21, 96, { align: 'center' });
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184);
        pdf.setFont('helvetica', 'normal');
        const lbl = k.label.length > 14 ? k.label.slice(0, 14) : k.label;
        pdf.text(lbl, sx + 21, 101, { align: 'center' });
        sx += 46;
    });

    // Executive summary excerpt
    pdf.setFontSize(9);
    pdf.setTextColor(203, 213, 225);
    pdf.setFont('helvetica', 'italic');
    const summaryLines = pdf.splitTextToSize(`"${data.executive_summary}"`, PW - MARGIN * 2);
    pdf.text(summaryLines.slice(0, 4), MARGIN, 118);

    // Confidence score
    pdf.setFontSize(10);
    pdf.setTextColor(99, 102, 241);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`AI Confidence: ${data.confidence.overall}%`, MARGIN, 145);

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Powered by Q-SIMUTRON Intelligence Platform', MARGIN, PH - 10);

    // Capture the rendered content
    const el = document.getElementById(`module-report-${moduleKey}`);
    if (el) {
        const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#f8fafc',
            logging: false,
        });

        const imgW = PW - MARGIN * 2;
        const imgH = (canvas.height * imgW) / canvas.width;
        const printableH = PH - 18;

        if (imgH <= printableH) {
            pdf.addPage();
            pdf.setFillColor(238, 242, 255);
            pdf.rect(0, 0, PW, 12, 'F');
            pdf.setFillColor(99, 102, 241);
            pdf.rect(0, 0, 3, 12, 'F');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            pdf.setTextColor(79, 70, 229);
            pdf.text(title, 8, 8);
            pdf.setTextColor(148, 163, 184);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7);
            pdf.text(data.company_name, PW - MARGIN, 8, { align: 'right' });
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', MARGIN, 14, imgW, imgH);
        } else {
            const ratio = canvas.width / imgW;
            const sliceH = printableH * ratio;
            let sliceY = 0;
            let firstSlice = true;
            while (sliceY < canvas.height) {
                pdf.addPage();
                pdf.setFillColor(238, 242, 255);
                pdf.rect(0, 0, PW, 12, 'F');
                pdf.setFillColor(99, 102, 241);
                pdf.rect(0, 0, 3, 12, 'F');
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(9);
                pdf.setTextColor(79, 70, 229);
                pdf.text(firstSlice ? title : `${title} (cont.)`, 8, 8);
                pdf.setTextColor(148, 163, 184);
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(7);
                pdf.text(data.company_name, PW - MARGIN, 8, { align: 'right' });

                const slice = document.createElement('canvas');
                slice.width = canvas.width;
                slice.height = Math.min(sliceH, canvas.height - sliceY);
                const ctx = slice.getContext('2d')!;
                ctx.drawImage(canvas, 0, -sliceY);
                const sliceImgH = (slice.height * imgW) / slice.width;
                pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', MARGIN, 14, imgW, sliceImgH);
                sliceY += sliceH;
                firstSlice = false;
            }
        }
    }

    const filename = `${data.company_name.replace(/\s+/g, '_')}_${title.replace(/\s+/g, '_')}_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(filename);
}

// ─── Main shell ─────────────────────────────────────────────────────────────
export function ModuleDashboard({
    moduleKey, title, subtitle, icon: Icon, accent = 'bg-primary/10 text-primary', extraCharts, extraParams,
}: {
    moduleKey: string; title: string; subtitle: string; icon: React.ElementType;
    accent?: string; extraCharts?: (charts: Record<string, any>) => ReactNode;
    extraParams?: Record<string, string>;
}) {
    const { data, loading, error, stageLabel, run, hasDNA } = useModule(moduleKey, extraParams);
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        if (!data) return;
        setExporting(true);
        try { await exportModuleToPDF(data, title, moduleKey); }
        finally { setExporting(false); }
    };

    if (!hasDNA) {
        return <div className="flex h-full items-center justify-center bg-background text-sm text-muted-foreground">No Business DNA configured. Complete onboarding first.</div>;
    }

    return (
        <div className="min-h-full bg-transparent">
            {/* Header */}
            <div className="qs-topbar flex items-center justify-between px-4 py-3 lg:px-6">
                <div className="flex items-center gap-3">
                    <div className={`flex size-9 items-center justify-center rounded-xl ${accent}`}><Icon size={18} /></div>
                    <div>
                        <h1 className="text-base font-bold tracking-tight text-foreground">{data?.company_name ? `${data.company_name} — ${title}` : title}</h1>
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {data?.grounded && (data.sources?.length ?? 0) > 0 && (
                        <Badge variant="outline" className="gap-1 border-neon-teal/30 bg-neon-teal/10 text-neon-teal">
                            <Globe size={11} /> Grounded in {data.sources!.length} live web source{data.sources!.length === 1 ? '' : 's'}
                        </Badge>
                    )}
                    <button onClick={run} disabled={loading}
                        className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60">
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> {loading ? 'Running…' : 'Re-run'}
                    </button>
                    {data && (
                        <button onClick={handleExport} disabled={exporting}
                            className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60">
                            {exporting
                                ? <><Loader2 size={13} className="animate-spin" /> Exporting…</>
                                : <><Download size={13} /> Export PDF</>
                            }
                        </button>
                    )}
                </div>
            </div>

            {/* Loading */}
            <AnimatePresence>
                {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center gap-5 py-28">
                        <div className="relative size-14">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                                className="absolute size-14 rounded-full border-2 border-primary/15" style={{ borderTopColor: 'hsl(var(--primary))' }} />
                            <div className="absolute inset-0 flex items-center justify-center"><Zap size={20} className="text-primary" /></div>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">{stageLabel}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && !loading && (
                <div className="glass glass-edge m-4 flex items-center gap-3 rounded-2xl border-neon-pink/25 p-4 lg:m-6">
                    <AlertTriangle size={16} className="text-neon-pink-bright" />
                    <div><div className="text-sm font-semibold text-neon-pink-bright">Analysis error</div>
                        <div className="text-xs text-muted-foreground">{error}</div></div>
                </div>
            )}

            {/* Results */}
            <AnimatePresence>
                {data && !loading && (
                    <motion.div id={`module-report-${moduleKey}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                        className="flex flex-col gap-5 py-5 pb-10">

                        {/* Narrative */}
                        <div className="px-4 lg:px-6">
                            <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-card">
                                <CardContent className="py-4">
                                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary">Executive Summary</div>
                                    <p className="text-sm leading-relaxed text-foreground/90">{data.executive_summary}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <KPIStrip kpis={data.kpis} />

                        {/* Module-specific charts + confidence */}
                        <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
                            <div className="lg:col-span-2">{extraCharts ? extraCharts(data.charts ?? {}) : null}</div>
                            <ConfidencePanel data={data} />
                        </div>

                        <div className="px-4 lg:px-6"><WhyItMatters data={data} /></div>

                        <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
                            <AlertsFeed alerts={data.alerts} />
                            <OpportunitiesPanel data={data} />
                        </div>

                        <ScenarioCompare scenarios={data.scenarios} />

                        <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
                            <Recommendations recs={data.recommendations} />
                            <RootCause data={data} />
                        </div>

                        {/* Ripple */}
                        <div className="px-4 lg:px-6">
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-violet-100"><Activity size={15} className="text-violet-600" /></div>
                                        <div><CardTitle className="text-base">Ripple Effect Chain</CardTitle>
                                            <CardDescription className="text-xs">How one event cascades through the business</CardDescription></div>
                                    </div>
                                </CardHeader>
                                <CardContent><MermaidRenderer chart={data.ripple_mermaid} /></CardContent>
                            </Card>
                        </div>

                        {/* Live Sources (real web grounding) */}
                        {(data.sources?.length ?? 0) > 0 && (
                            <div className="px-4 lg:px-6"><LiveSources data={data} /></div>
                        )}

                        <p className="px-4 text-center text-xs text-muted-foreground">
                            Generated {new Date(data.generated_at).toLocaleString()} · {data.company_name} · confidence {data.confidence.overall}%
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
