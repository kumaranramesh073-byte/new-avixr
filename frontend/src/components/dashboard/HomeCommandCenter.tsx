import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
    Play, Activity, Brain, Globe, Shield, BarChart3,
    Users, Sparkles, Heart, RotateCcw, ArrowRight,
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════════════════
   HomeCommandCenter — SPATIAL AI Operating System canvas.
   The OCT Engine sits at the center; signals are floating objects orbiting
   it, connected by signal-flow lines. Hover a signal → Signal → Impact →
   Recommendation. Activation plays a living "thinking" sequence.
   (Reuses the existing glass / blue / shadow design language — unchanged.)
   ════════════════════════════════════════════════════════════════════════ */

interface DNA {
    companyName?: string;
    industry?: string;
    primaryMarkets?: string[];
    riskAppetite?: string;
    aiPriority?: string;
    annualRevenue?: string;
    monthlyRevenue?: string;
    teamSize?: string;
    customerType?: string;
    goals?: string[];
}

export interface LatestSimulationSummary {
    market_score?: number | null;
    competitor_threat?: number | null;
    volatility_index?: number | null;
    created_at?: string;
}

type Phase = 'idle' | 'running';

interface Signal {
    key: string;
    icon: React.ReactNode;
    label: string;
    value: string;
    accent: string;
    status: 'live' | 'healthy' | 'watch';
    impact: string;
    recommendation: string;
    stage: string;   // shown during the "thinking" sequence
    angle: number;   // position around the orb (degrees)
    depth: number;   // 0 = front (larger), 1 = back (smaller)
}

const STATUS_DOT: Record<Signal['status'], string> = {
    live: '#2563EB', healthy: '#16A34A', watch: '#D97706',
};

// running order = the order the engine "thinks" through them
const ORDER = ['twin', 'market', 'competitor', 'risk', 'opportunity', 'financial', 'customer', 'ai'];

const RX = 40, RY = 34; // ellipse radii in %

