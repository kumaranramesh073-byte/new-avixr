import '../../styles/agent-dashboard.css';
import { useAgentReport } from '../../hooks/useAgentReport';
import AgentReportPanel from '../../components/dashboard/AgentReportPanel';
import { formatCurrency } from '../../utils/formatters';
import { Cpu } from 'lucide-react';
import { useEffect } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import DashboardHeader from '../../components/layout/DashboardHeader';

const processData = [
    { id: 'PROC-901', process: 'Thermal Catalytic Cracking', efficiency: 94.2, bottleneck: 'Heat Exchanger', costBase: 1250000 },
    { id: 'PROC-902', process: 'Hydro-desulfurization', efficiency: 88.5, bottleneck: 'Reactor Pressure', costBase: 840000 },
    { id: 'PROC-903', process: 'Fractional Distillation', efficiency: 91.8, bottleneck: 'None', costBase: 2100000 },
];

export default function ProcessOptDashboard() {
    const { globalSearch, setGlobalSearch } = useSessionStore();
    const report = useAgentReport('StrategyOptimization');

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
            <div style={{ marginBottom: 12, padding: '8px 14px', borderRadius: 8, background: '#fefce8', border: '1px solid #fde047', color: '#854d0e', fontSize: 12, fontWeight: 600 }}>
                SIMULATION / SAMPLE TELEMETRY — Static process KPIs below are illustrative sample values; AI report above is generated dynamically.
            </div>
            <DashboardHeader
                title={<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Cpu size={28} color="var(--qs-blue-light)" /> Process Optimization</div>}
                breadcrumbs={['Process Optimization', 'Production Line Alpha']}
                meta={[
                    { label: 'STRATEGY', value: 'Pareto Optimal' },
                    { label: 'GAINS', value: '+1.2% Gain', color: '#16a34a' }
                ]}
                onSearch={handleSearchShortcut}
                placeholder="Ask Agent about Process..."
            />

            <div className="agent-dash-tabs">
                <button className="agent-dash-tab active">Strategy Simulations</button>
                <button className="agent-dash-tab">Bottleneck Analysis</button>
                <button className="agent-dash-tab">Resource Allocation</button>
            </div>

            <AgentReportPanel
                title="Strategy Optimization Intelligence Report"
                loading={report.loading}
                error={report.error}
                output={report.output}
                timestamp={report.timestamp}
                onRerun={() => report.rerun()}
            />

            <div className="kpi-row kpi-row-3">
                <div className="kpi-card">
                    <div className="kpi-label">Avg. Process Efficiency</div>
                    <div className="kpi-value">91.5%</div>
                    <div className="kpi-delta positive">+1.2% Gain</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Opportunity Cost Impact</div>
                    <div className="kpi-value">{formatCurrency(4190000, true)}</div>
                    <div className="kpi-delta negative">Optimizable</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Active Scenarios</div>
                    <div className="kpi-value">12</div>
                    <div className="kpi-delta positive">Simulation Active</div>
                </div>
            </div>

            <div style={{ padding: '0 28px 24px' }}>
                <div className="dash-panel">
                    <div className="dash-panel-header">Process Performance Matrix</div>
                    <table className="dash-table">
                        <thead>
                            <tr><th>Process ID</th><th>Description</th><th>Efficiency</th><th>Bottleneck</th><th>Cost Base</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                            {processData.map(p => (
                                <tr key={p.id}>
                                    <td className="link">{p.id}</td>
                                    <td>{p.process}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div className="dash-progress"><div className="dash-progress-fill" style={{ width: `${p.efficiency}%` }} /></div>
                                            {p.efficiency}%
                                        </div>
                                    </td>
                                    <td><span style={{ color: p.bottleneck === 'None' ? '#16a34a' : '#d97706', fontWeight: 600 }}>{p.bottleneck}</span></td>
                                    <td>{formatCurrency(p.costBase)}</td>
                                    <td><button className="dash-btn dash-btn-outline">Optimize</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
