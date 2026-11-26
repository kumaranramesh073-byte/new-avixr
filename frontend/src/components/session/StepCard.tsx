/* ═══════════════════════════════════════════════════════════════════════════
   Q-Simutron Platform — StepCard
   Main container for an execution step result, including header and content.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronDown, Copy, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import ChartResult from './ChartResult';
import MapResult from './MapResult';
import TableResult from './TableResult';
import TextResult from './TextResult';
import type { StepResult, ChartContentData, MapContentData, TableContentData, TextContentData } from '../../types';

interface StepCardProps {
    step: StepResult;
    isCurrent: boolean;
    isQueued: boolean;
}

export default function StepCard({ step, isCurrent, isQueued }: StepCardProps) {
    const [expanded, setExpanded] = useState(true);
    const status = step.status;

    if (isQueued) {
        return (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', opacity: 0.5 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--qs-gray-300)', marginTop: 2 }} />
                <span style={{ fontSize: 14, color: 'var(--qs-gray-700)' }}>{step.title}</span>
            </div>
        );
    }

    return (
        <div style={{ marginBottom: 24 }} className="animate-fade-in">
            {/* Step header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isCurrent ? (
                        <Loader2 size={16} className="animate-spin" color="var(--qs-blue)" />
                    ) : (
                        <CheckCircle2 size={16} color="var(--qs-green)" fill="var(--qs-green-light)" />
                    )}
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--qs-gray-900)' }}>{step.title}</span>
                    {step.dataSource && (
                        <span className="badge badge-default">
                            {step.dataSource}
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {status === 'done' && (
                        <>
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="btn btn-ghost"
                                style={{
                                    color: 'var(--qs-green-dark)',
                                    borderColor: 'var(--qs-green-light)',
                                    background: 'var(--qs-green-light)',
                                    padding: '4px 10px',
                                    fontWeight: 600
                                }}
                            >
                                <CheckCircle2 size={14} /> Finished generating
                                <ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>
                            <button className="btn-ghost"><Copy size={14} /></button>
                            <button className="btn-ghost"><ThumbsUp size={14} /></button>
                            <button className="btn-ghost"><ThumbsDown size={14} /></button>
                        </>
                    )}
                </div>
            </div>

            {/* Content area */}
            <AnimatePresence>
                {expanded && status === 'done' && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ marginLeft: 24, overflow: 'hidden' }}
                    >
                        {/* Step Summary */}
                        {step.content && 'summary' in step.content && step.content.summary && (
                            <p style={{ fontSize: 13, color: 'var(--qs-gray-700)', marginBottom: 14, lineHeight: 1.6 }}>
                                {step.content.summary}
                            </p>
                        )}

                        {/* Visualization Container */}
                        <div className="card card-body" style={{ padding: 16 }}>
                            {step.type === 'chart' && <ChartResult content={step.content as ChartContentData} />}
                            {step.type === 'map' && <MapResult locations={(step.content as MapContentData).locations || []} />}
                            {step.type === 'table' && <TableResult content={step.content as TableContentData} />}
                            {step.type === 'text' && <TextResult content={step.content as TextContentData} />}
                        </div>

                        {/* Source Citation */}
                        {step.dataSource && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: 'var(--qs-gray-500)' }}>Sources:</span>
                                <button className="chip" style={{ padding: '2px 10px', fontSize: 11 }}>
                                    1. {step.dataSource}
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
