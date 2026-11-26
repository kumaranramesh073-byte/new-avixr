import '../../styles/agent-dashboard.css';
import { useAgentReport } from '../../hooks/useAgentReport';
import AgentReportPanel from '../../components/dashboard/AgentReportPanel';
import { formatCurrency } from '../../utils/formatters';
import { useEffect } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import DashboardHeader from '../../components/layout/DashboardHeader';
import { TrendingUp } from 'lucide-react';

const forecastData = [
    { month: 'Mar', actual: 450, forecast: 465, confidence: 94 },
    { month: 'Apr', actual: 480, forecast: 492, confidence: 92 },
    { month: 'May', actual: 510, forecast: 508, confidence: 91 },
    { month: 'Jun', actual: null, forecast: 540, confidence: 88 },
];

export default function DemandForecastDashboard() {
    const { globalSearch, setGlobalSearch } = useSessionStore();
    const report = useAgentReport('PredictiveAnalysis');

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
                SIMULATION / SAMPLE TELEMETRY — Static forecast KPIs below are illustrative sample values; AI report above is generated dynamically.
            </div>
            <DashboardHeader
                title={<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><TrendingUp size={28} color="#8b5cf6" /> Demand Forecasting</div>}
                breadcrumbs={['Demand Forecast', 'Q3 EMEA Projections']}
                meta={[
                    { label: 'HORIZON', value: '90 Days' },
                    { label: 'ACCURACY', value: '94.2%', color: '#16a34a' }
                ]}
                onSearch={handleSearchShortcut}
                placeholder="Ask Agent about Demand..."
            />

            <div className="agent-dash-tabs">
                <button className="agent-dash-tab active">Probabilistic Forecast</button>
                <button className="agent-dash-tab">Market Factors</button>
                <button className="agent-dash-tab">Anomaly Detection</button>
            </div>

            <AgentReportPanel
                title="Predictive Analysis Intelligence Report"
                loading={report.loading}
                error={report.error}
                output={report.output}
                timestamp={report.timestamp}
                onRerun={() => report.rerun()}
            />

            <div className="kpi-row kpi-row-4">
                <div className="kpi-card">
                    <div className="kpi-label">Forecasted Revenue</div>
                    <div className="kpi-value">{formatCurrency(84500000, true)}</div>
                    <div className="kpi-delta positive">+4.2% Growth</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Market Volatility</div>
                    <div className="kpi-value">Low</div>
                    <div className="kpi-delta positive">Stable</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Confidence Interval</div>
                    <div className="kpi-value">±2.4%</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Anomalies Detected</div>
                    <div className="kpi-value">0</div>
                </div>
            </div>

            <div className="dash-panels dash-panels-full">
                <div className="dash-panel">
                    <div className="dash-panel-header">Quarterly Demand Projection</div>
                    <div className="dash-chart">
                        <div className="chart-bars" style={{ height: 200 }}>
                            {forecastData.map((d, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: 4, height: 160, alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                                        {d.actual && <div className="chart-bar primary" style={{ height: `${(d.actual / 600) * 100}%`, width: 12 }} />}
                                        <div className="chart-bar secondary" style={{ height: `${(d.forecast / 600) * 100}%`, width: 12 }} />
                                    </div>
                                    <div style={{ fontSize: 10, marginTop: 8, fontWeight: 600 }}>{d.month}</div>
                                </div>
                            ))}
                        </div>
                        <div className="chart-legend">
                            <div className="chart-legend-item"><div className="chart-legend-dot primary" style={{ background: 'var(--qs-blue)' }} /> Actual Demand</div>
                            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: 'var(--qs-gray-300)' }} /> Forecasted Demand</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
