import { baseFallback, type ModulePersona } from '../moduleAgent.js';

export const competitorPersona: ModulePersona = {
    module: 'competitor',
    title: 'Competitor War Room',
    persona: `PERSONA: AI-Powered Competitive Intelligence Analyst. You reverse-engineer competitor strategies, dissect their product roadmaps, and identify their vulnerabilities. You track their hiring, pricing changes, and marketing messaging to predict their next moves. You think like a ruthless red-team strategist preparing for battle.`,
    searchFocus: `the company's main competitors and their recent strategic moves — product launches, pricing changes, funding, acquisitions, market-share shifts, hiring sprees, and head-to-head positioning against this company`,
    chartsHint: `"feature_parity":[{"feature":"Core Platform","us":100,"them":80}],   // 5 core features comparing 'us' vs 'them' (0-100)
    "pricing_map":[{"tier":"Starter","our_price":0,"their_price":0}]   // 3-4 pricing tiers`,
    fallback: (company, industry) => baseFallback('competitor', 'Competitor War Room', company, {
        executive_summary: `Key competitor 'Rival Alpha' is aggressively expanding their mid-market sales team and recently introduced a freemium tier, signaling a land-grab strategy. While ${company} maintains a clear advantage in enterprise features and reliability, we are vulnerable to pricing pressure at the lower end of the market. A defensive bundling strategy is required to protect our flank.`,
        kpis: [
            { label: 'Feature Dominance', value: 68, unit: '%', trend: 'down', delta: '-2pts', confidence: 85 },
            { label: 'Pricing Premium', value: 15, unit: '%', trend: 'up', delta: '+5%', confidence: 90 },
            { label: 'Competitor Velocity', value: 74, unit: '/100', trend: 'up', delta: 'High', confidence: 78 },
            { label: 'Win Rate vs Rivals', value: 52, unit: '%', trend: 'flat', delta: 'Stable', confidence: 82 },
        ],
        why_it_matters: [
            { signal: 'Rival Alpha launches freemium tier', why: 'Attempting to lower CAC and starve competitors of top-of-funnel leads', impact: 'Potential 10-15% drop in new inbound leads next quarter', recommended_action: 'Launch a aggressive counter-campaign highlighting hidden costs of their freemium tier' },
            { signal: 'Surge in competitor sales hiring', why: 'Gearing up for a Q4 enterprise push', impact: 'Increased competition in major account renewals', recommended_action: 'Pre-emptively lock in at-risk renewals with early-renewal discounts' },
        ],
        root_cause: [{ factor: 'Pricing Disadvantage', pct: 50 }, { factor: 'Feature Gap in Mobile', pct: 30 }, { factor: 'Marketing Spend Deficit', pct: 20 }],
        alerts: [
            { severity: 'high', title: 'Rival Alpha attacking our installed base', probability: 80, timeline: 'current', impact: 'Enterprise churn risk' },
            { severity: 'medium', title: 'Rival Beta acquired by larger incumbent', probability: 100, timeline: 'recent', impact: 'They now have deeper pockets for R&D' },
        ],
        opportunities: [
            { title: 'Capitalize on Rival Beta acquisition turbulence', potential: 85, note: 'Target their customers during their integration phase' },
            { title: 'Highlight our superior security compliance', potential: 70, note: 'Key differentiator that rivals lack' },
        ],
        recommendations: [
            { priority: 'high', action: 'Launch competitive displacement campaign against Rival Beta', impact: 'Poach customers frustrated by acquisition changes', roi: '+5% pipeline', complexity: 'low' },
            { priority: 'high', action: 'Create feature-gated lower tier to counter freemium', impact: 'Defends top-of-funnel without cannibalizing enterprise', roi: 'Lead protection', complexity: 'medium' },
            { priority: 'medium', action: 'Equip sales with updated kill-sheets', impact: 'Improves win rate in head-to-head deals', roi: '+2% win rate', complexity: 'low' },
        ],
        scenarios: [
            { name: 'Aggressive Counter', revenue_impact: '+5%', risk_index: 45, market_share: '+2%', note: 'Launch defensive tier and attack their base', recommended: true },
            { name: 'Hold the Line', revenue_impact: '-5%', risk_index: 30, market_share: '-1%', note: 'Ignore pricing pressure, focus purely on enterprise value', recommended: false },
            { name: 'Price War', revenue_impact: '-15%', risk_index: 80, market_share: 'Stable', note: 'Match their freemium tier dollar-for-dollar', recommended: false },
        ],
        ripple_mermaid: `graph LR\n  A[Rival Freemium Launch]:::danger --> B[Lead Volume Drop]:::warn\n  B --> C[Pipeline Shrinkage]:::danger\n  A --> D[Pricing Pressure]:::warn\n  D --> E[Counter-Campaign]:::safe\n  D --> F[Defensive Tier]:::safe\n  classDef danger fill:#ef4444,color:#fff\n  classDef warn fill:#eab308,color:#000\n  classDef safe fill:#22c55e,color:#fff`,
        confidence: { overall: 85, data_quality: 80, signal_strength: 88, scenario_stability: 85 },
        charts: {
            feature_parity: [
                { feature: 'Core Platform', us: 95, them: 85 },
                { feature: 'Enterprise Sec', us: 100, them: 60 },
                { feature: 'Integrations', us: 75, them: 90 },
                { feature: 'Analytics', us: 80, them: 70 },
                { feature: 'Mobile App', us: 40, them: 85 },
            ],
            pricing_map: [
                { tier: 'Starter', our_price: 49, their_price: 0 },
                { tier: 'Pro', our_price: 149, their_price: 99 },
                { tier: 'Business', our_price: 499, their_price: 399 },
                { tier: 'Enterprise', our_price: 1500, their_price: 2000 },
            ],
        },
    }),
};
