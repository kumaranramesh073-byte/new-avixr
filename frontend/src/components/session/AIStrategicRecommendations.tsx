import { motion } from 'framer-motion';
import type { AIStrategy } from '../../types';

export default function AIStrategicRecommendations({ strategies }: { strategies: AIStrategy[] }) {
    if (!strategies || strategies.length === 0) return null;

    const getStatusStyles = (status: AIStrategy['status']) => {
        switch (status) {
            case 'RECOMMENDED':
                return {
                    pillBg: '#064e3b',
                    pillText: '#34d399',
                    borderLeft: '#10b981'
                };
            case 'HIGH IMPACT':
                return {
                    pillBg: '#1e3a8a',
                    pillText: '#60a5fa',
                    borderLeft: '#3b82f6'
                };
            case 'OPPORTUNITY':
                return {
                    pillBg: '#4c1d95',
                    pillText: '#a78bfa',
                    borderLeft: '#8b5cf6'
                };
            default:
                return {
                    pillBg: '#374151',
                    pillText: '#9ca3af',
                    borderLeft: '#6b7280'
                };
        }
    };

    return (
        <div style={{
            marginTop: 40,
            fontFamily: 'Inter, sans-serif',
            background: '#0f172a',
            padding: 32,
            borderRadius: 16,
            border: '1px solid #1e293b',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981' }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                    AI Strategic Recommendations
                </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {strategies.map((strategy, i) => {
                    const styles = getStatusStyles(strategy.status);

                    return (
                        <motion.div
                            key={strategy.id || i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: '#1e293b',
                                borderLeft: `4px solid ${styles.borderLeft}`,
                                borderRadius: 8,
                                padding: '20px 24px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{
                                    background: styles.pillBg,
                                    color: styles.pillText,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: '4px 10px',
                                    borderRadius: 12,
                                    letterSpacing: '0.05em'
                                }}>
                                    {strategy.status}
                                </span>
                                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    {strategy.type}
                                </span>
                            </div>

                            <div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600, color: '#f8fafc' }}>
                                    {strategy.title}
                                </h4>
                                <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>
                                    {strategy.description}
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                                {strategy.metricLabel && strategy.metricValue && (
                                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                        {strategy.metricLabel} <strong style={{ color: styles.pillText, fontWeight: 600 }}>{strategy.metricValue}</strong>
                                    </span>
                                )}
                                {strategy.timeline && (
                                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                        Timeline: <strong style={{ color: styles.pillText, fontWeight: 600 }}>{strategy.timeline}</strong>
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div >
    );
}
