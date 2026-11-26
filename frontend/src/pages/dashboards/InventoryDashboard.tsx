import '../../styles/agent-dashboard.css';
import { useAgentReport } from '../../hooks/useAgentReport';
import AgentReportPanel from '../../components/dashboard/AgentReportPanel';
import { formatCurrency } from '../../utils/formatters';
import { useEffect } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import DashboardHeader from '../../components/layout/DashboardHeader';
import { Package } from 'lucide-react';

const inventory = [
    { sku: 'SKU 4268-3', item: 'Exhaust Valve', facility: 'Phoenix DC', action: 'Decrease Safety Stock to 50', cost: -4000, svc: 90, gen: '07/31/2024' },
    { sku: 'SKU 4217-3', item: 'Intake Valve', facility: 'Boston DC', action: 'Decrease Min from 30 to 50', cost: -3300, svc: 80, gen: '07/31/2024' },
    { sku: 'SKU 4187-3', item: 'Valve Springs', facility: 'Arizona DC', action: 'Decrease Safety Time 65→58', cost: -2800, svc: 88, gen: '07/31/2024' },
    { sku: 'SKU 4068-3', item: 'Throttle Valve', facility: 'Swift DC', action: 'Decrease Safety Stock 3050→74', cost: -4500, svc: 91, gen: '07/31/2024' },
    { sku: 'SKU 3866-3', item: 'Blow-off Valve', facility: 'EasyFlow DC', action: 'Increase Safety Stock 33→74', cost: 1500, svc: 91, gen: '07/31/2024' },
    { sku: 'SKU 4107-3', item: 'Poppet Valve', facility: 'Infinite DC', action: 'Increase Safety Stock 130→174', cost: 2900, svc: 90, gen: '07/31/2024' },
];

export default function InventoryDashboard() {
    const { globalSearch, setGlobalSearch } = useSessionStore();
    const report = useAgentReport('Finance');

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
                title={<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Package size={28} color="#d97706" /> Inventory Optimization</div>}
                breadcrumbs={['Inventory Optimization', 'Global Distribution Network']}
                meta={[
                    { label: 'ENTITY', value: 'Qsimutron' },
                    { label: 'REGION', value: 'North America' }
                ]}
                onSearch={handleSearchShortcut}
                placeholder="Ask Agent about Inventory..."
            />

            <div className="agent-dash-tabs">
                <button className="agent-dash-tab active">Overview</button>
                <button className="agent-dash-tab">Recommendations</button>
                <button className="agent-dash-tab">Impact Analysis</button>
            </div>

            {/* ── Live Agent Intelligence Report ── */}
            <AgentReportPanel
                title="Finance Agent Intelligence Report"
                loading={report.loading}
                error={report.error}
                output={report.output}
                timestamp={report.timestamp}
                onRerun={() => report.rerun()}
            />

            <div className="kpi-row kpi-row-3" style={{ paddingBottom: 0 }}>
                <div className="kpi-card">
                    <div className="kpi-label">Open Recommendations</div>
                    <div className="kpi-value">1,079</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--qs-gray-500)' }}>
                        Net Savings: <strong style={{ color: '#16a34a' }}>{formatCurrency(870000, true)}</strong>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Potential Cost Impact</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <div style={{ flex: 1, background: 'var(--qs-gray-50)', borderRadius: '2px', padding: 12, border: '1px solid var(--qs-gray-100)' }}>
                            <div style={{ fontSize: 10, color: 'var(--qs-gray-400)' }}>SAVINGS</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>+25%</div>
                        </div>
                        <div style={{ flex: 1, background: 'var(--qs-gray-50)', borderRadius: '2px', padding: 12, border: '1px solid var(--qs-gray-100)' }}>
                            <div style={{ fontSize: 10, color: 'var(--qs-gray-400)' }}>IMPACT</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--qs-gray-800)' }}>-30%</div>
                        </div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Service Level Variance</div>
                    <div className="chart-bars" style={{ height: 60, marginTop: 10 }}>
                        {[85, 92, 78, 88].map((h, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <div className="chart-bar primary" style={{ height: `${h}%` }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ padding: '16px 28px 24px' }}>
                <div className="dash-panel">
                    <div className="dash-panel-header">
                        <span>SKU Recommendations</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="dash-btn dash-btn-outline">Export PDF</button>
                            <button className="dash-btn dash-btn-primary">Approve All</button>
                        </div>
                    </div>
                    <table className="dash-table">
                        <thead><tr><th>SKU</th><th>Item</th><th>Facility</th><th>Recommendation</th><th>Cost Imp.</th><th>Svc Level</th><th>Gen. Date</th></tr></thead>
                        <tbody>
                            {inventory.map(r => (
                                <tr key={r.sku}>
                                    <td className="link">{r.sku}</td>
                                    <td>{r.item}</td>
                                    <td>{r.facility}</td>
                                    <td>{r.action}</td>
                                    <td style={{ color: r.cost < 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{formatCurrency(r.cost)}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div className="dash-progress"><div className="dash-progress-fill" style={{ width: `${r.svc}%` }} /></div>
                                            {r.svc}%
                                        </div>
                                    </td>
                                    <td>{r.gen}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
