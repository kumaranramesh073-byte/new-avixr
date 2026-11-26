/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — MapResult
   SVG-based geospatial map visualization with risk-colored location pins.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { MapLocation } from '../../types';

const RISK_COLOR: Record<string, string> = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#22C55E',
};

interface MapResultProps {
    locations: MapLocation[];
}

export default function MapResult({ locations }: MapResultProps) {
    const toLX = (lng: number) => ((lng + 130) / 70) * 520 + 30;
    const toLY = (lat: number) => (1 - (lat - 24) / 30) * 200 + 20;

    return (
        <div
            style={{
                background: '#F0F4F8',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            <svg viewBox="0 0 580 260" style={{ width: '100%', display: 'block' }}>
                {/* Background */}
                <rect x="0" y="0" width="580" height="260" fill="#E8EEF4" />
                {/* US outline approximation */}
                <path
                    d="M30,80 L120,60 L220,55 L330,50 L450,55 L540,70 L545,120 L540,160 L500,190 L450,200 L380,210 L300,215 L200,210 L120,200 L60,180 L30,150 Z"
                    fill="#C8D6E5"
                    stroke="#B0C4D4"
                    strokeWidth="1"
                />
                {/* Grid lines */}
                {[80, 120, 160, 200].map((y) => (
                    <line
                        key={`h-${y}`}
                        x1="20"
                        y1={y}
                        x2="560"
                        y2={y}
                        stroke="#D4DDE8"
                        strokeWidth="0.5"
                        strokeDasharray="4 4"
                        opacity={0.5}
                    />
                ))}
                {[100, 200, 300, 400, 500].map((x) => (
                    <line
                        key={`v-${x}`}
                        x1={x}
                        y1="20"
                        x2={x}
                        y2="240"
                        stroke="#D4DDE8"
                        strokeWidth="0.5"
                        strokeDasharray="4 4"
                        opacity={0.5}
                    />
                ))}
                <text x="180" y="150" fontSize="10" fill="#8899AA" fontWeight="600">
                    United States
                </text>
                {/* Location pins */}
                {locations.map((loc, i) => {
                    const x = Math.max(40, Math.min(540, toLX(loc.lng)));
                    const y = Math.max(20, Math.min(240, toLY(loc.lat)));
                    const c = RISK_COLOR[loc.risk] || '#2563FF';
                    return (
                        <g key={i}>
                            {/* Pulse ring */}
                            <circle cx={x} cy={y} r={16} fill={c} opacity={0.08}>
                                <animate
                                    attributeName="r"
                                    from="12"
                                    to="20"
                                    dur="2s"
                                    repeatCount="indefinite"
                                />
                                <animate
                                    attributeName="opacity"
                                    from="0.15"
                                    to="0"
                                    dur="2s"
                                    repeatCount="indefinite"
                                />
                            </circle>
                            <circle cx={x} cy={y} r={12} fill={c} opacity={0.2} />
                            <circle cx={x} cy={y} r={6} fill={c} />
                            <circle cx={x} cy={y} r={3} fill="#fff" opacity={0.6} />
                            <text
                                x={x + 9}
                                y={y + 4}
                                fontSize="9"
                                fill="#374151"
                                fontWeight="600"
                            >
                                {loc.name}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div
                style={{
                    display: 'flex',
                    gap: 16,
                    padding: '8px 12px',
                    background: '#fff',
                    fontSize: 11,
                    color: 'var(--qs-gray-500)',
                }}
            >
                {(['high', 'medium', 'low'] as const).map((r) => (
                    <span key={r} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: RISK_COLOR[r],
                                display: 'inline-block',
                            }}
                        />
                        {r.charAt(0).toUpperCase() + r.slice(1)} Risk
                    </span>
                ))}
                <span style={{ marginLeft: 'auto', color: 'var(--qs-gray-400)' }}>
                    {locations.length} locations
                </span>
            </div>
        </div>
    );
}
