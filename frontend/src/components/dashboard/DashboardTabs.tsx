/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON OCT — Mini-Bloomberg scrolling dashboard
   One continuous page, section by section, with a sticky jump-nav:
   Overview · Market Intel · Competitors · Risk · Supply Chain · Forecast · Strategy
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react';
import {
    LayoutDashboard, TrendingUp, Swords, Shield, Boxes,
    LineChart, Compass, ChevronRight, Clock, Download, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MermaidRenderer from '../shared/MermaidRenderer';
import { SimKPICards } from './SimKPICards';
import { SimAreaChart } from './SimAreaChart';
import { ThreatsTable } from './ThreatsTable';
import { SuppliersPanel } from './SuppliersPanel';
import { CompetitorsPanel } from './CompetitorsPanel';
import { MarketShareChart } from './MarketShareChart';
import { FinancialProjectionChart } from './FinancialProjectionChart';
import { OpportunitiesPanel } from './OpportunitiesPanel';
import type { SimulationResponse } from './types';

const SECTIONS = [
    { id: 'overview',    label: 'Overview',     icon: LayoutDashboard, title: 'Overview',           sub: 'Composite OCT signals at a glance' },
    { id: 'market',      label: 'Market Intel', icon: TrendingUp,      title: 'Market Intelligence', sub: 'Bloomberg live signals & revenue mix' },
    { id: 'competitors', label: 'Competitors',  icon: Swords,          title: 'Competitive Landscape', sub: 'Rivals, momentum & market share' },
    { id: 'risk',        label: 'Risk',         icon: Shield,          title: 'Risk Center',         sub: 'BlackRock Aladdin RPN & ripple chain' },
    { id: 'supply',      label: 'Supply Chain', icon: Boxes,           title: 'Supply Chain',        sub: 'Suppliers, dependencies & flow map' },
    { id: 'forecast',    label: 'Forecast',     icon: LineChart,       title: 'Forecast',            sub: 'Financial projection & opportunities' },
    { id: 'strategy',    label: 'Strategy',     icon: Compass,         title: 'Strategy',            sub: 'Vanguard long-term playbook' },
];

function SectionHeader({ icon: Icon, title, sub }: { icon: typeof Shield; title: string; sub: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon size={18} />
            </div>
            <div>
                <h2 className="text-lg font-bold leading-tight tracking-tight text-foreground">{title}</h2>
                <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
        </div>
    );
}

function BlackRockCard({ data }: { data: SimulationResponse }) {
    const rpn = data.blackrock_output.rpn;
    const tone = rpn > 70 ? 'text-red-500' : rpn > 40 ? 'text-orange-500' : 'text-emerald-500';
    const bar = rpn > 70 ? 'bg-red-500' : rpn > 40 ? 'bg-orange-500' : 'bg-emerald-500';
    const badge = rpn > 70 ? 'border-red-200 bg-red-50 text-red-700' : rpn > 40 ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-green-200 bg-green-50 text-green-700';
    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-red-100">
                        <Shield size={14} className="text-red-600" />
                    </div>
                    <div>
                        <CardTitle className="text-base">BlackRock Aladdin</CardTitle>
                        <CardDescription className="text-xs">Risk priority analysis</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="flex items-end gap-3">
                    <span className={`text-5xl font-black leading-none ${tone}`}>{rpn}</span>
                    <div className="mb-1">
                        <Badge variant="outline" className={`text-xs ${badge}`}>{data.blackrock_output.risk_category}</Badge>
                    </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${rpn}%` }} />
                </div>
                <p className="text-xs italic leading-relaxed text-muted-foreground">{data.blackrock_output.capital_recommendation}</p>
                <div className="flex flex-col gap-1.5">
                    {data.blackrock_output.ripple_effects.slice(0, 4).map((e, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-foreground/70">
                            <ChevronRight size={11} className="mt-0.5 shrink-0 text-red-400" />{e}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function VanguardCard({ data }: { data: SimulationResponse }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100">
                        <Clock size={14} className="text-emerald-600" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Vanguard Strategy</CardTitle>
                        <CardDescription className="flex items-center gap-2 text-xs">
                            Stability: <span className="font-bold text-emerald-600">{data.vanguard_output.stability_score}/100</span>
                        </CardDescription>
                    </div>
                </div>
                <p className="mt-1 text-xs italic leading-relaxed text-muted-foreground">{data.vanguard_output.long_term_outlook}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {data.vanguard_output.actions.map((a, i) => (
                    <div key={i} className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-semibold text-emerald-800">{a.step}</span>
                            <Badge variant="outline" className="border-neon-teal/30 bg-neon-teal/10 text-[10px] text-neon-teal">{a.timeline}</Badge>
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">{a.rationale}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function MermaidCard({ title, description, code, accent }: { title: string; description: string; code: string; accent: string }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className={`flex size-8 items-center justify-center rounded-lg ${accent}`}>
                        <LineChart size={14} />
                    </div>
                    <div>
                        <CardTitle className="text-base">{title}</CardTitle>
                        <CardDescription className="text-xs">{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <MermaidRenderer chart={code} />
            </CardContent>
        </Card>
    );
}

async function exportToPDF(data: SimulationResponse) {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
    ]);

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const PW = 210; // A4 width mm
    const PH = 297; // A4 height mm
    const MARGIN = 14;

    // ── Cover page ────────────────────────────────────────────────────────────
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
    pdf.text('Q-SIMUTRON OCT — Simulation Report', MARGIN, 64);
    pdf.text(new Date(data.generated_at).toLocaleString(), MARGIN, 71);

    // Score row
    const scores = [
        { label: 'Market Score', value: `${data.market_score}/100` },
        { label: 'RPN', value: `${data.blackrock_output.rpn}/100` },
        { label: 'Stability', value: `${data.vanguard_output.stability_score}/100` },
        { label: 'Threat', value: `${data.competitor_threat}/100` },
    ];
    let sx = MARGIN;
    scores.forEach(s => {
        pdf.setFillColor(30, 41, 59);
        pdf.roundedRect(sx, 82, 42, 22, 3, 3, 'F');
        pdf.setFontSize(16);
        pdf.setTextColor(99, 102, 241);
        pdf.setFont('helvetica', 'bold');
        pdf.text(s.value, sx + 21, 96, { align: 'center' });
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.setFont('helvetica', 'normal');
        pdf.text(s.label, sx + 21, 101, { align: 'center' });
        sx += 46;
    });

    // Bloomberg headline
    pdf.setFontSize(9);
    pdf.setTextColor(203, 213, 225);
    pdf.setFont('helvetica', 'italic');
    const lines = pdf.splitTextToSize(`"${data.bloomberg_output.headline}"`, PW - MARGIN * 2);
    pdf.text(lines, MARGIN, 118);

    // Powered-by line
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Powered by Bloomberg · BlackRock · Vanguard · Ecosystem AI Agents', MARGIN, PH - 10);

    // ── Capture every section ─────────────────────────────────────────────────
    const sectionIds = ['overview', 'market', 'competitors', 'risk', 'supply', 'forecast', 'strategy'];
    const labels: Record<string, string> = {
        overview: 'Overview', market: 'Market Intelligence', competitors: 'Competitive Landscape',
        risk: 'Risk Center', supply: 'Supply Chain', forecast: 'Forecast', strategy: 'Strategy',
    };

    for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;

        const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const imgH = (canvas.height * (PW - MARGIN * 2)) / canvas.width;

        pdf.addPage();
        // Section header bar
        pdf.setFillColor(238, 242, 255);
        pdf.rect(0, 0, PW, 12, 'F');
        pdf.setFillColor(99, 102, 241);
        pdf.rect(0, 0, 3, 12, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(79, 70, 229);
        pdf.text(labels[id] ?? id, 8, 8);
        pdf.setTextColor(148, 163, 184);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.text(data.company_name, PW - MARGIN, 8, { align: 'right' });

        // Fit image — split across pages if taller than printable area
        const printableH = PH - 18;
        if (imgH <= printableH) {
            pdf.addImage(imgData, 'JPEG', MARGIN, 14, PW - MARGIN * 2, imgH);
        } else {
            // Slice the image vertically across pages
            const ratio = canvas.width / (PW - MARGIN * 2);
            const sliceH = printableH * ratio;
            let sliceY = 0;
            let firstSlice = true;
            while (sliceY < canvas.height) {
                if (!firstSlice) {
                    pdf.addPage();
                    pdf.setFillColor(238, 242, 255);
                    pdf.rect(0, 0, PW, 12, 'F');
                    pdf.setFillColor(99, 102, 241);
                    pdf.rect(0, 0, 3, 12, 'F');
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(9);
                    pdf.setTextColor(79, 70, 229);
                    pdf.text(`${labels[id] ?? id} (cont.)`, 8, 8);
                }
                const slice = document.createElement('canvas');
                slice.width = canvas.width;
                slice.height = Math.min(sliceH, canvas.height - sliceY);
                const ctx = slice.getContext('2d')!;
                ctx.drawImage(canvas, 0, -sliceY);
                const sliceData = slice.toDataURL('image/jpeg', 0.92);
                const sliceImgH = (slice.height * (PW - MARGIN * 2)) / slice.width;
                pdf.addImage(sliceData, 'JPEG', MARGIN, 14, PW - MARGIN * 2, sliceImgH);
                sliceY += sliceH;
                firstSlice = false;
            }
        }
    }

    const filename = `${data.company_name.replace(/\s+/g, '_')}_OCT_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(filename);
}

export function DashboardTabs({ data }: { data: SimulationResponse }) {
    const eco = data.ecosystem_output;
    const [active, setActive] = useState('overview');
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            await exportToPDF(data);
        } finally {
            setExporting(false);
        }
    };

    // Highlight the section currently in view
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                const visible = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                if (visible[0]) setActive(visible[0].target.id);
            },
            { rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.25, 0.5, 1] }
        );
        SECTIONS.forEach(s => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    const jump = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="flex w-full flex-col gap-8">
            {/* Sticky jump-nav */}
            <div className="sticky top-0 z-20 -mx-4 border-b bg-background/85 px-4 py-2 backdrop-blur lg:-mx-6 lg:px-6">
                <div className="flex items-center gap-1">
                    <div className="flex flex-1 flex-wrap gap-1">
                        {SECTIONS.map(s => {
                            const Icon = s.icon;
                            const on = active === s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => jump(s.id)}
                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                        on ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                >
                                    <Icon className="size-3.5" /> {s.label}
                                </button>
                            );
                        })}
                    </div>
                    {/* Export button */}
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="ml-2 flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
                    >
                        {exporting
                            ? <><Loader2 className="size-3.5 animate-spin" /> Exporting…</>
                            : <><Download className="size-3.5" /> Export PDF</>
                        }
                    </button>
                </div>
            </div>

            {/* ── 1. OVERVIEW ── */}
            <section id="overview" className="flex scroll-mt-16 flex-col gap-4">
                <div className="px-4 lg:px-6"><SectionHeader icon={LayoutDashboard} title="Overview" sub="Composite OCT signals at a glance" /></div>
                <SimKPICards data={data} />
                <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
                    <div className="lg:col-span-2">
                        <SimAreaChart
                            marketScore={data.market_score}
                            competitorThreat={data.competitor_threat}
                            stabilityScore={data.vanguard_output.stability_score}
                        />
                    </div>
                    <MarketShareChart title="Market Share" description={`${data.company_name} vs. rivals`} data={eco.market_share} highlightFirst />
                </div>
            </section>

            {/* ── 2. MARKET INTEL ── */}
            <section id="market" className="flex scroll-mt-16 flex-col gap-4 px-4 lg:px-6">
                <SectionHeader icon={TrendingUp} title="Market Intelligence" sub="Bloomberg live signals & revenue mix" />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ThreatsTable threats={data.bloomberg_output.threats} headline={data.bloomberg_output.headline} velocity={data.bloomberg_output.market_velocity} />
                    <MarketShareChart title="Revenue Mix" description="Where the money comes from" data={eco.sector_breakdown} />
                </div>
                <SimAreaChart marketScore={data.market_score} competitorThreat={data.competitor_threat} stabilityScore={data.vanguard_output.stability_score} />
            </section>

            {/* ── 3. COMPETITORS ── */}
            <section id="competitors" className="flex scroll-mt-16 flex-col gap-4 px-4 lg:px-6">
                <SectionHeader icon={Swords} title="Competitive Landscape" sub="Rivals, momentum & market share" />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <CompetitorsPanel competitors={eco.competitors} />
                    <MarketShareChart title="Market Share" description={`${data.company_name} vs. rivals`} data={eco.market_share} highlightFirst />
                </div>
            </section>

            {/* ── 4. RISK ── */}
            <section id="risk" className="flex scroll-mt-16 flex-col gap-4 px-4 lg:px-6">
                <SectionHeader icon={Shield} title="Risk Center" sub="BlackRock Aladdin RPN & ripple chain" />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <BlackRockCard data={data} />
                    <MermaidCard title="Causal Ripple Graph" description="Market event → business impact chain" code={data.mermaid_graph_code} accent="bg-violet-100 text-violet-600" />
                </div>
            </section>

            {/* ── 5. SUPPLY CHAIN ── */}
            <section id="supply" className="flex scroll-mt-16 flex-col gap-4 px-4 lg:px-6">
                <SectionHeader icon={Boxes} title="Supply Chain" sub="Suppliers, dependencies & flow map" />
                <SuppliersPanel suppliers={eco.suppliers} />
                <MermaidCard title="Supply Chain Map" description="Suppliers → company → distribution → customers" code={eco.supply_chain_mermaid} accent="bg-sky-100 text-sky-600" />
            </section>

            {/* ── 6. FORECAST ── */}
            <section id="forecast" className="flex scroll-mt-16 flex-col gap-4 px-4 lg:px-6">
                <SectionHeader icon={LineChart} title="Forecast" sub="Financial projection & opportunities" />
                <FinancialProjectionChart data={eco.financial_projection} />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <MarketShareChart title="Revenue Mix" description="Segment contribution" data={eco.sector_breakdown} />
                    <OpportunitiesPanel opportunities={eco.opportunities} />
                </div>
            </section>

            {/* ── 7. STRATEGY ── */}
            <section id="strategy" className="flex scroll-mt-16 flex-col gap-4 px-4 lg:px-6">
                <SectionHeader icon={Compass} title="Strategy" sub="Vanguard long-term playbook" />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <VanguardCard data={data} />
                    <OpportunitiesPanel opportunities={eco.opportunities} />
                </div>
            </section>
        </div>
    );
}
