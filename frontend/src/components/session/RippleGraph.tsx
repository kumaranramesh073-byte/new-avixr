import { motion } from 'framer-motion';
import { Activity, ArrowRight, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import type { SimulationResult, DecisionScore } from '../../types';

interface RippleGraphProps {
    simulation: SimulationResult;
    decision: DecisionScore;
}

export default function RippleGraph({ simulation, decision }: RippleGraphProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
                marginTop: 32,
                padding: '24px 28px',
                background: '#fff',
                borderRadius: 16,
                border: '1px solid var(--qs-gray-200)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.02)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <Activity size={24} color="var(--qs-blue)" />
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--qs-gray-900)' }}>
                    Live Engine Simulation
                </h3>
            </div>

            {/* Decision Score Overview */}
            <div style={{
                display: 'flex', gap: 16, marginBottom: 28, padding: 16,
                background: 'var(--qs-gray-50)', borderRadius: 12, border: '1px solid var(--qs-gray-100)'
            }}>
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minWidth: 100, borderRight: '1px solid var(--qs-gray-200)', paddingRight: 16
                }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: decision.compositeScore >= 80 ? '#16a34a' : decision.compositeScore >= 60 ? '#ca8a04' : '#dc2626' }}>
                        {decision.compositeScore}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--qs-gray-500)', textTransform: 'uppercase' }}>Composite Score</span>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        {decision.rank === 'EXECUTE_NOW' ? <CheckCircle size={16} color="#16a34a" /> :
                            decision.rank === 'PLAN_AND_EXECUTE' ? <ArrowRight size={16} color="#ca8a04" /> :
                                <AlertTriangle size={16} color="#dc2626" />}
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--qs-gray-900)' }}>
                            Recommendation: {decision.rank.replace(/_/g, ' ')}
                        </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--qs-gray-700)', lineHeight: 1.5 }}>
                        {decision.executiveSummary}
                    </p>
                </div>
            </div>

            {/* Ripple Effects Visualizer */}
            <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--qs-gray-800)', marginBottom: 12 }}>
                    Predicted Ripple Effects
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {simulation.rippleEffects?.map((effect, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: i * 0.15 }}
                            style={{
                                padding: 16,
                                background: '#fff',
                                borderRadius: 10,
                                border: '1px solid var(--qs-gray-200)',
                                borderLeft: effect.magnitude > 0.7 ? '4px solid #dc2626' : effect.magnitude > 0.4 ? '4px solid #ca8a04' : '4px solid #2563FF'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <ShieldAlert size={16} color="var(--qs-gray-400)" />
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--qs-gray-900)' }}>
                                    {effect.trigger}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ fontSize: 13, color: 'var(--qs-gray-700)', flex: 1 }}>
                                    <strong>Impact:</strong> {effect.primaryImpact}
                                </div>
                                <ArrowRight size={14} color="var(--qs-gray-400)" />
                                <div style={{ fontSize: 12, color: 'var(--qs-gray-500)', flex: 1 }}>
                                    {effect.secondaryEffects?.join(' → ')}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Causal Chain Summary */}
            <div style={{ padding: 16, background: 'var(--qs-gray-900)', borderRadius: 12, color: '#fff' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--qs-gray-400)', marginBottom: 6, textTransform: 'uppercase' }}>
                    Engine Synthesis
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                    {simulation.summary}
                </div>
            </div>
        </motion.div>
    );
}
