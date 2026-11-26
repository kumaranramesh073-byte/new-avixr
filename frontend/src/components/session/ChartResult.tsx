/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — ChartResult
   Recharts-based bar/line chart with grid toggle and download button.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line,
} from 'recharts';
import { Download } from 'lucide-react';
import type { ChartContentData } from '../../types';

interface ChartResultProps {
    content: ChartContentData;
}

export default function ChartResult({ content }: ChartResultProps) {
    const [view, setView] = useState<'chart' | 'grid'>('chart');

    if (!content?.data) return null;

    return (
        <>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                }}
            >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--qs-gray-900)' }}>
                    {content.bars?.[0]?.name || 'Metrics'} by {content.xKey || 'Category'}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                    {(['chart', 'grid'] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            style={{
                                padding: '4px 12px',
                                fontSize: 12,
                                fontWeight: 500,
                                borderRadius: 4,
                                cursor: 'pointer',
                                background: view === v ? 'var(--qs-blue)' : 'transparent',
                                color: view === v ? '#fff' : 'var(--qs-gray-500)',
                                border: `1px solid ${view === v ? 'var(--qs-blue)' : 'var(--qs-gray-200)'}`,
                                fontFamily: 'var(--font-primary)',
                                transition: 'all 150ms ease',
                            }}
                        >
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                    ))}
                    <button className="btn-ghost">
                        <Download size={15} />
                    </button>
                </div>
            </div>

            {/* Chart View */}
            {view === 'chart' ? (
                <ResponsiveContainer width="100%" height={220}>
                    {content.chartType === 'line' ? (
                        <LineChart data={content.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--qs-gray-100)" />
                            <XAxis
                                dataKey={content.xKey}
                                tick={{ fontSize: 11, fill: 'var(--qs-gray-500)' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: 'var(--qs-gray-500)' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    fontSize: 12,
                                    borderRadius: 8,
                                    border: '1px solid var(--qs-gray-200)',
                                    boxShadow: 'var(--shadow-md)',
                                }}
                            />
                            {(content.bars || []).map((b) => (
                                <Line
                                    key={b.key}
                                    type="monotone"
                                    dataKey={b.key}
                                    stroke={b.color}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    name={b.name}
                                />
                            ))}
                        </LineChart>
                    ) : (
                        <BarChart data={content.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--qs-gray-100)" vertical={false} />
                            <XAxis
                                dataKey={content.xKey}
                                tick={{ fontSize: 11, fill: 'var(--qs-gray-500)' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: 'var(--qs-gray-500)' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    fontSize: 12,
                                    borderRadius: 8,
                                    border: '1px solid var(--qs-gray-200)',
                                    boxShadow: 'var(--shadow-md)',
                                }}
                            />
                            {(content.bars || []).map((b) => (
                                <Bar
                                    key={b.key}
                                    dataKey={b.key}
                                    fill={b.color}
                                    name={b.name}
                                    radius={[3, 3, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    )}
                </ResponsiveContainer>
            ) : (
                /* Grid/Table View */
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{content.xKey}</th>
                                {(content.bars || []).map((b) => (
                                    <th key={b.key} style={{ textAlign: 'right' }}>
                                        {b.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {content.data.map((row, i) => (
                                <tr key={i}>
                                    <td>{row[content.xKey]}</td>
                                    {(content.bars || []).map((b) => (
                                        <td key={b.key} style={{ textAlign: 'right' }}>
                                            {typeof row[b.key] === 'number'
                                                ? (row[b.key] as number).toFixed(2)
                                                : row[b.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}
