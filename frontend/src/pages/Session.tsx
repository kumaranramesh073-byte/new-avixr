/* ═══════════════════════════════════════════════════════════════════════════
   Q-Simutron Platform — Session Page
   Interactive session view for agent execution and results streaming.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Plus, MessageSquare, ChevronDown, Wand2 } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import ProgressBar from '../components/shared/ProgressBar';
import PlanCard from '../components/session/PlanCard';
import StepCard from '../components/session/StepCard';
import RippleGraph from '../components/session/RippleGraph';
import AIStrategicRecommendations from '../components/session/AIStrategicRecommendations';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSessionStore } from '../store/sessionStore';

export default function Session() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { sessions, agentMode, executePlan, submitQuery } = useSession();

    const activeSession = sessions.find(s => s.id === Number(id));

    // Listen for live backend simulation results
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3100/ws';
    useWebSocket({
        url: WS_URL,
        sessionId: activeSession?.backendId || null,
        autoConnect: !!activeSession?.backendId,
        onMessage: (ev) => {
            if (ev.type === 'session_done' && activeSession) {
                const sim = ev.data.simulation;
                const score = ev.data.decisionScore;
                if (sim && score) {
                    useSessionStore.getState().setSimulationResults(activeSession.id, sim, score);
                }
            }
        }
    });

    if (!activeSession) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--qs-gray-500)' }}>Session not found</p>
            </div>
        );
    }

    const handleFollowUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const q = e.currentTarget.value;
            if (!q) return;
            e.currentTarget.value = '';
            const sid = await submitQuery(q);
            if (sid) navigate(`/sessions/${sid}`);
        }
    };

    return (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* ── LEFT SESSION SIDEBAR ── */}
            <div
                style={{
                    width: 64,
                    borderRight: '1px solid var(--qs-gray-100)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px 0',
                    background: 'var(--qs-gray-50)',
                    flexShrink: 0
                }}
            >
                <div
                    style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center',
                        whiteSpace: 'nowrap',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--qs-gray-400)',
                        letterSpacing: '0.1em',
                        marginTop: 80
                    }}
                >
                    RECENT SESSIONS
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: '0 10px', marginTop: 40 }}>
                    {sessions.slice(0, 8).map(s => (
                        <motion.button
                            key={s.id}
                            whileHover={{ x: 2 }}
                            onClick={() => navigate(`/sessions/${s.id}`)}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 8,
                                background: s.id === Number(id) ? 'var(--qs-blue-50)' : '#fff',
                                border: s.id === Number(id) ? '1px solid var(--qs-blue-border)' : '1px solid var(--qs-gray-200)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: s.id === Number(id) ? 'var(--qs-blue)' : 'var(--qs-gray-400)',
                                fontSize: 10,
                                textAlign: 'center',
                                padding: 4,
                                overflow: 'hidden',
                                fontWeight: 600
                            }}
                            title={s.query}
                        >
                            {s.query.charAt(0).toUpperCase()}
                        </motion.button>
                    ))}
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            border: '2px dashed var(--qs-gray-200)',
                            background: 'transparent',
                            color: 'var(--qs-gray-400)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* ── MAIN SESSION CONTENT ── */}
            <div style={{ flex: 1, overflow: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <ProgressBar progress={activeSession.progress} status={activeSession.status} />

                <div style={{ maxWidth: 900, width: '100%', margin: '0 auto', padding: '32px 48px', flex: 1 }}>
                    {/* Agent Badge */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ marginBottom: 20 }}
                    >
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '5px 14px',
                                background: 'var(--qs-blue-light)',
                                border: '1px solid var(--qs-blue-border)',
                                borderRadius: 24
                            }}
                        >
                            <Wand2 size={14} color="var(--qs-blue)" />
                            <span style={{ fontSize: 12, color: 'var(--qs-blue-hover)', fontWeight: 600 }}>{agentMode}</span>
                            <ChevronDown size={14} color="var(--qs-blue)" />
                        </div>
                    </motion.div>

                    {/* Query Heading */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 32 }}>
                        <div style={{ marginTop: 4, color: 'var(--qs-gray-400)' }}><Edit2 size={20} /></div>
                        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--qs-gray-900)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                            {activeSession.query}
                        </h2>
                    </div>

                    {/* Planning State */}
                    {activeSession.status === 'planning' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 20, background: 'var(--qs-gray-50)', borderRadius: 12 }}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            >
                                <Wand2 size={18} color="var(--qs-blue)" />
                            </motion.div>
                            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--qs-gray-700)' }}>
                                Planning multi-step orchestration strategy...
                            </span>
                        </motion.div>
                    )}

                    {/* Plan Visualization */}
                    {activeSession.status === 'ready' && activeSession.plan && (
                        <PlanCard
                            plan={activeSession.plan}
                            onContinue={() => executePlan(activeSession.id)}
                        />
                    )}

                    {/* Execution Results */}
                    {(activeSession.status === 'executing' || activeSession.status === 'done') && activeSession.plan && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <AnimatePresence mode="popLayout">
                                {activeSession.executedSteps.map((step) => (
                                    <StepCard key={step.id} step={step} isCurrent={false} isQueued={false} />
                                ))}
                            </AnimatePresence>

                            {/* Ongoing Step Indicator */}
                            {activeSession.status === 'executing' && activeSession.currentStep < activeSession.plan.steps.length && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '16px 0',
                                    marginLeft: 4,
                                    borderTop: '1px solid var(--qs-gray-100)',
                                    marginTop: 8
                                }}>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        style={{ color: 'var(--qs-blue)' }}
                                    >
                                        <Wand2 size={16} />
                                    </motion.div>
                                    <span style={{ fontSize: 13.5, color: 'var(--qs-gray-700)', fontWeight: 600 }}>
                                        {activeSession.plan.steps[activeSession.currentStep]?.title}...
                                    </span>
                                </div>
                            )}

                            {/* Remaining Plan Steps */}
                            {activeSession.plan.steps.slice(activeSession.currentStep + 1).map((step) => (
                                <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', opacity: 0.35 }}>
                                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--qs-gray-300)' }} />
                                    <span style={{ fontSize: 13.5, color: 'var(--qs-gray-600)' }}>{step.title}</span>
                                </div>
                            ))}

                            {/* AI Strategies & Ripple Graph Injection */}
                            {activeSession.status === 'done' && activeSession.simulation && activeSession.decisionScore && (
                                <>
                                    <AIStrategicRecommendations strategies={activeSession.decisionScore.strategies} />
                                    <RippleGraph simulation={activeSession.simulation} decision={activeSession.decisionScore} />
                                </>
                            )}
                        </div>
                    )}

                    {/* Footer Input */}
                    {activeSession.status === 'done' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                marginTop: 48,
                                paddingTop: 32,
                                borderTop: '1px solid var(--qs-gray-100)',
                                display: 'flex',
                                gap: 12,
                                alignItems: 'center'
                            }}
                        >
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                    placeholder="Ask a follow-up question..."
                                    onKeyDown={handleFollowUp}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        paddingLeft: 44,
                                        border: '1px solid var(--qs-gray-200)',
                                        borderRadius: 12,
                                        fontSize: 14,
                                        background: 'var(--qs-gray-50)',
                                        fontFamily: 'var(--font-primary)'
                                    }}
                                />
                                <MessageSquare size={18} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--qs-gray-400)' }} />
                            </div>
                            <button
                                onClick={() => navigate('/')}
                                className="btn btn-secondary"
                                style={{ height: 44, padding: '0 20px', borderRadius: 12 }}
                            >
                                New Search
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
