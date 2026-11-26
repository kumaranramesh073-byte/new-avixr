/* ═══════════════════════════════════════════════════════════════════════════
   Q Simutron — Deep Research Dashboard
   Full research UI: query input, depth selector, animated node pipeline,
   coverage progress, iteration counter, source count, and markdown report.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, Send, X, BookOpen, Globe, Brain, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useDeepResearch, type ResearchDepth } from '../../hooks/useDeepResearch';

const NODE_ORDER = ['intake', 'decompose', 'search', 'collect', 'gap_eval', 'synthesize'] as const;

const NODE_ICONS: Record<string, React.ReactNode> = {
    intake:     <Brain size={14} />,
    decompose:  <BookOpen size={14} />,
    search:     <Globe size={14} />,
    collect:    <Zap size={14} />,
    gap_eval:   <AlertCircle size={14} />,
    synthesize: <CheckCircle size={14} />,
};

const DEPTH_DESCRIPTIONS: Record<ResearchDepth, string> = {
    surface:    '1 iteration, 3 sub-questions — quick factual answers',
    standard:   '2 iterations, 5 sub-questions — moderate analysis',
    deep:       '4 iterations, 7 sub-questions — thorough multi-perspective',
    exhaustive: '5 iterations, 10 sub-questions — strategic deep-dive',
};

export default function DeepResearchDashboard() {
    const [query, setQuery] = useState('');
    const [depth, setDepth] = useState<ResearchDepth>('deep');
    const [mode, setMode] = useState<'pro' | 'lite'>('pro');
    const { state, startResearch, cancel, NODE_LABELS } = useDeepResearch();

    const coveragePct = Math.round(state.coverageScore * 100);

    const handleSubmit = () => {
        if (query.trim() && state.status !== 'running') {
            startResearch(query.trim(), depth, mode);
        }
    };

    const currentNodeKey = Object.entries(NODE_LABELS).find(
        ([, label]) => label === state.currentNode
    )?.[0] || '';

    const passedNodeIndex = NODE_ORDER.indexOf(currentNodeKey as any);

    return (
        <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
            {/* ── Header ── */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 32 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, var(--qs-blue), #7C3AED)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Search size={20} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--qs-gray-900)', margin: 0 }}>
                            Q Simutron Deep Research
                        </h1>
                        <p style={{ fontSize: 13, color: 'var(--qs-gray-500)', margin: 0 }}>
                            Autonomous multi-step research engine with iterative gap evaluation
                        </p>
                    </div>
                    <span className="badge badge-info" style={{ marginLeft: 'auto' }}>
                        Decision Intelligence
                    </span>
                </div>
            </motion.div>

            {/* ── Query Input ── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
                style={{ padding: 20, marginBottom: 24 }}
            >
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <input
                        id="research-query-input"
                        type="text"
                        placeholder="Enter a complex business research question..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        disabled={state.status === 'running'}
                        style={{
                            flex: 1, padding: '10px 16px', fontSize: 14,
                            border: '1px solid var(--qs-gray-200)',
                            borderRadius: 'var(--radius-md)',
                            fontFamily: 'var(--font-primary)',
                            outline: 'none',
                            transition: 'border-color var(--transition-fast)',
                        }}
                    />
                    <select
                        id="research-depth-select"
                        value={depth}
                        onChange={(e) => setDepth(e.target.value as ResearchDepth)}
                        disabled={state.status === 'running'}
                        style={{
                            padding: '10px 16px', fontSize: 13,
                            border: '1px solid var(--qs-gray-200)',
                            borderRadius: 'var(--radius-md)',
                            fontFamily: 'var(--font-primary)',
                            background: '#fff', cursor: 'pointer',
                        }}
                    >
                        <option value="surface">Surface</option>
                        <option value="standard">Standard</option>
                        <option value="deep">Deep</option>
                        <option value="exhaustive">Exhaustive</option>
                    </select>
                    <select
                        id="research-mode-select"
                        value={mode}
                        title="Research Mode"
                        onChange={(e) => setMode(e.target.value as 'pro' | 'lite')}
                        disabled={state.status === 'running'}
                        style={{
                            padding: '10px 16px', fontSize: 13,
                            border: '1px solid var(--qs-gray-200)',
                            borderRadius: 'var(--radius-md)',
                            fontFamily: 'var(--font-primary)',
                            background: '#fff', cursor: 'pointer',
                        }}
                    >
                        <option value="pro">Pro (Perplexity)</option>
                        <option value="lite">Lite (DuckDuckGo)</option>
                    </select>

                    {state.status === 'running' ? (
                        <button id="research-cancel-btn" className="btn btn-secondary" onClick={cancel}>
                            <X size={16} /> Cancel
                        </button>
                    ) : (
                        <button
                            id="research-start-btn"
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={!query.trim()}
                        >
                            <Send size={16} /> Research
                        </button>
                    )}
                </div>
                <p style={{ fontSize: 12, color: 'var(--qs-gray-400)', margin: 0 }}>
                    {DEPTH_DESCRIPTIONS[depth]}
                </p>
            </motion.div>

            {/* ── Progress Panel ── */}
            <AnimatePresence>
                {state.status === 'running' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="card"
                        style={{ padding: 24, marginBottom: 24, overflow: 'hidden' }}
                    >
                        {/* Status + Sources */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Loader2 size={16} className="animate-spin" color="var(--qs-blue)" />
                                <span style={{ fontSize: 13, color: 'var(--qs-gray-600)' }}>
                                    {state.statusMessage}
                                </span>
                            </div>
                            <span style={{ fontSize: 13, color: 'var(--qs-gray-500)' }}>
                                {state.totalSources} sources
                            </span>
                        </div>

                        {/* Coverage Progress Bar */}
                        <div style={{
                            width: '100%', height: 6,
                            background: 'var(--qs-gray-100)',
                            borderRadius: 'var(--radius-full)',
                            marginBottom: 16,
                            overflow: 'hidden',
                        }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${coveragePct}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                style={{
                                    height: '100%',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'linear-gradient(90deg, var(--qs-blue), #7C3AED)',
                                    animation: coveragePct > 0 ? 'progressGlow 2s infinite' : 'none',
                                }}
                            />
                        </div>

                        {/* Node Pipeline */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                            {NODE_ORDER.map((n, i) => {
                                const isPassed = i <= passedNodeIndex;
                                const isCurrent = n === currentNodeKey;
                                return (
                                    <motion.span
                                        key={n}
                                        animate={{
                                            scale: isCurrent ? 1.05 : 1,
                                            opacity: isPassed ? 1 : 0.5,
                                        }}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            fontSize: 11,
                                            fontWeight: 500,
                                            padding: '4px 10px',
                                            borderRadius: 'var(--radius-full)',
                                            border: `1px solid ${isCurrent ? '#7C3AED' : isPassed ? 'var(--qs-blue-border)' : 'var(--qs-gray-200)'}`,
                                            background: isCurrent ? 'linear-gradient(135deg, #EDE9FE, #DBEAFE)' : isPassed ? 'var(--qs-blue-light)' : 'transparent',
                                            color: isCurrent ? '#7C3AED' : isPassed ? 'var(--qs-blue)' : 'var(--qs-gray-400)',
                                        }}
                                    >
                                        {NODE_ICONS[n]}
                                        {n.replace('_', ' ')}
                                    </motion.span>
                                );
                            })}
                        </div>

                        {/* Iteration + Coverage */}
                        <div style={{ fontSize: 12, color: 'var(--qs-gray-400)' }}>
                            Iteration {state.iteration} · Coverage {coveragePct}%
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Final Report ── */}
            <AnimatePresence>
                {state.finalReport && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card"
                        style={{ padding: 32, marginBottom: 24 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                            <CheckCircle size={18} color="var(--qs-green)" />
                            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--qs-gray-900)' }}>
                                Research Report
                            </span>
                            {state.status === 'complete' && (
                                <span className="badge badge-success" style={{ marginLeft: 'auto' }}>
                                    Coverage {coveragePct}% · {state.totalSources} sources
                                </span>
                            )}
                        </div>
                        <div style={{
                            fontSize: 14, lineHeight: 1.7,
                            color: 'var(--qs-gray-800)',
                            fontFamily: 'var(--font-primary)',
                        }}>
                            <ReactMarkdown
                                components={{
                                    h1: ({ children }) => (
                                        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '24px 0 12px', color: 'var(--qs-gray-900)' }}>
                                            {children}
                                        </h2>
                                    ),
                                    h2: ({ children }) => (
                                        <h3 style={{ fontSize: 17, fontWeight: 600, margin: '20px 0 10px', color: 'var(--qs-gray-900)' }}>
                                            {children}
                                        </h3>
                                    ),
                                    h3: ({ children }) => (
                                        <h4 style={{ fontSize: 15, fontWeight: 600, margin: '16px 0 8px', color: 'var(--qs-gray-800)' }}>
                                            {children}
                                        </h4>
                                    ),
                                    p: ({ children }) => (
                                        <p style={{ margin: '8px 0' }}>{children}</p>
                                    ),
                                    ul: ({ children }) => (
                                        <ul style={{ paddingLeft: 20, margin: '8px 0' }}>{children}</ul>
                                    ),
                                    li: ({ children }) => (
                                        <li style={{ margin: '4px 0' }}>{children}</li>
                                    ),
                                    strong: ({ children }) => (
                                        <strong style={{ fontWeight: 600, color: 'var(--qs-gray-900)' }}>{children}</strong>
                                    ),
                                    blockquote: ({ children }) => (
                                        <blockquote style={{
                                            borderLeft: '3px solid var(--qs-blue)',
                                            paddingLeft: 16,
                                            margin: '12px 0',
                                            color: 'var(--qs-gray-600)',
                                            fontStyle: 'italic',
                                        }}>
                                            {children}
                                        </blockquote>
                                    ),
                                    code: ({ children }) => (
                                        <code style={{
                                            background: 'var(--qs-gray-100)',
                                            padding: '2px 6px',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: 13,
                                            fontFamily: 'var(--font-mono)',
                                        }}>
                                            {children}
                                        </code>
                                    ),
                                }}
                            >
                                {state.finalReport}
                            </ReactMarkdown>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Error State ── */}
            <AnimatePresence>
                {state.error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="card"
                        style={{
                            padding: 20,
                            border: '1px solid var(--qs-red-light)',
                            background: '#FEF2F2',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertCircle size={16} color="var(--qs-red)" />
                            <span style={{ fontSize: 13, color: 'var(--qs-red)' }}>
                                {state.error}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
