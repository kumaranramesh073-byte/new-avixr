import { baseFallback, type ModulePersona } from '../moduleAgent.js';

export const financePersona: ModulePersona = {
    module: 'finance',
    title: 'Financial Engine',
    persona: `PERSONA: AI-Powered Enterprise Chief Financial Officer (CFO). You evaluate capital allocation, cash flow, unit economics, ROI, and financial health. You look beyond the top line to focus on margins, EBITDA, and shareholder value. You think like a veteran CFO running a tight ship during uncertain times.`,
    searchFocus: `the company's latest financial results — revenue, gross and EBITDA margins, profit or loss, cash position, funding rounds or debt, valuation — and analyst commentary on its financial health and unit economics`,
    chartsHint: `"cashflow":[{"period":"Q1","operating":0,"investing":0,"financing":0,"net":0}],   // 4 quarters
    "metrics":[{"name":"Gross Margin","value":0,"target":0}]   // 4 key metrics`,
    fallback: (company, industry) => baseFallback('finance', 'Financial Engine', company, {
        executive_summary: `${company}'s financial health is solid, with strong gross margins but creeping operating expenses. Customer Acquisition Cost (CAC) is rising faster than Lifetime Value (LTV), putting pressure on unit economics. A reallocation of capital from low-performing marketing channels to product-led growth initiatives is recommended to defend EBITDA margins.`,
        kpis: [
            { label: 'EBITDA Margin', value: 18, unit: '%', trend: 'down', delta: '-2pts', confidence: 88 },
            { label: 'Cash Runway', value: 24, unit: 'mo', trend: 'flat', delta: 'Stable', confidence: 92 },
            { label: 'LTV:CAC Ratio', value: 3.2, unit: 'x', trend: 'down', delta: '-0.4x', confidence: 82 },
            { label: 'Gross Margin', value: 68, unit: '%', trend: 'up', delta: '+1pt', confidence: 90 },
        ],
        why_it_matters: [
            { signal: 'LTV:CAC declining to 3.2x', why: 'Increased paid media costs and slight uptick in churn', impact: 'Reduced marketing efficiency and longer payback periods', recommended_action: 'Shift budget to organic channels and retention programs' },
            { signal: 'OpEx growing faster than Revenue', why: 'Recent headcount expansion not yet fully productive', impact: 'EBITDA margin compression in the short term', recommended_action: 'Freeze non-critical hiring for Q3 and focus on enablement' },
        ],
        root_cause: [{ factor: 'Paid marketing inflation', pct: 45 }, { factor: 'Headcount growth', pct: 35 }, { factor: 'Software/Tooling sprawl', pct: 20 }],
        alerts: [
            { severity: 'medium', title: 'Marketing spend efficiency drop', probability: 80, timeline: 'current', impact: 'Higher CAC' },
            { severity: 'low', title: 'SaaS tooling costs rising', probability: 90, timeline: 'ongoing', impact: 'Unnecessary OpEx burn' },
        ],
        opportunities: [
            { title: 'Vendor renegotiation', potential: 65, note: 'Consolidate SaaS tools for volume discounts' },
            { title: 'Pricing optimization', potential: 72, note: '5% price increase on legacy tiers to boost margins' },
        ],
        recommendations: [
            { priority: 'high', action: 'Implement hiring freeze for Q3', impact: 'Stabilizes OpEx and defends EBITDA', roi: 'Margin protection', complexity: 'low' },
            { priority: 'high', action: 'Audit and consolidate SaaS spend', impact: 'Immediate cash flow improvement', roi: '+2% OpEx reduction', complexity: 'medium' },
            { priority: 'medium', action: 'Test 5% price increase on Tier 1', impact: 'Flows directly to bottom line', roi: '+4% Revenue', complexity: 'high' },
        ],
        scenarios: [
            { name: 'Cost Control', revenue_impact: 'Stable', risk_index: 30, market_share: 'Stable', note: 'Focus on profitability over growth', recommended: true },
            { name: 'Growth at all costs', revenue_impact: '+12%', risk_index: 60, market_share: '+2%', note: 'Aggressive spend, accepting lower margins', recommended: false },
            { name: 'Recession', revenue_impact: '-10%', risk_index: 45, market_share: '-1%', note: 'Defensive posture, extending runway', recommended: false },
        ],
        ripple_mermaid: `graph LR\n  A[Rising CAC]:::warn --> B[Marketing Inefficiency]:::warn\n  B --> C[EBITDA Compression]:::danger\n  C --> D[Cost Reduction Mandate]:::warn\n  D --> E[SaaS Consolidation]:::safe\n  D --> F[Hiring Freeze]:::safe\n  classDef danger fill:#ef4444,color:#fff\n  classDef warn fill:#eab308,color:#000\n  classDef safe fill:#22c55e,color:#fff`,
        confidence: { overall: 88, data_quality: 90, signal_strength: 85, scenario_stability: 88 },
        charts: {
            cashflow: [
                { period: 'Q1', operating: 450, investing: -120, financing: 0, net: 330 },
                { period: 'Q2', operating: 420, investing: -150, financing: 0, net: 270 },
                { period: 'Q3', operating: 380, investing: -100, financing: 500, net: 780 },
                { period: 'Q4', operating: 460, investing: -200, financing: -50, net: 210 },
            ],
            metrics: [
                { name: 'Gross Margin', value: 68, target: 70 },
                { name: 'EBITDA Margin', value: 18, target: 20 },
                { name: 'OpEx / Rev', value: 50, target: 45 },
                { name: 'Rule of 40', value: 38, target: 40 },
            ],
        },
    }),
};
