import { useEffect, useRef, useState } from 'react';
import HomeCommandCenter from './HomeCommandCenter';

/**
 * CommandCenterPreview — a self-contained, no-auth demo of the spatial command
 * center. Clicking the OCT orb plays the living "thinking" sequence for one full
 * cycle (~8.5s) then returns to idle — so the interaction can be experienced
 * without a backend or login. (The real Home calls the OCT simulation API.)
 */
export default function CommandCenterPreview() {
    const [phase, setPhase] = useState<'idle' | 'running'>('idle');
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

    const run = () => {
        if (phase === 'running') return;
        setPhase('running');
        timer.current = setTimeout(() => setPhase('idle'), 8600); // one 8-stage cycle
    };

    return (
        <HomeCommandCenter
            dna={{
                companyName: 'Avixr Technologies',
                companyWebsite: 'https://avixr.com',
                companyDescription: 'Enterprise decision intelligence and strategic simulation platform',
                industry: 'Enterprise SaaS',
                teamSize: '50–500',
                goals: ['Market Expansion', 'Risk Reduction'],
            }}
            userName="Adrian"
            phase={phase}
            onRun={run}
            onResetDNA={() => {}}
        />
    );
}
