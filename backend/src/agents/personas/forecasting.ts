import { baseFallback, type ModulePersona } from '../moduleAgent.js';

export const forecastingPersona: ModulePersona = {
    module: 'forecasting',
    title: 'Forecasting Engine',
    persona: `PERSONA: AI-Powered Enterprise Future Intelligence System. You predict what is LIKELY TO HAPPEN NEXT — revenue, demand, churn, market shifts — and help leadership prepare before conditions change. You distinguish short-term volatility from structural change and always quantify the forward window.`,
    searchFocus: `the company's recent and projected revenue growth, quarterly results, demand and sales trends, analyst forecasts, guidance, seasonality, and any factors expected to drive performance over the next few quarters`,
    chartsHint: `"projection":[{"period":"Q1","revenue":0,"cost":0,"profit":0}],   // 6 forward periods, internally consistent
    "demand":[{"period":"Q1","value":0}],   // 6 periods, demand index 0-100
    "accuracy":[{"period":"Q1","actual":0,"predicted":0}]   // 5 periods, for the accuracy tracker`,
    fallback: (company, industry) => baseFallback('forecasting', 'Forecasting Engine', company, {
        executive_summary: `${company}'s revenue is expected to grow at a moderate pace next quarter, but premium-segment retention and competitor pricing pressure cap the upside. Structural demand in ${industry} remains intact; disciplined execution should compound positively over the next 12–18 months.`,
        kpis: [
            { label: 'Revenue Forecast', value: 14, unit: '%', trend: 'up', delta: '+14% QoQ', confidence: 82 },
            { label: 'Demand Outlook', value: 71, unit: '/100', trend: 'up', delta: 'High', confidence: 78 },
            { label: 'Forecast Confidence', value: 82, unit: '%', trend: 'up', delta: '+3pts', confidence: 82 },
            { label: 'Risk Forecast', value: 46, unit: '/100', trend: 'flat', delta: 'Medium', confidence: 70 },
        ],
        why_it_matters: [
            { signal: 'Revenue Forecast +14%', why: 'Seasonal demand uplift plus new-segment traction', impact: 'Supports hiring and inventory build-up', recommended_action: 'Pre-position inventory before the demand spike' },
            { signal: 'Premium churn rising', why: 'Pricing sensitivity and delivery delays', impact: 'Could erase ~4% of projected growth', recommended_action: 'Launch a premium retention play this quarter' },
            { signal: 'Demand Outlook High', why: 'Structural sector tailwind', impact: 'Window to capture share from slower rivals', recommended_action: 'Increase marketing in high-growth regions' },
        ],
        root_cause: [{ factor: 'Seasonal demand', pct: 34 }, { factor: 'Competitor discounting', pct: 29 }, { factor: 'Ad conversion decline', pct: 22 }, { factor: 'Delivery delays', pct: 15 }],
        alerts: [
            { severity: 'high', title: 'Demand slowdown predicted in premium segment', probability: 64, timeline: 'next quarter', impact: 'Margin pressure on highest-value cohort' },
            { severity: 'medium', title: 'Inventory shortage risk in high-growth region', probability: 52, timeline: '30 days', impact: 'Missed revenue if unaddressed' },
            { severity: 'medium', title: 'Competitor pricing impact on conversion', probability: 58, timeline: '45 days', impact: 'CAC inflation' },
        ],
        opportunities: [
            { title: 'Healthcare/adjacent sector demand rising', potential: 78, note: 'Reuse core platform to capture neighbouring demand' },
            { title: 'Tier-2 market expansion', potential: 66, note: 'Lower CAC, rising demand' },
            { title: 'Usage-based pricing tier', potential: 61, note: 'Capture price-sensitive mid-market' },
        ],
        recommendations: [
            { priority: 'high', action: 'Increase inventory allocation by ~18% before the spike', impact: 'Avoids stockouts in peak demand', roi: '+3% revenue', complexity: 'low' },
            { priority: 'high', action: 'Launch premium retention campaign', impact: 'Protects highest-margin cohort', roi: '-11% churn', complexity: 'medium' },
            { priority: 'medium', action: 'Shift CAC budget toward high-growth regions', impact: 'Better marginal ROI', roi: '+6% efficiency', complexity: 'low' },
        ],
        scenarios: [
            { name: 'Best Case', revenue_impact: '+18%', risk_index: 32, market_share: '+5%', note: 'Demand uplift + retention holds', recommended: false },
            { name: 'Base Case', revenue_impact: '+11%', risk_index: 48, market_share: '+2%', note: 'Expected trajectory', recommended: true },
            { name: 'Worst Case', revenue_impact: '-6%', risk_index: 70, market_share: '-3%', note: 'Pricing war + churn spike', recommended: false },
        ],
        ripple_mermaid: `graph LR\n  A[Competitor Discounting]:::danger --> B[CAC Inflation]:::warn\n  B --> C[Margin Compression]:::danger\n  A --> D[Premium Churn]:::warn\n  D --> E[Revenue Growth Slowdown]:::danger\n  C --> F[Defensive Pivot]:::safe\n  classDef danger fill:#ef4444,color:#fff\n  classDef warn fill:#eab308,color:#000\n  classDef safe fill:#22c55e,color:#fff`,
        confidence: { overall: 82, data_quality: 78, signal_strength: 74, scenario_stability: 76 },
        timeline: [
            { horizon: 'Next 30 Days', outlook: 'Demand spike building; pre-position inventory', events: ['Inventory shortage risk', 'Competitor campaign'] },
            { horizon: 'Next Quarter', outlook: 'Revenue +11% base case; premium churn watch', events: ['Premium segment slowdown', 'Pricing pressure'] },
            { horizon: 'Next 6 Months', outlook: 'Structural demand intact; expand Tier-2', events: ['Tier-2 growth', 'Margin normalisation'] },
            { horizon: 'Next 2 Years', outlook: 'Consolidation favours disciplined operators', events: ['Market share consolidation'] },
        ],
        charts: {
            projection: [
                { period: 'Q1', revenue: 1200, cost: 820, profit: 380 },
                { period: 'Q2', revenue: 1340, cost: 880, profit: 460 },
                { period: 'Q3', revenue: 1510, cost: 940, profit: 570 },
                { period: 'Q4', revenue: 1680, cost: 1010, profit: 670 },
                { period: 'Q5', revenue: 1880, cost: 1090, profit: 790 },
                { period: 'Q6', revenue: 2100, cost: 1180, profit: 920 },
            ],
            demand: [
                { period: 'Q1', value: 58 }, { period: 'Q2', value: 63 }, { period: 'Q3', value: 71 },
                { period: 'Q4', value: 68 }, { period: 'Q5', value: 74 }, { period: 'Q6', value: 79 },
            ],
            accuracy: [
                { period: 'Q1', actual: 1180, predicted: 1200 }, { period: 'Q2', actual: 1360, predicted: 1340 },
                { period: 'Q3', actual: 1490, predicted: 1510 }, { period: 'Q4', actual: 1700, predicted: 1680 },
                { period: 'Q5', actual: 1850, predicted: 1880 },
            ],
        },
    }),
};
