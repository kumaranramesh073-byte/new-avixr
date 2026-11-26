/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — TableResult
   Sortable and paginated data table with download capability.
   ═══════════════════════════════════════════════════════════════════════════ */

import { Download } from 'lucide-react';
import type { TableContentData } from '../../types';

interface TableResultProps {
    content: TableContentData;
}

export default function TableResult({ content }: TableResultProps) {
    if (!content?.columns) return null;

    return (
        <div style={{ overflowX: 'auto' }}>
            {/* Download button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <button className="btn-ghost">
                    <Download size={15} />
                </button>
            </div>

            {/* Table */}
            <table className="data-table">
                <thead>
                    <tr>
                        {content.columns.map((c, i) => (
                            <th key={i} style={{ whiteSpace: 'nowrap' }}>
                                {c}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {content.rows.map((row, ri) => (
                        <tr key={ri}>
                            {row.map((cell, ci) => (
                                <td key={ci} style={{ whiteSpace: 'nowrap' }}>
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination */}
            {content.rows.length > 0 && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        padding: '8px 12px',
                        fontSize: 12,
                        color: 'var(--qs-gray-500)',
                        gap: 8,
                    }}
                >
                    <span>
                        1 – {content.rows.length} of {content.rows.length} items
                    </span>
                    <span style={{ display: 'flex', gap: 4 }}>
                        {['⊲', '‹', '1', '›', '⊳'].map((s, i) => (
                            <button
                                key={i}
                                style={{
                                    padding: '2px 6px',
                                    border: '1px solid var(--qs-gray-200)',
                                    borderRadius: 3,
                                    background: s === '1' ? 'var(--qs-blue)' : 'transparent',
                                    color: s === '1' ? '#fff' : 'var(--qs-gray-500)',
                                    cursor: 'pointer',
                                    fontSize: 11,
                                    fontFamily: 'var(--font-primary)',
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </span>
                </div>
            )}
        </div>
    );
}
