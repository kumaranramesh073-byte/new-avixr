import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { getAuthHeaders } from '../lib/authHeaders';
import type { StandardModuleOutput } from '../components/module/types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3100/api';

// In-memory cache so navigating between modules doesn't re-run the LLM each time.
const cache = new Map<string, StandardModuleOutput>();

const STAGES = [
    'Loading your Business DNA…',
    'Scanning live signals…',
    'Running multi-factor analysis…',
    'Quantifying impact & confidence…',
    'Simulating scenarios…',
    'Synthesizing recommendations…',
];

function buildParams(dna: any): Record<string, string> | null {
    if (!dna) return null;
    return {
        companyName: dna.companyName,
        companyWebsite: dna.companyWebsite || '',
        companyDescription: dna.companyDescription || '',
        industry: dna.industry,
        priority: dna.goals?.[0] || 'Growth & Resilience',
        goals: Array.isArray(dna.goals) ? dna.goals.join(', ') : '',
        companySize: dna.teamSize || '',
        teamSize: dna.teamSize || '',
        geography: 'Global',
    };
}

export function useModule(moduleKey: string, extraParams?: Record<string, string>) {
    const businessDNA = useAuthStore(s => s.businessDNA);
    const [data, setData] = useState<StandardModuleOutput | null>(cache.get(moduleKey) ?? null);
    const [loading, setLoading] = useState(false);
    const [stage, setStage] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const ranFor = useRef<string | null>(null);
    // Keep a ref so the auto-run effect always sees the latest extraParams.
    const extraParamsRef = useRef(extraParams);
    useEffect(() => { extraParamsRef.current = extraParams; }, [extraParams]);

    const run = useCallback(async () => {
        const params = buildParams(businessDNA);
        if (!params) { setError('No Business DNA configured.'); return; }
        const merged = extraParamsRef.current ? { ...params, ...extraParamsRef.current } : params;
        setLoading(true); setError(null); setStage(0);
        const iv = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 1100);
        try {
            const res = await fetch(`${API_BASE}/modules/${moduleKey}/run`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({ userParams: merged }),
            });
            clearInterval(iv);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const out = await res.json() as StandardModuleOutput;
            cache.set(moduleKey, out);
            setData(out);
        } catch (e: any) {
            clearInterval(iv);
            setError(e.message ?? 'Module run failed');
        } finally {
            setLoading(false);
        }
    }, [businessDNA, moduleKey]);

    // Auto-run once per module (uses cache on revisit).
    useEffect(() => {
        if (cache.has(moduleKey)) { setData(cache.get(moduleKey)!); return; }
        if (ranFor.current === moduleKey) return;
        ranFor.current = moduleKey;
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moduleKey]);

    return { data, loading, error, stage, stageLabel: STAGES[stage], run, hasDNA: !!businessDNA };
}
