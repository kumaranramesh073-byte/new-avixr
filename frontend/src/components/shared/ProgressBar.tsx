/* ═══════════════════════════════════════════════════════════════════════════
   Q-Simutron Platform — ProgressBar
   Animated progress bar for session execution tracking.
   ═══════════════════════════════════════════════════════════════════════════ */

import { motion } from 'framer-motion';

interface ProgressBarProps {
    progress: number;
    status: 'executing' | 'done' | string;
}

export default function ProgressBar({ progress, status }: ProgressBarProps) {
    if (status === 'done') {
        return (
            <div
                style={{
                    height: 3,
                    background: 'var(--qs-blue)',
                    width: '100%',
                }}
            />
        );
    }

    if (status === 'executing') {
        return (
            <div
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 5,
                    height: 3,
                    background: 'var(--qs-gray-200)',
                }}
            >
                <motion.div
                    initial={{ width: '5%' }}
                    animate={{ width: `${progress || 10}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--qs-blue), #60A5FA)',
                        borderRadius: 2,
                    }}
                />
            </div>
        );
    }

    return null;
}
