/* ═══════════════════════════════════════════════════════════════════════════
   Q-Simutron Platform — PlanCard
   Displays the AI execution plan with numbered steps and Continue button.
   ═══════════════════════════════════════════════════════════════════════════ */

import { motion } from 'framer-motion';
import type { ExecutionPlan } from '../../types';

interface PlanCardProps {
    plan: ExecutionPlan;
    onContinue: () => void;
}

export default function PlanCard({ plan, onContinue }: PlanCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
                border: '1px solid var(--qs-gray-200)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                background: '#fff',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--qs-gray-900)' }}>Plan</span>
                <div
                    style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: '1.5px solid var(--qs-gray-400)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'help',
                    }}
                    title="AI-generated execution plan"
                >
                    <span style={{ fontSize: 9, color: 'var(--qs-gray-400)', fontWeight: 700 }}>i</span>
                </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--qs-gray-500)', marginBottom: 16 }}>
                I'm creating a plan to answer your question since it requires multiple steps.
            </p>

            {/* Steps */}
            {plan.steps.map((step, i) => (
                <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        marginBottom: 12,
                    }}
                >
                    {/* Pending dot */}
                    <div
                        style={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            border: '2px solid var(--qs-gray-300)',
                            flexShrink: 0,
                            marginTop: 2,
                        }}
                    />
                    <div>
                        <span style={{ fontSize: 13.5, color: 'var(--qs-gray-900)', fontWeight: 500 }}>
                            {step.title}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--qs-gray-500)', marginLeft: 8 }}>
                            – {step.description}
                        </span>
                    </div>
                </motion.div>
            ))}

            {/* Continue Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onContinue}
                    className="btn btn-primary"
                >
                    Continue
                </motion.button>
            </div>
        </motion.div>
    );
}
