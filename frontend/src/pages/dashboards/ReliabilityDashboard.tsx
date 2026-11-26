import { useState, useEffect } from 'react';
import '../../styles/agent-dashboard.css';
import { useAgentReport } from '../../hooks/useAgentReport';
import { useSessionStore } from '../../store/sessionStore';
import AgentReportPanel from '../../components/dashboard/AgentReportPanel';
import DashboardHeader from '../../components/layout/DashboardHeader';
import { Shield } from 'lucide-react';

const riskBars = [35, 42, 28, 50, 62, 55, 48, 72, 65, 58, 80, 75, 68, 45, 52, 38, 60, 70, 42, 55, 65, 78, 50, 85, 72, 60, 48, 55, 90, 82];

const cmmsAssets = [
    { id: 'ASST-101', name: 'ESP-1 Motor', status: 'Healthy', healthScore: 92, lastMaint: '20 Feb 2026' },
    { id: 'ASST-102', name: 'ESP-1 Pump', status: 'Warning', healthScore: 68, lastMaint: '15 Jan 2026' },
    { id: 'ASST-103', name: 'ESP-1 Cable', status: 'Healthy', healthScore: 95, lastMaint: '10 Feb 2026' },
];

const assetModels = [
    { name: 'Motor Reliability Model', version: 'v2.4', type: 'LSTM-RNN', accuracy: '98.2%', lastRetrained: '01 Feb 2026' },
    { name: 'Discharge Pressure Predictor', version: 'v1.1', type: 'Random Forest', accuracy: '94.5%', lastRetrained: '20 Jan 2026' },
];

const sensorHealth = [
    { sensor: 'DIA101', type: 'Pressure', value: '284.07 PSI', status: 'Online', signal: 'Strong' },
    { sensor: 'DT7201', type: 'Temperature', value: '155.48 °F', status: 'Online', signal: 'Good' },
    { sensor: 'SIA022', type: 'Voltage', value: '4264.91 V', status: 'Degraded', signal: 'Low' },
];

const contribs = [
    { feature: 'DT7201', desc: 'ESP-1 Motor Temperature', contrib: 67, value: '155.48', unit: '°F' },
    { feature: 'SIA022', desc: 'ESP-1 Downhole Units', contrib: 25, value: '4264.91', unit: 'V' },
    { feature: 'DIA021', desc: 'ESP-1 Discharge Pressure', contrib: 10, value: '284.07', unit: 'PSI' },
];

const alerts = [
    { id: 'Motor Alert: 0dda87', score: 3, risk: 'LOW', date: '24/02/2026', status: 'Open' },
    { id: 'Motor Alert: Nd2aa', score: 3, risk: 'LOW', date: '21/02/2026', status: 'Open' },
    { id: 'Motor Alert: 3449b8', score: 5, risk: 'MEDIUM', date: '20/02/2026', status: 'Open' },
    { id: 'Motor Alert: 8bd2a1', score: 8, risk: 'HIGH', date: '19/02/2026', status: 'Open' },
];

const sideAlerts = [
    { id: 'd72b15', model: 'ESP-1 Reliability Model', risk: 22, date: '25/02/2026' },
    { id: '7bbf0c', model: 'Generator Reliability', risk: 18, date: '25/02/2026' },
    { id: '31fb77', model: 'Motor Reliability', risk: 15, date: '24/02/2026' },
    { id: '0b4720', model: 'Pump Reliability', risk: 0, date: '24/02/2026' },
];

const TABS = ['Overview', 'CMMS Assets', 'Asset Models', 'Reliability Risk Score', 'Asset Alerts', 'Sensor Health', 'Events'];

