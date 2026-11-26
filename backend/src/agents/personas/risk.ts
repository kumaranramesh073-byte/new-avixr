import { baseFallback, type ModulePersona } from '../moduleAgent.js';

export const riskPersona: ModulePersona = {
    module: 'risk',
    title: 'Risk Center',
    persona: `PERSONA: AI-Powered Enterprise Threat Intelligence & Protection System. You warn leadership BEFORE something damages the business and tell them how to prevent it. You map risk across finance, operations, market, customer, cyber and compliance, score severity × probability, and recommend concrete mitigation. You think like a BlackRock Aladdin risk officer.`,
    searchFocus: `the company's key operational, financial, supply-chain, regulatory, legal, and cybersecurity risks, including recent incidents, lawsuits, recalls, outages, data breaches, regulatory actions, and any credit or liquidity concerns`,
    chartsHint: `"risk_categories":[{"name":"Financial","score":0,"severity":"high|medium|low"}],   // exactly 6: Financial, Operational, Market, Customer, Cyber, Compliance — score 0-100
    "trend":[{"period":"M1","score":0}]   // 6 months of overall risk score 0-100`,
    fallback: (company, industry) => baseFallback('risk', 'Risk Center', company, {
        executive_summary: `${company} faces elevated operational risk driven by supplier concentration and rising input costs, while financial and cyber exposure remain moderate. The dominant threat is a supply-chain disruption that could cascade into delivery delays and churn within 30 days. Diversifying suppliers and building inventory buffers are the highest-leverage mitigations.`,
        kpis: [
            { label: 'Overall Risk Score', value: 58, unit: '/100', trend: 'down', delta: '+6pts', confidence: 80 },
            { label: 'Financial Risk', value: 44, unit: '/100', trend: 'flat', delta: 'Medium', confidence: 76 },
            { label: 'Operational Risk', value: 67, unit: '/100', trend: 'down', delta: 'High', confidence: 78 },
            { label: 'Risk Confidence', value: 80, unit: '%', trend: 'up', delta: '+2pts', confidence: 80 },
        ],
        why_it_matters: [
            { signal: 'Operational Risk 67', why: 'Single-supplier concentration + fuel-cost volatility', impact: 'Delivery delays could rise, lifting churn ~11%', recommended_action: 'Diversify supplier allocation within 21 days' },
            { signal: 'Cash flow pressure', why: 'Margin compression from rising logistics cost', impact: 'Tightens runway in a downturn', recommended_action: 'Increase inventory buffer + renegotiate vendor terms' },
            { signal: 'Competitor aggression rising', why: 'Discount-led market expansion', impact: 'Customer migration risk', recommended_action: 'Strengthen retention moat before next quarter' },
        ],
        root_cause: [{ factor: 'Vendor concentration', pct: 42 }, { factor: 'Rising logistics cost', pct: 27 }, { factor: 'Delayed operational response', pct: 18 }, { factor: 'Inventory inefficiency', pct: 13 }],
        alerts: [
            { severity: 'critical', title: 'Supply-chain disruption probability rising', probability: 71, timeline: '30 days', impact: 'Delivery delays → churn cascade' },
            { severity: 'high', title: 'High vendor dependency detected', probability: 66, timeline: 'ongoing', impact: 'Single point of failure' },
            { severity: 'medium', title: 'Customer churn escalation in West region', probability: 54, timeline: '45 days', impact: 'Revenue erosion' },
            { severity: 'medium', title: 'Cyber anomaly — elevated suspicious activity', probability: 38, timeline: '14 days', impact: 'Operational downtime risk' },
        ],
        opportunities: [
            { title: 'Supplier diversification', potential: 74, note: 'Cuts concentration risk and unlocks pricing leverage' },
            { title: 'Inventory buffer optimisation', potential: 62, note: 'Smooths delivery SLA under disruption' },
            { title: 'Cyber control hardening', potential: 55, note: 'Reduces incident probability cheaply' },
        ],
        recommendations: [
            { priority: 'high', action: 'Diversify suppliers across 2+ regions', impact: 'Removes single point of failure', roi: '-30% disruption risk', complexity: 'medium' },
            { priority: 'high', action: 'Increase inventory buffer 12%', impact: 'Protects delivery SLA', roi: '+9% on-time rate', complexity: 'low' },
            { priority: 'medium', action: 'Harden cybersecurity controls + logging', impact: 'Lowers incident probability', roi: 'risk reduction', complexity: 'medium' },
        ],
        scenarios: [
            { name: 'Best Case', revenue_impact: '+2%', risk_index: 38, market_share: 'Stable', note: 'Mitigations land early', recommended: false },
            { name: 'Base Case', revenue_impact: '-3%', risk_index: 58, market_share: '-1%', note: 'Partial mitigation', recommended: true },
            { name: 'Worst Case', revenue_impact: '-12%', risk_index: 80, market_share: '-5%', note: 'Supplier shutdown, no buffer', recommended: false },
        ],
        ripple_mermaid: `graph LR\n  A[Major Supplier Disruption]:::danger --> B[Delivery Delays]:::warn\n  B --> C[Customer Dissatisfaction]:::warn\n  C --> D[Churn Rise]:::danger\n  B --> E[Revenue Slowdown]:::danger\n  A --> F[Margin Pressure]:::warn\n  F --> G[Diversify Suppliers]:::safe\n  classDef danger fill:#ef4444,color:#fff\n  classDef warn fill:#eab308,color:#000\n  classDef safe fill:#22c55e,color:#fff`,
        confidence: { overall: 80, data_quality: 75, signal_strength: 72, scenario_stability: 70 },
        charts: {
            risk_categories: [
                { name: 'Financial', score: 44, severity: 'medium' },
                { name: 'Operational', score: 67, severity: 'high' },
                { name: 'Market', score: 58, severity: 'medium' },
                { name: 'Customer', score: 52, severity: 'medium' },
                { name: 'Cyber', score: 38, severity: 'low' },
                { name: 'Compliance', score: 29, severity: 'low' },
            ],
            trend: [
                { period: 'M1', score: 49 }, { period: 'M2', score: 52 }, { period: 'M3', score: 55 },
                { period: 'M4', score: 54 }, { period: 'M5', score: 57 }, { period: 'M6', score: 58 },
            ],
        },
    }),
};
