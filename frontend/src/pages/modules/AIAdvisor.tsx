import { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis, BarChart, Bar } from 'recharts';
import { ModuleDashboard } from '../../components/module/ModuleDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Package, DollarSign, Scale, Globe, Leaf, TrendingUp, ShieldAlert, BarChart2, Cpu, Layers, X, Check, Sparkles, GitCompare, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import type { BusinessDNA } from '../../store/authStore';

// ─── Agent icon map ──────────────────────────────────────────────────────────
const AGENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bar: string; dot: string }> = {
    'Supply Chain Agent': { icon: Package,    color: 'bg-orange-100 text-orange-500',  bar: 'bg-yellow-400',   dot: 'bg-green-400' },
    'Finance Agent':      { icon: DollarSign, color: 'bg-emerald-100 text-emerald-500', bar: 'bg-emerald-400', dot: 'bg-green-400' },
    'Legal Agent':        { icon: Scale,      color: 'bg-purple-100 text-purple-500',  bar: 'bg-purple-400',   dot: 'bg-gray-400'  },
    'Geopolitical Agent': { icon: Globe,      color: 'bg-red-100 text-red-500',        bar: 'bg-red-400',      dot: 'bg-yellow-400' },
    'Sustainability Agent':{ icon: Leaf,      color: 'bg-teal-100 text-teal-500',      bar: 'bg-teal-400',     dot: 'bg-green-400' },
};