export default function ReliabilityDashboard() {
    const [activeTab, setActiveTab] = useState('Reliability Risk Score');
    const { globalSearch, setGlobalSearch } = useSessionStore();
    const report = useAgentReport('RiskSynthesis');

    // React to global search changes
    useEffect(() => {
        if (globalSearch) {
            report.rerun(globalSearch);
        }
    }, [globalSearch]);

    const handleSearchShortcut = (query: string) => {
        setGlobalSearch(query);
        report.rerun(query);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'CMMS Assets':
                return (
                    <div className="dash-panel">
                        <div className="dash-panel-header">Connected CMMS Assets</div>
                        <table className="dash-table">
                            <thead><tr><th>Asset ID</th><th>Name</th><th>Status</th><th>Health Score</th><th>Last Maint.</th></tr></thead>
                            <tbody>
                                {cmmsAssets.map(a => (
                                    <tr key={a.id}>
                                        <td className="link">{a.id}</td>
                                        <td>{a.name}</td>
                                        <td><span className={`dash-badge ${a.status.toLowerCase()}`}>{a.status}</span></td>
                                        <td>{a.healthScore}%</td>
                                        <td>{a.lastMaint}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'Asset Models':
                return (
                    <div className="dash-panel">
                        <div className="dash-panel-header">Active Reliability Models</div>
                        <table className="dash-table">
                            <thead><tr><th>Model Name</th><th>Version</th><th>Architectural Type</th><th>Accuracy</th><th>Retrained</th></tr></thead>
                            <tbody>
                                {assetModels.map(m => (
                                    <tr key={m.name}>
                                        <td className="link">{m.name}</td>
                                        <td>{m.version}</td>
                                        <td>{m.type}</td>
                                        <td style={{ fontWeight: 600, color: '#16a34a' }}>{m.accuracy}</td>
                                        <td>{m.lastRetrained}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'Sensor Health':
                return (
                    <div className="dash-panel">
                        <div className="dash-panel-header">Real-time Sensor Monitoring</div>
                        <table className="dash-table">
                            <thead><tr><th>Sensor ID</th><th>Category</th><th>Current Value</th><th>Status</th><th>Signal</th></tr></thead>
                            <tbody>
                                {sensorHealth.map(s => (
                                    <tr key={s.sensor}>
                                        <td className="link">{s.sensor}</td>
                                        <td>{s.type}</td>
                                        <td>{s.value}</td>
                                        <td><span className={`dash-badge ${s.status === 'Online' ? 'success' : 'warning'}`}>{s.status}</span></td>
                                        <td>{s.signal}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'Reliability Risk Score':
            default:
                return (
                    <>
                        <div className="kpi-row kpi-row-4">
                            <div className="kpi-card">
                                <div className="kpi-label">Current Risk Score</div>
                                <div className="kpi-value" style={{ color: '#d97706' }}>27</div>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-label">Open Risk Score Alerts</div>
                                <div className="kpi-value">4</div>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-label">Open Sensor Alerts</div>
                                <div className="kpi-value">0</div>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-label">Live ML Model</div>
                                <div className="kpi-value" style={{ fontSize: 17 }}>Tervis AI Engine</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <div className="dash-panel">
                                <div className="dash-panel-header">Risk Score Analysis (Past 30 Days)</div>
                                <div className="dash-chart">
                                    <div className="chart-bars">
                                        {riskBars.map((h, i) => (
                                            <div key={i} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 1 }}>
                                                <div className="chart-bar primary" style={{ height: `${h}%` }} />
                                                <div className="chart-bar secondary" style={{ height: `${Math.max(10, h * 0.4)}%` }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="chart-legend">
                                    <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: '#3b82f6' }} /> Predicted Risk</div>
                                    <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: '#a78bfa' }} /> Actual Risk</div>
                                    <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: '#22c55e' }} /> Sensor Variance</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <div className="dash-panel">
                                <div className="dash-panel-header">Reliability Risk Score Contributors</div>
                                <table className="dash-table">
                                    <thead><tr><th>Feature</th><th>Description</th><th>Contribution (%)</th><th>Value</th><th>Unit</th></tr></thead>
                                    <tbody>
                                        {contribs.map(r => (
                                            <tr key={r.feature}><td>{r.feature}</td><td>{r.desc}</td><td>{r.contrib}</td><td>{r.value}</td><td>{r.unit}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="agent-dashboard">
            <div style={{ marginBottom: 12, padding: '8px 14px', borderRadius: 8, background: '#fefce8', border: '1px solid #fde047', color: '#854d0e', fontSize: 12, fontWeight: 600 }}>
                SIMULATION / SAMPLE TELEMETRY — Asset sensor values below are illustrative sample readings; AI report above is generated dynamically.
            </div>
            <DashboardHeader
                title={<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Shield size={28} color="var(--qs-accent)" /> Reliability Intelligence</div>}
                breadcrumbs={['Reliability Intelligence', 'ESP-1 Analysis']}
                meta={[
                    { label: 'CRITICALITY', value: 'High', color: '#dc2626' },
                    { label: 'ASSET', value: 'ESP-1' },
                    { label: 'LOCATION', value: 'Chennai, India' }
                ]}
                onSearch={handleSearchShortcut}
                placeholder="Ask Agent about Reliability..."
            />

            <div className="agent-dash-tabs">
                {TABS.map((t) => (
                    <button
                        key={t}
                        className={`agent-dash-tab${activeTab === t ? ' active' : ''}`}
                        onClick={() => setActiveTab(t)}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* ── Live Agent Intelligence Report ── */}
            <AgentReportPanel
                title="Risk Synthesis Intelligence Report"
                loading={report.loading}
                error={report.error}
                output={report.output}
                timestamp={report.timestamp}
                onRerun={() => report.rerun()}
            />

            <div style={{ display: 'flex', padding: '0 28px 24px' }}>
                <div style={{ flex: 1 }}>
                    {renderTabContent()}

                    <div className="dash-panel" style={{ marginTop: 24 }}>
                        <div className="dash-panel-header">AI Alerts Queue</div>
                        <table className="dash-table">
                            <thead><tr><th style={{ width: 30 }}>☐</th><th>Alert ID</th><th>Score</th><th>Risk Level</th><th>Generated On</th><th>Status</th></tr></thead>
                            <tbody>
                                {alerts.map(a => (
                                    <tr key={a.id}>
                                        <td>☐</td>
                                        <td className="link">{a.id}</td>
                                        <td><span className={`risk-dot ${a.risk.toLowerCase()}`}>{a.score}</span></td>
                                        <td>{a.risk}</td>
                                        <td>{a.date}</td>
                                        <td><span className="dash-badge open">{a.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ width: 280, borderLeft: '1px solid var(--qs-gray-100)', background: '#fff', marginLeft: 24, paddingLeft: 24, flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 16, color: 'var(--qs-gray-600)' }}>Live Model Health</div>
                    <div className="dash-alerts-sidebar" style={{ border: 'none', padding: 0 }}>
                        {sideAlerts.map(a => (
                            <div key={a.id} className="alert-item" style={{ borderLeft: `3px solid ${a.risk > 15 ? '#dc2626' : a.risk > 5 ? '#d97706' : '#16a34a'}`, background: 'var(--qs-gray-50)', marginBottom: 12, padding: 12, borderRadius: 6 }}>
                                <div className="alert-title" style={{ fontWeight: 700, fontSize: 12 }}>{a.model}</div>
                                <div className="alert-meta" style={{ fontSize: 11, marginTop: 4 }}>Risk Level: <strong>{a.risk}</strong><br />{a.date}</div>
                                <div className="alert-links" style={{ marginTop: 8 }}>
                                    <a style={{ fontSize: 11, color: 'var(--qs-blue)', fontWeight: 600 }}>Trained on Qsimutron Core</a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
