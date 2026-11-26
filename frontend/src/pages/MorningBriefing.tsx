/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON OCT — Home / OCT Engine Dashboard
   Centerpiece: "Run OCT Simulation" button
   Post-run: Mirror World layout (Bloomberg | Causal Graph | BlackRock + Vanguard)
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertTriangle, RotateCcw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { DashboardTabs } from '../components/dashboard/DashboardTabs';
import HomeCommandCenter, { type LatestSimulationSummary } from '../components/dashboard/HomeCommandCenter';
import type { EcosystemOutput } from '../components/dashboard/types';




// ─── Types ────────────────────────────────────────────────────────────────────

interface SimulationResponse {
    market_score: number;
    competitor_threat: number;
    volatility_index: number;
    bloomberg_output: {
        headline: string;
        threats: Array<{ signal: string; severity: 'critical' | 'high' | 'medium' | 'low'; timestamp: string }>;
        market_velocity: number;
    };
    blackrock_output: {
        rpn: number;
        risk_category: string;
        ripple_effects: string[];
        capital_recommendation: string;
    };
    vanguard_output: {
        stability_score: number;
        actions: Array<{ step: string; rationale: string; timeline: string }>;
        long_term_outlook: string;
    };
    ecosystem_output: EcosystemOutput;
    company_name: string;
    mermaid_graph_code: string;
    generated_at: string;
}

import { getAuthHeaders } from '../lib/authHeaders';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3100/api';

// ─── Main component ───────────────────────────────────────────────────────────

export default function MorningBriefing() {
    const { businessDNA, resetOnboarding, user } = useAuthStore();
    const [data, setData] = useState<SimulationResponse | null>(null);
    const [latestSim, setLatestSim] = useState<LatestSimulationSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/sessions/simulations/latest`, {
                    headers: await getAuthHeaders(),
                });
                if (!res.ok) return;
                const json = await res.json();
                if (!cancelled && json?.simulation) {
                    setLatestSim(json.simulation);
                }
            } catch { /* ignore */ }
        })();
        return () => { cancelled = true; };
    }, []);

    // Build userParams shape from simplified BusinessDNA
    const buildParams = useCallback(() => {
        if (!businessDNA) return null;
        return {
            companyName: businessDNA.companyName,
            companyWebsite: businessDNA.companyWebsite,
            companyDescription: businessDNA.companyDescription,
            industry: businessDNA.industry,
            competitor: 'Fast-Growing Challenger',
            priority: businessDNA.goals[0] || 'Growth & Resilience',
            goals: businessDNA.goals.join(', '),
            companySize: businessDNA.teamSize,
            teamSize: businessDNA.teamSize,
            geography: 'Global',
            timeHorizon: 'Next 12 Months',
            primaryThreat: 'Technology Disruption',
        };
    }, [businessDNA]);

    const runSimulation = useCallback(async () => {
        const params = buildParams();
        if (!params) return;
        setLoading(true);
        setError(null);
        setData(null);

        try {
            const res = await fetch(`${API_BASE}/sessions/simulate-morning`, {
                method: 'POST', headers: await getAuthHeaders(),
                body: JSON.stringify({ userParams: params }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setData(await res.json() as SimulationResponse);
        } catch (err: any) {
            setError(err.message ?? 'Simulation failed');
        } finally {
            setLoading(false);
        }
    }, [buildParams]);

    if (!businessDNA) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div style={{ color: 'var(--qs-gray-400)', fontSize: 13 }}>No Business DNA configured.</div>
            </div>
        );
    }

    // ── RESULTS: Full Dashboard ──────────────────────────────────────────────
    if (data && !loading) {
        return (
            <div style={{ minHeight: '100%', background: 'transparent', padding: '20px 22px', color: 'var(--qs-gray-900)', fontFamily: 'var(--font-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 10px #34D399' }} />
                            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' }}>
                                {data.company_name || businessDNA.companyName || 'Mirror World'} — OCT Simulation
                            </h1>
                        </div>
                        <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--qs-gray-500)' }}>
                            {businessDNA.industry}{businessDNA.teamSize ? ` · ${businessDNA.teamSize} team` : ''}{businessDNA.goals?.[0] ? ` · ${businessDNA.goals[0]}` : ''}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={runSimulation} className="glass-subtle" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, color: 'var(--qs-gray-700)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                            <RefreshCw size={12} /> Re-run
                        </button>
                        <button onClick={() => { setData(null); setError(null); }} className="glass-subtle" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, color: 'var(--qs-gray-500)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                            <RotateCcw size={12} /> Back
                        </button>
                    </div>
                </div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-col gap-4 pb-8">
                    <DashboardTabs data={data} />
                    <p className="text-center text-xs text-muted-foreground px-4">
                        Generated {new Date(data.generated_at).toLocaleString()} · {data.company_name} · {businessDNA.industry}
                    </p>
                </motion.div>
            </div>
        );
    }

    // ── ERROR ─────────────────────────────────────────────────────────────────
    if (error && !loading) {
        return (
            <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="glass glass-edge" style={{ borderRadius: 20, padding: '28px 32px', maxWidth: 440, textAlign: 'center' }}>
                    <AlertTriangle size={22} color="var(--qs-red)" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--qs-gray-900)' }}>Simulation interrupted</div>
                    <div style={{ fontSize: 12.5, color: 'var(--qs-gray-500)', marginTop: 6, marginBottom: 18 }}>{error}</div>
                    <button onClick={runSimulation} className="btn btn-primary" style={{ margin: '0 auto' }}>
                        <RefreshCw size={13} /> Retry
                    </button>
                </motion.div>
            </div>
        );
    }

    // ── SPATIAL COMMAND CENTER (idle) or LIVING SIMULATION (running) ──────────
    return (
        <HomeCommandCenter
            dna={businessDNA}
            userName={user?.displayName}
            phase={loading ? 'running' : 'idle'}
            latestSimulation={latestSim}
            onRun={runSimulation}
            onResetDNA={resetOnboarding}
        />
    );
}