function MultiAgentStatus({ agents }: { agents: Array<{ name: string; category: string; confidence: number; status?: string }> }) {
    return (
        <div className="px-4 lg:px-6">
            <div className="mb-3 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100">
                    <Cpu size={15} className="text-blue-600" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-foreground">Multi-Agent System Status</h3>
                    <p className="text-xs text-muted-foreground">Live confidence readings from all intelligence agents</p>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {agents.map((agent, i) => {
                    const cfg = AGENT_CONFIG[agent.name] ?? {
                        icon: BrainCircuit,
                        color: 'bg-slate-100 text-slate-500',
                        bar: 'bg-slate-400',
                        dot: 'bg-green-400',
                    };
                    const Icon = cfg.icon;
                    return (
                        <Card key={i} className="relative overflow-hidden">
                            <CardContent className="p-4">
                                <div className="absolute right-3 top-3 size-2 rounded-full" style={{}} >
                                    <span className={`block size-2 rounded-full ${cfg.dot}`} />
                                </div>
                                <div className={`mb-3 flex size-10 items-center justify-center rounded-xl ${cfg.color}`}>
                                    <Icon size={18} />
                                </div>
                                <div className="mb-0.5 text-sm font-bold leading-tight text-foreground">{agent.name}</div>
                                <div className="mb-3 text-[11px] text-muted-foreground">{agent.category}</div>
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                                    <span>Confidence</span>
                                    <span className="font-semibold tabular-nums text-foreground">{agent.confidence}%</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${agent.confidence}%` }} />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Architecture diagram ────────────────────────────────────────────────────
const ARCH_SUB_AGENTS = [
    { label: 'Forecasting\nAgent',   icon: TrendingUp,  color: 'border-blue-300 bg-blue-50 text-blue-700' },
    { label: 'Risk Center\nAgent',   icon: ShieldAlert, color: 'border-red-300 bg-red-50 text-red-700' },
    { label: 'Market Intel\nAgent',  icon: BarChart2,   color: 'border-amber-300 bg-amber-50 text-amber-700' },
    { label: 'Financial\nAgent',     icon: DollarSign,  color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
    { label: 'Digital Twin\nAgent',  icon: Cpu,         color: 'border-purple-300 bg-purple-50 text-purple-700' },
];

function SystemArchitecture() {
    return (
        <div className="px-4 lg:px-6">
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-violet-100">
                            <Layers size={15} className="text-violet-600" />
                        </div>
                        <div>
                            <CardTitle className="text-base">AI Advisory Architecture</CardTitle>
                            <CardDescription className="text-xs">Intelligence hierarchy & execution pipeline</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center gap-0 py-2">
                        {/* Chief Strategy AI */}
                        <div className="flex items-center justify-center rounded-xl border-2 border-violet-300 bg-violet-50 px-6 py-3 shadow-sm">
                            <div className="text-center">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-violet-400">AI ADVISOR</div>
                                <div className="text-sm font-black text-violet-700">Chief Strategy AI</div>
                            </div>
                        </div>

                        {/* Connector line */}
                        <div className="flex h-6 w-px bg-border" />

                        {/* Sub-agents */}
                        <div className="relative w-full">
                            {/* Horizontal line spanning all agents */}
                            <div className="absolute left-[10%] right-[10%] top-0 h-px bg-border" />
                            <div className="grid grid-cols-5 gap-2 pt-0">
                                {ARCH_SUB_AGENTS.map((a, i) => {
                                    const Icon = a.icon;
                                    return (
                                        <div key={i} className="flex flex-col items-center gap-0">
                                            <div className="h-6 w-px bg-border" />
                                            <div className={`flex w-full flex-col items-center rounded-xl border px-2 py-2 text-center ${a.color}`}>
                                                <Icon size={14} className="mb-1" />
                                                {a.label.split('\n').map((ln, j) => (
                                                    <span key={j} className="block text-[11px] font-semibold leading-tight">{ln}</span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Merge line */}
                        <div className="relative w-full">
                            <div className="absolute left-[10%] right-[10%] top-0 h-px bg-border" />
                            <div className="flex h-6 items-end justify-center">
                                <div className="h-6 w-px bg-border" />
                            </div>
                        </div>

                        {/* Pipeline layers */}
                        {[
                            { label: 'OCT Simulation Engine',    color: 'border-sky-300 bg-sky-50 text-sky-700' },
                            { label: 'Decision Intelligence Layer', color: 'border-indigo-300 bg-indigo-50 text-indigo-700' },
                            { label: 'Dashboard + Alerts + APIs', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
                        ].map((layer, i) => (
                            <div key={i} className="flex flex-col items-center gap-0 w-full max-w-xs">
                                <div className={`w-full rounded-xl border px-4 py-2.5 text-center ${layer.color}`}>
                                    <span className="text-xs font-bold">{layer.label}</span>
                                </div>
                                {i < 2 && <div className="h-5 w-px bg-border" />}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Decision Simulation Comparison ─────────────────────────────────────────
interface DecisionScenario {
    name: string;
    revenue_impact: string;
    risk_index: number;
    market_share: string;
    status: 'not_recommended' | 'recommended' | 'optimal';
    note?: string;
}

const DECISION_STATUS = {
    not_recommended: {
        border: 'border-red-500/50',
        ring: 'ring-red-500/10',
        icon: X,
        iconColor: 'text-red-500',
        badgeBorder: 'border-red-500/40',
        badgeText: 'text-red-500',
        badgeBg: 'bg-red-500/5',
        label: 'NOT RECOMMENDED',
    },
    recommended: {
        border: 'border-amber-500/50',
        ring: 'ring-amber-500/10',
        icon: Check,
        iconColor: 'text-amber-500',
        badgeBorder: 'border-amber-500/40',
        badgeText: 'text-amber-500',
        badgeBg: 'bg-amber-500/5',
        label: 'RECOMMENDED',
    },
    optimal: {
        border: 'border-emerald-500/70',
        ring: 'ring-emerald-500/15',
        icon: Sparkles,
        iconColor: 'text-emerald-500',
        badgeBorder: 'border-emerald-500/50',
        badgeText: 'text-emerald-600',
        badgeBg: 'bg-emerald-500/5',
        label: 'OPTIMAL STRATEGY',
    },
};

function DecisionSimulationComparison({ scenarios }: { scenarios: DecisionScenario[] }) {
    return (
        <div className="px-4 lg:px-6">
            <div className="mb-4 flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                        <GitCompare size={15} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Decision Simulation Comparison</h3>
                        <p className="text-xs text-muted-foreground">AI-ranked strategic options side by side</p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {scenarios.map((s, i) => {
                    const cfg = DECISION_STATUS[s.status] ?? DECISION_STATUS.recommended;
                    const Icon = cfg.icon;
                    const revenueUp = s.revenue_impact.trim().startsWith('+');
                    const revenueNeg = s.revenue_impact.trim().startsWith('-');
                    const riskColor = s.risk_index > 65 ? 'bg-red-500' : s.risk_index > 40 ? 'bg-amber-400' : 'bg-emerald-500';
                    return (
                        <Card key={i} className={`border-2 ${cfg.border} ring-2 ${cfg.ring} flex flex-col gap-0 overflow-hidden`}>
                            <CardContent className="flex flex-col gap-4 p-5">
                                {/* Title row */}
                                <div className="flex items-start justify-between">
                                    <span className="text-base font-black text-foreground">{s.name}</span>
                                    <Icon size={20} className={cfg.iconColor} />
                                </div>

                                {/* Revenue Impact */}
                                <div>
                                    <div className="text-xs text-muted-foreground mb-0.5">Revenue Impact:</div>
                                    <div className={`text-3xl font-black ${revenueUp ? 'text-emerald-600 dark:text-emerald-400' : revenueNeg ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                                        {s.revenue_impact}
                                    </div>
                                </div>

                                {/* Risk Index */}
                                <div>
                                    <div className="text-xs text-muted-foreground mb-2">Risk Index:</div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                            <div className={`h-full rounded-full ${riskColor}`} style={{ width: `${s.risk_index}%` }} />
                                        </div>
                                        <span className="text-sm font-bold text-foreground tabular-nums w-6 text-right">{s.risk_index}</span>
                                    </div>
                                </div>

                                {/* Market Share */}
                                <div>
                                    <div className="text-xs text-muted-foreground mb-0.5">Market Share:</div>
                                    <div className={`text-sm font-bold ${s.market_share.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : s.market_share.startsWith('-') ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                                        {s.market_share}
                                    </div>
                                </div>

                                {s.note && (
                                    <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-3">
                                        {s.note}
                                    </p>
                                )}

                                {/* Badge */}
                                <div className="mt-auto pt-1">
                                    <div className={`rounded-lg border ${cfg.badgeBorder} ${cfg.badgeBg} ${cfg.badgeText} px-3 py-2 text-[11px] font-bold tracking-widest text-center`}>
                                        {cfg.label}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Extra charts (existing + new) ───────────────────────────────────────────
function AIAdvisorCharts(charts: Record<string, any>) {
    const priorityMatrix = charts.priority_matrix || [];
    const crossModuleConflicts = charts.cross_module_conflicts || [];
    const agentStatus: Array<{ name: string; category: string; confidence: number }> = charts.agent_status || [
        { name: 'Supply Chain Agent', category: 'Supply Chain', confidence: 87 },
        { name: 'Finance Agent',      category: 'Finance',      confidence: 92 },
        { name: 'Legal Agent',        category: 'Legal',        confidence: 85 },
        { name: 'Geopolitical Agent', category: 'Geo',          confidence: 79 },
        { name: 'Sustainability Agent', category: 'Sustainability', confidence: 88 },
    ];
    const decisionScenarios: DecisionScenario[] = charts.decision_comparison || [
        { name: 'Do Nothing',        revenue_impact: '-12%', risk_index: 72, market_share: '-5%',    status: 'not_recommended', note: 'Status quo accelerates market share erosion and cash burn' },
        { name: 'Diversify Supply',  revenue_impact: '+4%',  risk_index: 50, market_share: 'Stable', status: 'recommended',     note: 'Reduces single-supplier dependency, stabilises margins' },
        { name: 'Recycling + India', revenue_impact: '+9%',  risk_index: 42, market_share: '+6%',    status: 'optimal',         note: 'Highest upside with manageable risk — execute in parallel tracks' },
    ];

    return (
        <div className="flex flex-col gap-5">
            {/* Multi-agent status (no outer padding — handled inside the component) */}
            <div className="-mx-4 lg:-mx-6">
                <MultiAgentStatus agents={agentStatus} />
            </div>

            {/* System Architecture */}
            <div className="-mx-4 lg:-mx-6">
                <SystemArchitecture />
            </div>

            {/* Decision Simulation Comparison */}
            <div className="-mx-4 lg:-mx-6">
                <DecisionSimulationComparison scenarios={decisionScenarios} />
            </div>

            {/* Existing charts */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Strategic Priority Matrix</CardTitle>
                        <CardDescription className="text-xs">Initiative Impact vs Effort</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis type="number" dataKey="effort" name="Effort" domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Effort', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#64748b' }} />
                                    <YAxis type="number" dataKey="impact" name="Impact" domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Impact', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#64748b' }} />
                                    <ZAxis type="category" dataKey="initiative" name="Initiative" />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}
                                    />
                                    <Scatter name="Initiatives" data={priorityMatrix} fill="hsl(var(--primary))">
                                        {priorityMatrix.map((entry: any, index: number) => {
                                            let color = 'hsl(var(--primary))';
                                            if (entry.impact > 50 && entry.effort < 50) color = '#10b981';
                                            else if (entry.impact < 50 && entry.effort > 50) color = '#ef4444';
                                            else if (entry.impact < 50 && entry.effort < 50) color = '#94a3b8';
                                            return <Cell key={`cell-${index}`} fill={color} />;
                                        })}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Cross-Module Conflicts</CardTitle>
                        <CardDescription className="text-xs">Strategic tension severity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={crossModuleConflicts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis dataKey="conflict" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={150} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}
                                    />
                                    <Bar dataKey="severity" name="Severity Score" radius={[0, 4, 4, 0]} barSize={20}>
                                        {crossModuleConflicts.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.severity > 75 ? '#ef4444' : '#f59e0b'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// ─── MCQ Gate ────────────────────────────────────────────────────────────────

interface MCQQuestion {
    id: string;
    question: string;
    options: string[];
}

function getIndustryConcerns(industry: string): string[] {
    const i = industry.toLowerCase();
    if (i.includes('food') || i.includes('deliver'))   return ['Competitor pricing', 'Delivery costs', 'Customer retention', 'Regulation'];
    if (i.includes('finance') || i.includes('fintech')) return ['Regulatory compliance', 'Credit risk', 'Market volatility', 'Cybersecurity'];
    if (i.includes('saas') || i.includes('software'))  return ['Churn rate', 'CAC vs LTV', 'Product roadmap', 'Competition'];
    if (i.includes('retail') || i.includes('ecomm'))   return ['Inventory costs', 'Customer acquisition', 'Returns', 'Competition'];
    if (i.includes('health') || i.includes('medic'))   return ['Regulation', 'Data privacy', 'Talent shortage', 'Reimbursement'];
    return ['Competitive pressure', 'Cost management', 'Talent retention', 'Economic headwinds'];
}

function buildQuestions(dna: BusinessDNA): MCQQuestion[] {
    const company = dna.companyName;
    const goalOpts = (dna.goals ?? []).filter(Boolean).slice(0, 3);
    const focusOpts = goalOpts.length >= 2 ? goalOpts : ['Revenue growth', 'Cost reduction', 'Market expansion'];

    return [
        {
            id: 'focus',
            question: `What should the AI Advisor prioritise for ${company}?`,
            options: focusOpts,
        },
        {
            id: 'concern',
            question: 'What is your biggest concern right now?',
            options: getIndustryConcerns(dna.industry),
        },
        {
            id: 'horizon',
            question: 'What decision timeline matters most?',
            options: ['Next 30 days', 'Next 90 days', '6 months', '1 year'],
        },
        {
            id: 'output',
            question: 'What do you need most from this analysis?',
            options: ['Specific action plan', 'Risk deep-dive', 'Competitive strategy', 'Financial outlook'],
        },
    ];
}

function AdvisorMCQ({ dna, onComplete }: { dna: BusinessDNA; onComplete: (ctx: Record<string, string>) => void }) {
    const questions = buildQuestions(dna);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [otherOpen, setOtherOpen] = useState<string | null>(null);
    const [otherText, setOtherText] = useState<Record<string, string>>({});

    const pick = (qid: string, val: string) => {
        setAnswers(p => ({ ...p, [qid]: val }));
        if (otherOpen === qid) setOtherOpen(null);
    };

    const pickOther = (qid: string) => {
        setOtherOpen(qid);
        setAnswers(p => ({ ...p, [qid]: otherText[qid] || '' }));
    };

    const setOther = (qid: string, val: string) => {
        setOtherText(p => ({ ...p, [qid]: val }));
        setAnswers(p => ({ ...p, [qid]: val }));
    };

    const allAnswered = questions.every(q => answers[q.id]?.trim());

    const handleAnalyze = () => {
        const ctx: Record<string, string> = {};
        questions.forEach(q => { if (answers[q.id]) ctx[`advisor_${q.id}`] = answers[q.id]; });
        ctx.advisorContext = questions
            .map(q => `${q.question.replace(/\?$/, '')}: ${answers[q.id] || ''}`)
            .filter(l => l.includes(': ') && !l.endsWith(': '))
            .join(' | ');
        onComplete(ctx);
    };

    return (
        <div className="flex min-h-full flex-col items-center justify-center bg-[#f8fafc] px-4 py-12">
            {/* Header */}
            <div className="mb-8 flex flex-col items-center gap-2 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-purple-100">
                    <BrainCircuit size={26} className="text-purple-600" />
                </div>
                <h1 className="text-xl font-black tracking-tight text-foreground">AI Advisor</h1>
                <p className="text-sm text-muted-foreground">
                    Answer {questions.length} quick questions so the AI can focus on what matters to <span className="font-semibold text-foreground">{dna.companyName}</span>.
                </p>
            </div>

            {/* Questions */}
            <div className="flex w-full max-w-xl flex-col gap-5">
                {questions.map((q, qi) => {
                    const answered = !!answers[q.id]?.trim();
                    return (
                        <Card key={q.id} className={`transition-all ${answered ? 'border-purple-200 shadow-sm' : ''}`}>
                            <CardContent className="p-4">
                                <div className="mb-3 flex items-start gap-2">
                                    <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${answered ? 'bg-purple-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                                        {answered ? <Check size={12} /> : qi + 1}
                                    </span>
                                    <span className="text-sm font-semibold text-foreground leading-snug">{q.question}</span>
                                </div>

                                <div className="flex flex-wrap gap-2 pl-8">
                                    {q.options.map(opt => {
                                        const selected = answers[q.id] === opt;
                                        return (
                                            <button key={opt} onClick={() => pick(q.id, opt)}
                                                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${selected
                                                    ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                                                    : 'border-border bg-card text-foreground hover:border-purple-300 hover:bg-purple-50/50'}`}>
                                                {opt}
                                            </button>
                                        );
                                    })}

                                    {/* Other option */}
                                    <button onClick={() => pickOther(q.id)}
                                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${otherOpen === q.id || (answers[q.id] && !q.options.includes(answers[q.id]))
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-dashed border-border bg-card text-muted-foreground hover:border-purple-300'}`}>
                                        + Other
                                    </button>
                                </div>

                                {/* Other text input */}
                                {otherOpen === q.id && (
                                    <div className="mt-3 pl-8">
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Type your answer…"
                                            value={otherText[q.id] || ''}
                                            onChange={e => setOther(q.id, e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && otherText[q.id]?.trim() && setOtherOpen(null)}
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200"
                                        />
                                        <p className="mt-1 text-[10px] text-muted-foreground">Press Enter to confirm</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}

                {/* CTA */}
                <button
                    onClick={handleAnalyze}
                    disabled={!allAnswered}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40">
                    <BrainCircuit size={16} />
                    Analyse {dna.companyName}
                    <ChevronRight size={16} />
                </button>

                <p className="text-center text-[11px] text-muted-foreground">
                    {Object.keys(answers).filter(k => answers[k]?.trim()).length} / {questions.length} answered
                </p>
            </div>
        </div>
    );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function AIAdvisor() {
    const businessDNA = useAuthStore(s => s.businessDNA);
    const [mcqDone, setMcqDone] = useState(false);
    const [mcqContext, setMcqContext] = useState<Record<string, string>>({});

    // Show MCQ gate when no analysis has been run yet.
    if (!mcqDone && businessDNA) {
        return (
            <AdvisorMCQ
                dna={businessDNA}
                onComplete={ctx => { setMcqContext(ctx); setMcqDone(true); }}
            />
        );
    }

    return (
        <ModuleDashboard
            moduleKey="advisor"
            title="AI Advisor"
            subtitle="Cross-module synthesis & CEO-level strategy"
            icon={BrainCircuit}
            accent="bg-purple-100 text-purple-600"
            extraCharts={AIAdvisorCharts}
            extraParams={mcqDone ? mcqContext : undefined}
        />
    );
}
