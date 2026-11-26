/* ═══════════════════════════════════════════════════════════════════════════
   Qsimutron Enterprise — Professional Resume Dashboard
   Synthesizes platform capabilities into a professional curriculum vitae.
   ═══════════════════════════════════════════════════════════════════════════ */

import '../../styles/agent-dashboard.css';
import { useAgentReport } from '../../hooks/useAgentReport';
import AgentReportPanel from '../../components/dashboard/AgentReportPanel';
import { Globe, Linkedin, Github, Layers } from 'lucide-react';
import { useEffect } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import DashboardHeader from '../../components/layout/DashboardHeader';

export default function ResumeDashboard() {
    const { globalSearch, setGlobalSearch } = useSessionStore();
    const report = useAgentReport('Personalization');

    useEffect(() => {
        if (globalSearch) {
            report.rerun(globalSearch);
        }
    }, [globalSearch]);

    const handleSearchShortcut = (query: string) => {
        setGlobalSearch(query);
        report.rerun(query);
    };

    return (
        <div className="agent-dashboard">
            <DashboardHeader
                title={<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Layers size={28} color="var(--qs-blue-light)" /> Intelligence Profile</div>}
                breadcrumbs={['Intelligence Profile', 'Executive Summary']}
                meta={[
                    { label: 'EMAIL', value: 'enterprise@qsimutron.ai' },
                    { label: 'LOCATION', value: 'Chennai, India' }
                ]}
                onSearch={handleSearchShortcut}
                placeholder="Ask Agent to personalize profile..."
            />

            <div style={{ padding: '40px 48px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 40 }}>

                    {/* Left Column: Intelligence & Experience */}
                    <div>
                        <AgentReportPanel
                            title="Platform Executive Summary"
                            loading={report.loading}
                            error={report.error}
                            output={report.output}
                            timestamp={report.timestamp}
                            onRerun={() => report.rerun()}
                        />

                        <div style={{ marginTop: 40 }}>
                            <h2 style={{ fontSize: 20, borderBottom: '1px solid var(--qs-gray-200)', paddingBottom: 8, marginBottom: 20 }}>Core Capabilities</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div>
                                    <h3 style={{ fontSize: 16, margin: 0 }}>Predictive Supply Chain Intelligence</h3>
                                    <p style={{ fontSize: 14, color: 'var(--qs-gray-600)', margin: '4px 0' }}>Agent: PredictiveAnalysis</p>
                                    <p style={{ fontSize: 14 }}>Bayesian demand forecasting with 98% accuracy. Real-time anomaly detection and trend vector synthesis for global logistics.</p>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 16, margin: 0 }}>Strategic Process Optimization</h3>
                                    <p style={{ fontSize: 14, color: 'var(--qs-gray-600)', margin: '4px 0' }}>Agent: StrategyOptimization</p>
                                    <p style={{ fontSize: 14 }}>Game-theoretic resource allocation. Pareto-optimal scenario modeling across multi-constraint industrial environments.</p>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 16, margin: 0 }}>Financial Risk & ROI Synthesis</h3>
                                    <p style={{ fontSize: 14, color: 'var(--qs-gray-600)', margin: '4px 0' }}>Agent: Finance & RiskSynthesis</p>
                                    <p style={{ fontSize: 14 }}>CFO-grade P&L impact analysis and operational risk heat-mapping. Cascade failure modeling and mitigation playbook generation.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Skills & Tech */}
                    <div>
                        <div className="dash-panel" style={{ padding: 24 }}>
                            <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 16 }}>Technical Arsenal</h2>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {['Large Language Models', 'Bayesian Inference', 'Game Theory', 'Supply Chain Digital Twins', 'RBAC Security', 'PostgreSQL', 'Real-time WebSockets', 'Industrial IoT Integration'].map(skill => (
                                    <span key={skill} style={{
                                        padding: '4px 10px',
                                        background: 'var(--qs-gray-50)',
                                        border: '1px solid var(--qs-gray-100)',
                                        borderRadius: 2,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: 'var(--qs-gray-700)'
                                    }}>
                                        {skill}
                                    </span>
                                ))}
                            </div>

                            <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 16 }}>Education & Research</h2>
                            <div style={{ fontSize: 13 }}>
                                <div style={{ fontWeight: 700 }}>Advanced Agentic Systems</div>
                                <div style={{ color: 'var(--qs-gray-500)' }}>Anthropic & Deepmind Research</div>
                                <div style={{ marginTop: 12, fontWeight: 700 }}>Decision Science</div>
                                <div style={{ color: 'var(--qs-gray-500)' }}>Qsimutron Innovation Labs</div>
                            </div>

                            <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 16 }}>Digital Presence</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                                    <Globe size={16} color="var(--qs-gray-400)" /> qsimutron.ai
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                                    <Linkedin size={16} color="var(--qs-gray-400)" /> linkedin.com/company/qsimutron
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                                    <Github size={16} color="var(--qs-gray-400)" /> github.com/qsimutron-enterprise
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
