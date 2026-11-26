import * as React from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ════════════════════════════════════════════════════════════════════════
   SignalCard — executive "living signal" tile for the AI command center.
   White frosted glass · soft depth · blue accent · count-up · sparkline.
   ════════════════════════════════════════════════════════════════════════ */

export type SignalStatus = 'live' | 'healthy' | 'warning' | 'critical' | 'standby';

const STATUS: Record<SignalStatus, { dot: string; ring: string; label: string }> = {
    live:     { dot: '#2563EB', ring: 'rgba(37,99,235,0.16)',  label: 'Live' },
    healthy:  { dot: '#16A34A', ring: 'rgba(22,163,74,0.16)',  label: 'Healthy' },
    warning:  { dot: '#D97706', ring: 'rgba(217,119,6,0.16)',  label: 'Watch' },
    critical: { dot: '#DC2626', ring: 'rgba(220,38,38,0.16)',  label: 'Alert' },
    standby:  { dot: '#94A3B8', ring: 'rgba(148,163,184,0.16)', label: 'Standby' },
};

/** Animated count-up that triggers when the element scrolls into view. */
function useCountUp(target: number, durationMs = 1100, run = true) {
    const [val, setVal] = React.useState(0);
    React.useEffect(() => {
        if (!run) { setVal(target); return; }
        let raf = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / durationMs);
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            setVal(target * eased);
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, durationMs, run]);
    return val;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
    if (!data || data.length < 2) return null;
    const w = 72, h = 26;
    const min = Math.min(...data), max = Math.max(...data);
    const span = max - min || 1;
    const pts = data.map((d, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((d - min) / span) * (h - 4) - 2;
        return [x, y] as const;
    });
    const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const area = `${line} L${w},${h} L0,${h} Z`;
    const gid = React.useId();
    return (
        <svg width={w} height={h} className="overflow-visible">
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.20" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gid})`} />
            <path d={line} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.2} fill={color} />
        </svg>
    );
}

export interface SignalCardProps {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    unit?: string;
    /** signed percent, e.g. +4.2 or -1.8 */
    delta?: number;
    status?: SignalStatus;
    sparkline?: number[];
    /** accent color for icon + sparkline */
    accent?: string;
    decimals?: number;
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
}

export default function SignalCard({
    icon, label, value, unit, delta, status = 'live',
    sparkline, accent = '#2563EB', decimals = 0, onClick, className, style,
}: SignalCardProps) {
    const ref = React.useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: '-40px' });
    const numeric = typeof value === 'number';
    const counted = useCountUp(numeric ? (value as number) : 0, 1100, inView);
    const display = numeric
        ? counted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : value;
    const s = STATUS[status];
    const up = (delta ?? 0) >= 0;

    return (
        <motion.div
            ref={ref}
            onClick={onClick}
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3 }}
            className={cn(
                'glass-edge group relative overflow-hidden rounded-2xl p-4',
                'border border-[rgba(15,23,42,0.07)] bg-white/70 backdrop-blur-xl',
                'shadow-glass transition-shadow duration-300 hover:shadow-glass-xl',
                onClick && 'cursor-pointer',
                className,
            )}
            style={style}
        >
            <div className="flex items-start justify-between">
                <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: `${accent}14`, color: accent, border: `1px solid ${accent}26` }}
                >
                    {icon}
                </div>
                <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: s.ring, color: s.dot }}
                >
                    <span
                        className="size-1.5 rounded-full"
                        style={{ background: s.dot, boxShadow: status === 'live' ? `0 0 0 3px ${s.ring}` : undefined }}
                    />
                    {s.label}
                </span>
            </div>

            <div className="mt-3.5 text-[12px] font-medium text-slate-500">{label}</div>

            <div className="mt-1 flex items-end justify-between gap-2">
                <div className="flex items-baseline gap-1">
                    <span className="text-[26px] font-bold tracking-tight tabular-nums text-slate-900">{display}</span>
                    {unit && <span className="text-[12px] font-semibold text-slate-400">{unit}</span>}
                </div>
                {sparkline && <MiniSparkline data={sparkline} color={accent} />}
            </div>

            {typeof delta === 'number' && (
                <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold"
                    style={{ color: up ? '#16A34A' : '#DC2626' }}>
                    {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {up ? '+' : ''}{delta.toFixed(1)}%
                    <span className="font-medium text-slate-400">vs last cycle</span>
                </div>
            )}
        </motion.div>
    );
}