export default function HomeCommandCenter({
    dna, userName, onRun, onResetDNA, phase = 'idle', latestSimulation = null,
}: {
    dna: DNA; userName?: string; onRun: () => void; onResetDNA?: () => void; phase?: Phase; latestSimulation?: LatestSimulationSummary | null;
}) {
    const reduce = useReducedMotion();
    const [now, setNow] = useState(new Date());
    // Single source of truth for the hover tooltip: the hovered card id + the
    // card's viewport rect (captured at hover time). Only one tooltip is ever
    // mounted, driven entirely by `hover`.
    const [hover, setHover] = useState<string | null>(null);
    const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
    const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const [stageIdx, setStageIdx] = useState(0);

    // Open/close helpers — keep `hover` and `hoverRect` consistent.
    const openTip = (key: string) => {
        const el = cardRefs.current[key];
        if (el) setHoverRect(el.getBoundingClientRect());
        setHover(key);
    };
    const closeTip = (key?: string) => setHover(h => (key && h !== key ? h : null));

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(t);
    }, []);

    // The captured rect goes stale on scroll/resize — clear the tooltip so it
    // never lingers in the wrong place.
    useEffect(() => {
        if (!hover) return;
        const clear = () => setHover(null);
        window.addEventListener('scroll', clear, true);
        window.addEventListener('resize', clear);
        return () => {
            window.removeEventListener('scroll', clear, true);
            window.removeEventListener('resize', clear);
        };
    }, [hover]);

    // While the engine is running, no tooltips.
    useEffect(() => { if (phase === 'running') setHover(null); }, [phase]);

    // Drive the living simulation sequence while running.
    useEffect(() => {
        if (phase !== 'running') { setStageIdx(0); return; }
        const t = setInterval(() => setStageIdx(i => (i + 1) % ORDER.length), 1000);
        return () => clearInterval(t);
    }, [phase]);

    const hasSim = !!latestSimulation;

    const signals: Signal[] = useMemo(() => [
        { key: 'twin', icon: <Activity size={16} />, label: 'Business Twin', value: dna.industry || 'Configured', accent: '#16A34A', status: 'healthy',
          impact: `Sector context: ${dna.industry || 'Pending'} (${dna.teamSize || 'Team N/A'})`, recommendation: 'Run OCT Simulation to generate twin scenario', stage: 'Initializing Business Twin', angle: 115, depth: 0 },
        { key: 'ai', icon: <Brain size={16} />, label: 'Simulation Score', value: latestSimulation?.market_score != null ? `${Math.round(latestSimulation.market_score)}/100` : (dna.aiPriority || 'Ready'), accent: '#2563EB', status: hasSim ? 'watch' : 'healthy',
          impact: hasSim ? 'Last AI simulation composite market score (SIMULATION)' : `AI focus: ${dna.aiPriority || 'Balanced'}`, recommendation: 'Run OCT Simulation for updated AI scoring', stage: 'Producing Recommendations', angle: 65, depth: 1 },
        { key: 'market', icon: <Globe size={16} />, label: 'Primary Market', value: dna.primaryMarkets?.[0] || 'Global', accent: '#2563EB', status: 'healthy',
          impact: `Target markets: ${dna.primaryMarkets?.join(', ') || 'Not specified'}`, recommendation: 'Review Market Intel module for grounded sources', stage: 'Analyzing Market Conditions', angle: 162, depth: 0 },
        { key: 'competitor', icon: <Users size={16} />, label: 'Threat Index (Sim)', value: latestSimulation?.competitor_threat != null ? `${Math.round(latestSimulation.competitor_threat)}/100` : 'Not simulated', accent: '#DC2626', status: 'watch',
          impact: hasSim ? 'Simulated competitor threat level from last OCT run' : 'No simulation executed yet', recommendation: 'Run OCT Simulation to assess competitor pressure', stage: 'Loading Competitor Intelligence', angle: 18, depth: 1 },
        { key: 'financial', icon: <BarChart3 size={16} />, label: 'Revenue Baseline', value: dna.monthlyRevenue || dna.annualRevenue || 'Not set', accent: '#0EA5E9', status: 'healthy',
          impact: `Reported DNA scale: ${dna.annualRevenue || 'Unconfigured'}`, recommendation: 'Update Business DNA in Settings as metrics change', stage: 'Building Strategic Outcomes', angle: 205, depth: 1 },
        { key: 'risk', icon: <Shield size={16} />, label: 'Volatility (Sim)', value: latestSimulation?.volatility_index != null ? `${Math.round(latestSimulation.volatility_index)}/100` : (dna.riskAppetite || 'Not set'), accent: '#D97706', status: 'watch',
          impact: hasSim ? 'Simulated volatility index (not live market feed)' : `Configured risk appetite: ${dna.riskAppetite || 'Pending'}`, recommendation: 'Inspect Risk Center for scenario stress-tests', stage: 'Calculating Risk Exposure', angle: 335, depth: 0 },
        { key: 'opportunity', icon: <Sparkles size={16} />, label: 'Strategic Goal', value: dna.goals?.[0] || 'Growth', accent: '#7C3AED', status: 'healthy',
          impact: `DNA objectives: ${dna.goals?.join(', ') || 'None selected'}`, recommendation: 'Align simulations with top strategic goal', stage: 'Generating Ripple Effects', angle: 240, depth: 1 },
        { key: 'customer', icon: <Heart size={16} />, label: 'Customer Segment', value: dna.customerType || 'Not set', accent: '#16A34A', status: 'healthy',
          impact: `Configured model: ${dna.customerType || 'Pending'}`, recommendation: 'Check Customer Sentiment module for analysis', stage: 'Reading Customer Sentiment', angle: 300, depth: 0 },
    ], [dna, hasSim, latestSimulation]);

    const pos = (angle: number) => {
        const r = (angle * Math.PI) / 180;
        return { x: 50 + RX * Math.cos(r), y: 50 - RY * Math.sin(r) };
    };

    const running = phase === 'running';
    const activeKey = running ? ORDER[stageIdx] : null;
    const activeSignal = signals.find(s => s.key === activeKey);
    const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

    // Tooltip target + fixed-viewport position with edge collision handling:
    // clamp horizontally so right-edge cards never clip, flip above when the
    // default position below would overflow the bottom.
    const hoveredSignal = hover ? signals.find(s => s.key === hover) : undefined;
    const tipStyle = useMemo<{ left: number; top: number } | null>(() => {
        if (!hoverRect) return null;
        const W = 240, H = 156, M = 10, GAP = 10;
        const vw = window.innerWidth, vh = window.innerHeight;
        let left = hoverRect.left + hoverRect.width / 2 - W / 2;
        left = Math.max(M, Math.min(left, vw - W - M));
        let top = hoverRect.bottom + GAP;                 // default: below the card
        if (top + H > vh - M) top = hoverRect.top - GAP - H; // flip above if it would overflow
        top = Math.max(M, top);
        return { left, top };
    }, [hoverRect]);

    return (
        <div className="relative h-full min-h-[640px] w-full overflow-hidden" style={{ fontFamily: 'var(--font-primary)' }}>
            {/* ── Header ── */}
            <div className="absolute inset-x-0 top-0 z-40 flex items-start justify-between px-6 pt-5 lg:px-9">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {greeting}, {userName || 'Operator'}
                    </div>
                    <h1 className="mt-1 text-[22px] font-bold tracking-tight text-slate-900 lg:text-[26px]">
                        {dna.companyName || 'Your Business'}{' '}
                        <span className="font-semibold text-slate-400">{running ? 'is thinking…' : 'is alive.'}</span>
                    </h1>
                </div>
                <div className="hidden items-center gap-3 sm:flex">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(15,23,42,0.07)] bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-glass backdrop-blur-xl">
                        <span className="size-1.5 rounded-full" style={{ background: running ? '#2563EB' : '#16A34A', boxShadow: `0 0 0 3px ${running ? 'rgba(37,99,235,0.16)' : 'rgba(22,163,74,0.16)'}` }} />
                        {running ? 'OCT Engine · simulating' : 'All systems nominal · 4 agents ready'}
                    </div>
                    <div className="text-right">
                        <div className="text-[15px] font-bold tabular-nums text-slate-900">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[10px] text-slate-400">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                    </div>
                </div>
            </div>

            {/* ── Spatial field ── */}
            <div className="absolute inset-0">
                {/* ════════════════════════════════════════════════════════════
                    DECORATIVE BACKGROUND LAYER (z-1) — ambient "intelligence"
                    only. Soft, controlled, never competes with real content.
                    Purely decorative: no pointer events, not focusable, hidden
                    from assistive tech. The diagonal connection lines and the
                    travelling pulses are suppressed on small screens; only the
                    gentle radial glow + ripple survive on mobile.
                   ════════════════════════════════════════════════════════════ */}
                <div className="pointer-events-none absolute inset-0 z-[1] select-none overflow-hidden" aria-hidden="true">
                    {/* Ambient intelligence haze — glow + ripple, blurred so it
                        can never read as duplicate UI / readable text. */}
                    <div className="absolute inset-0" style={{ filter: 'blur(1px)' }}>
                        {/* Soft ambient core glow (kept on every breakpoint) */}
                        <div
                            className="signal-soft-pulse absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                            style={{ width: 460, height: 460, background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)' }}
                        />

                        {/* Ripple rings from the orb — soft, slow breathing */}
                        {!reduce && [0, 1, 2].map(i => (
                            <motion.span
                                key={i}
                                className="absolute left-1/2 top-1/2 rounded-full border"
                                style={{ borderColor: 'rgba(59,130,246,0.16)', width: 200, height: 200, marginLeft: -100, marginTop: -100 }}
                                animate={{ scale: [0.55, running ? 2.6 : 2.1], opacity: [running ? 0.22 : 0.12, 0] }}
                                transition={{ duration: running ? 2.6 : 4.2, repeat: Infinity, ease: 'easeOut', delay: i * (running ? 0.9 : 1.4) }}
                            />
                        ))}
                    </div>

                    {/* Connection lines (orb ↔ signal) — subtle dashed data-signal
                        paths, desktop only. Brighten slightly for the hovered /
                        active card; never heavy neon. */}
                    <svg className="absolute inset-0 hidden h-full w-full sm:block" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {signals.map(s => {
                            const p = pos(s.angle);
                            const isActive = activeKey === s.key;
                            const isHover = hover === s.key && !running;
                            const lit = isActive || isHover;
                            return (
                                <line key={s.key} x1={50} y1={50} x2={p.x} y2={p.y}
                                    className={reduce ? undefined : 'signal-flow-line'}
                                    stroke={lit ? s.accent : '#1E3A5F'}
                                    strokeWidth={lit ? 0.34 : 0.26}
                                    strokeOpacity={lit ? 0.26 : running ? 0.1 : 0.12}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke 0.4s, stroke-opacity 0.4s, stroke-width 0.4s' }}
                                />
                            );
                        })}
                    </svg>

                    {/* Signal-flow pulses (node → orb) — only while the engine is
                        actively thinking, desktop only. Removed in idle to kill
                        the constant background blinking. */}
                    {!reduce && running && signals.map(s => {
                        const p = pos(s.angle);
                        const isActive = activeKey === s.key;
                        if (!isActive) return null;
                        return (
                            <motion.span
                                key={s.key}
                                className="absolute hidden size-1.5 rounded-full sm:block"
                                style={{ background: s.accent, boxShadow: `0 0 8px ${s.accent}`, marginLeft: -3, marginTop: -3 }}
                                initial={false}
                                animate={{ left: [`${p.x}%`, '50%'], top: [`${p.y}%`, '50%'], opacity: [0, 0.85, 0], scale: [0.8, 1.3, 0.8] }}
                                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeIn' }}
                            />
                        );
                    })}
                </div>

                {/* Signal objects — REAL dashboard content (z-20, above the
                    decorative layer so they are always sharp and readable) */}
                {signals.map(s => {
                    const p = pos(s.angle);
                    const isActive = activeKey === s.key;
                    const dim = running && !isActive;
                    return (
                        <div key={s.key} className="absolute z-20" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}>
                            <motion.button
                                ref={(el: HTMLButtonElement | null) => { cardRefs.current[s.key] = el; }}
                                onHoverStart={() => !running && openTip(s.key)}
                                onHoverEnd={() => closeTip(s.key)}
                                onFocus={() => !running && openTip(s.key)}
                                onBlur={() => closeTip(s.key)}
                                onClick={() => !running && (hover === s.key ? closeTip() : openTip(s.key))}
                                whileHover={running ? undefined : { scale: 1.045 }}
                                animate={reduce ? {} : { y: [0, s.depth ? -5 : -8, 0], opacity: dim ? 0.45 : 1, scale: isActive ? 1.06 : 1 }}
                                transition={reduce ? {} : { y: { duration: 5 + s.depth * 1.5, repeat: Infinity, ease: 'easeInOut', delay: s.angle / 90 }, opacity: { duration: 0.4 }, scale: { duration: 0.4 } }}
                                className="glass-edge group relative flex w-[150px] flex-col gap-1.5 rounded-2xl border border-[rgba(15,23,42,0.07)] bg-white/70 px-3.5 py-3 text-left shadow-glass backdrop-blur-xl transition-shadow duration-300 hover:shadow-glass-xl focus:outline-none"
                                style={{ transformOrigin: 'center', boxShadow: isActive ? `0 12px 36px ${s.accent}33, 0 0 0 1px ${s.accent}40` : undefined }}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="flex size-7 items-center justify-center rounded-lg" style={{ background: `${s.accent}14`, color: s.accent, border: `1px solid ${s.accent}26` }}>
                                        {s.icon}
                                    </span>
                                    <span className="size-1.5 rounded-full" style={{ background: STATUS_DOT[s.status], boxShadow: s.status === 'live' ? `0 0 0 3px ${STATUS_DOT[s.status]}22` : undefined }} />
                                </div>
                                <div className="text-[11px] font-medium leading-tight text-slate-500">{s.label}</div>
                                <div className="text-[18px] font-bold tracking-tight tabular-nums text-slate-900">{s.value}</div>
                            </motion.button>
                        </div>
                    );
                })}

                {/* ── OCT Engine core ── (z-30: visually dominant, above all) */}
                <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
                    <OrbCore phase={phase} stage={activeSignal?.stage} step={stageIdx} total={ORDER.length} onRun={onRun} reduce={!!reduce} />
                </div>
            </div>

            {/* ── Footer caption ── */}
            <div className="absolute inset-x-0 bottom-0 z-40 flex flex-col items-center gap-3 px-6 pb-5">
                {running ? (
                    <div className="flex items-center gap-1.5">
                        {ORDER.map((_, i) => (
                            <span key={i} className="h-1 rounded-full transition-all duration-300"
                                style={{ width: i === stageIdx ? 22 : 7, background: i <= stageIdx ? '#2563EB' : 'rgba(15,23,42,0.12)' }} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {[dna.industry, dna.primaryMarkets?.[0] || 'Global', dna.riskAppetite, dna.aiPriority].filter(Boolean).map(t => (
                            <span key={t} className="rounded-full border border-[rgba(15,23,42,0.07)] bg-white/60 px-2.5 py-1 text-[10.5px] font-medium text-slate-500 backdrop-blur">{t}</span>
                        ))}
                        {onResetDNA && (
                            <button onClick={onResetDNA} className="rounded-full border border-[rgba(15,23,42,0.07)] px-2.5 py-1 text-[10.5px] font-medium text-slate-400 transition-colors hover:text-blue-600">
                                <RotateCcw size={10} className="mr-1 inline" />Edit DNA
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── Hover detail tooltip ── single instance, portalled to <body>
                so it never inherits the cards' float / scale / dim transforms.
                Fixed-positioned from the hovered card's rect, edge-collision
                aware, fully opaque, pointer-events-none, and unmounted cleanly
                via AnimatePresence (unique key per card → no stale ghosts). */}
            {createPortal(
                <AnimatePresence>
                    {hoveredSignal && tipStyle && !running && (
                        <motion.div
                            key={hoveredSignal.key}
                            initial={{ opacity: 0, y: 6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.97 }}
                            transition={{ duration: 0.16, ease: 'easeOut' }}
                            className="glass-edge pointer-events-none fixed z-[60] w-[240px] rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/95 p-3.5 shadow-glass-xl backdrop-blur-2xl"
                            style={{ left: tipStyle.left, top: tipStyle.top, fontFamily: 'var(--font-primary)' }}
                        >
                            <div className="mb-2 flex items-center gap-2">
                                <span className="flex size-6 items-center justify-center rounded-lg" style={{ background: `${hoveredSignal.accent}14`, color: hoveredSignal.accent }}>{hoveredSignal.icon}</span>
                                <span className="text-[12px] font-semibold text-slate-900">{hoveredSignal.label}</span>
                                <span className="ml-auto text-[12px] font-bold tabular-nums" style={{ color: hoveredSignal.accent }}>{hoveredSignal.value}</span>
                            </div>
                            <Flow label="Impact" text={hoveredSignal.impact} />
                            <Flow label="Recommendation" text={hoveredSignal.recommendation} accent={hoveredSignal.accent} />
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body,
            )}
        </div>
    );
}

function Flow({ label, text, accent }: { label: string; text: string; accent?: string }) {
    return (
        <div className="flex items-start gap-1.5 py-1">
            <ArrowRight size={12} className="mt-0.5 shrink-0" style={{ color: accent || '#94A3B8' }} />
            <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
                <div className="text-[12px] leading-snug text-slate-700">{text}</div>
            </div>
        </div>
    );
}

function OrbCore({ phase, stage, step, total, onRun, reduce }: {
    phase: Phase; stage?: string; step: number; total: number; onRun: () => void; reduce: boolean;
}) {
    const running = phase === 'running';
    return (
        <div className="relative flex flex-col items-center">
            {/* breathing halo */}
            {!reduce && (
                <motion.div
                    animate={{ scale: [1, running ? 1.16 : 1.09, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ repeat: Infinity, duration: running ? 2.2 : 3.4, ease: 'easeInOut' }}
                    className="pointer-events-none absolute left-1/2 top-[88px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ width: 260, height: 260, background: 'radial-gradient(circle, rgba(59,130,246,0.30), transparent 68%)' }}
                />
            )}
            <motion.button
                onClick={running ? undefined : onRun}
                whileHover={running ? undefined : { scale: 1.04 }}
                whileTap={running ? undefined : { scale: 0.97 }}
                animate={reduce ? {} : running ? { scale: [1, 1.04, 1] } : { scale: [1, 1.035, 1] }}
                transition={reduce ? {} : { repeat: Infinity, duration: running ? 1.6 : 4.6, ease: 'easeInOut' }}
                disabled={running}
                className="glass-shimmer relative z-10 flex size-[176px] flex-col items-center justify-center gap-2 rounded-full"
                style={{
                    background: 'radial-gradient(circle at 35% 28%, #93C5FD 0%, #3B82F6 46%, #1D4ED8 100%)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    boxShadow: '0 14px 48px rgba(59,130,246,0.45), inset 0 2px 10px rgba(255,255,255,0.4)',
                    cursor: running ? 'default' : 'pointer',
                }}
            >
                {/* glass inner orb layer — top-left sheen + crisp glass rim */}
                <span
                    className="pointer-events-none absolute inset-[9px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle at 32% 24%, rgba(255,255,255,0.55), rgba(255,255,255,0) 56%)',
                        border: '1px solid rgba(255,255,255,0.22)',
                        boxShadow: 'inset 0 1px 6px rgba(255,255,255,0.35)',
                    }}
                />

                {/* rotating ring while thinking */}
                {running && !reduce && (
                    <motion.span
                        className="pointer-events-none absolute inset-1 rounded-full"
                        style={{ border: '2px solid transparent', borderTopColor: 'rgba(255,255,255,0.85)' }}
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                    />
                )}
                {running ? (
                    <div className="px-4 text-center">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75">Thinking</div>
                        <div className="mt-0.5 text-[10px] font-medium tabular-nums text-white/60">{step + 1} / {total}</div>
                    </div>
                ) : (
                    <>
                        <Play size={30} color="#fff" fill="#fff" style={{ marginLeft: 3, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' }} />
                        <div className="text-center">
                            <div className="text-[15px] font-extrabold text-white">Run OCT</div>
                            <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/80">Simulation</div>
                        </div>
                    </>
                )}
            </motion.button>

            {/* caption / live thinking text */}
            <div className="mt-6 h-10 text-center">
                <AnimatePresence mode="wait">
                    {running ? (
                        <motion.div key={stage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                            <div className="text-[13px] font-semibold text-slate-800">{stage}</div>
                            <div className="mt-0.5 text-[11px] text-slate-400">The system is reasoning across your signals…</div>
                        </motion.div>
                    ) : (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="text-[13px] font-semibold text-slate-700">5 business signals changed overnight.</div>
                            <div className="mt-0.5 text-[11.5px] text-slate-400">Run OCT to see today’s best decision path.</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
