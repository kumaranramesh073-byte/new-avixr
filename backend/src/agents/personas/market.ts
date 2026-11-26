import { baseFallback, type ModulePersona } from '../moduleAgent.js';

export const marketPersona: ModulePersona = {
    module: 'market',
    title: 'Market Intelligence',
    persona: `PERSONA: AI-Powered Market & Competitor Heatmap System. You track macroeconomic shifts, industry trends, and competitor movements. You identify whitespace opportunities, measure market saturation, and highlight emerging threats before they become mainstream. You think like a top-tier strategy consultant at BCG or McKinsey.`,
    searchFocus: `the company's market share and competitive position, the total addressable market and industry growth trends, macroeconomic and regulatory shifts, and emerging technologies or consumer-behaviour changes affecting the sector`,
    chartsHint: `"market_share":[{"competitor":"You","share":0},{"competitor":"Rival A","share":0}],   // 4-5 competitors, sum to 100
    "trend_radar":[{"category":"Technology","score":0,"fullMark":100}],   // 5 categories (e.g. Tech, Regulatory, Consumer, Supply, ESG) score 0-100`,
    fallback: (company, industry) => baseFallback('market', 'Market Intelligence', company, {
        executive_summary: `The ${industry} market is experiencing rapid consolidation, with emerging technologies shifting consumer expectations. ${company} holds a stable market position, but mid-tier rivals are beginning to capture share through aggressive pricing. A window exists to capture adjacent whitespace before larger incumbents move in.`,
        kpis: [
            { label: 'Market Position', value: 24, unit: '%', trend: 'flat', delta: 'Stable', confidence: 85 },
            { label: 'Growth Velocity', value: 72, unit: '/100', trend: 'up', delta: 'High', confidence: 78 },
            { label: 'Trend Alignment', value: 68, unit: '/100', trend: 'up', delta: '+4pts', confidence: 72 },
            { label: 'Disruption Risk', value: 55, unit: '/100', trend: 'up', delta: 'Elevated', confidence: 65 },
        ],
        why_it_matters: [
            { signal: 'Mid-tier rival pricing aggression', why: 'Competitors attempting to buy market share', impact: 'Potential 2-3% margin erosion to defend', recommended_action: 'Hold premium pricing; bundle features instead of discounting' },
            { signal: 'Shift in consumer preferences', why: 'Demand for integrated/seamless solutions', impact: 'Legacy point-solutions face obsolescence', recommended_action: 'Accelerate product roadmap for integrations' },
            { signal: 'Consolidation wave', why: 'Macro tightening forcing M&A', impact: 'Rivals will gain scale advantages', recommended_action: 'Identify strategic acquisition targets or partnerships' },
        ],
        root_cause: [{ factor: 'Macro environment', pct: 40 }, { factor: 'Consumer shift', pct: 35 }, { factor: 'Competitor action', pct: 25 }],
        alerts: [
            { severity: 'high', title: 'Competitor product launch anticipated', probability: 65, timeline: '60 days', impact: 'Feature parity risk' },
            { severity: 'medium', title: 'Regulatory shift in key market', probability: 45, timeline: '90 days', impact: 'Compliance overhead increase' },
        ],
        opportunities: [
            { title: 'Adjacent market expansion', potential: 82, note: 'Leverage existing tech stack for new vertical' },
            { title: 'Strategic partnership', potential: 75, note: 'Counteract rival consolidation' },
            { title: 'Premium tier introduction', potential: 68, note: 'Capture inelastic demand segment' },
        ],
        recommendations: [
            { priority: 'high', action: 'Accelerate core product integration', impact: 'Defends against point-solution fatigue', roi: '+15% retention', complexity: 'high' },
            { priority: 'medium', action: 'Launch competitive intelligence sweep', impact: 'Early warning on pricing moves', roi: 'Margin protection', complexity: 'low' },
        ],
        scenarios: [
            { name: 'Aggressive Expansion', revenue_impact: '+15%', risk_index: 65, market_share: '+4%', note: 'Invest heavily in adjacent markets', recommended: false },
            { name: 'Defend & Deepen', revenue_impact: '+8%', risk_index: 40, market_share: '+1%', note: 'Focus on core customer success and retention', recommended: true },
            { name: 'Price War', revenue_impact: '-5%', risk_index: 75, market_share: '-2%', note: 'Matching competitor discounts', recommended: false },
        ],
        ripple_mermaid: `graph LR\n  A[Competitor Discounting]:::danger --> B[Market Commoditization]:::warn\n  B --> C[Margin Compression]:::danger\n  A --> D[Premium Churn Risk]:::warn\n  D --> E[Revenue Impact]:::danger\n  C --> F[Value Bundling Strategy]:::safe\n  classDef danger fill:#ef4444,color:#fff\n  classDef warn fill:#eab308,color:#000\n  classDef safe fill:#22c55e,color:#fff`,
        confidence: { overall: 75, data_quality: 80, signal_strength: 70, scenario_stability: 75 },
        charts: {
            market_share: [
                { competitor: company, share: 24 },
                { competitor: 'Rival Alpha', share: 31 },
                { competitor: 'Rival Beta', share: 18 },
                { competitor: 'Rival Gamma', share: 15 },
                { competitor: 'Others', share: 12 },
            ],
            trend_radar: [
                { category: 'Technology', score: 85, fullMark: 100 },
                { category: 'Regulatory', score: 45, fullMark: 100 },
                { category: 'Consumer', score: 78, fullMark: 100 },
                { category: 'Supply Chain', score: 60, fullMark: 100 },
                { category: 'ESG', score: 55, fullMark: 100 },
            ],
        },
    }),
};
