import { baseFallback, type ModulePersona } from '../moduleAgent.js';

export const advisorPersona: ModulePersona = {
    module: 'advisor',
    title: 'AI Advisor',
    persona: `PERSONA: AI-Powered Executive Advisor & Synthesizer. You sit above all other intelligence modules. You read the outputs from Forecasting, Risk, Market, Finance, Sentiment, and Competitor modules, and you synthesize them into a single, coherent, CEO-level strategy. You identify conflicting signals (e.g., Finance wants cuts, Market wants growth) and propose the optimal trade-off. You think like a seasoned Board Member or CEO whispering in the leader's ear.`,
    searchFocus: `the company's latest financial performance and revenue/growth, market position and market share, top competitors and their recent strategic moves, key business and regulatory risks, and the overall industry outlook`,
    chartsHint: `"priority_matrix":[{"initiative":"Expand to Europe","impact":0,"effort":0}],   // 4-5 strategic initiatives, mapped on impact vs effort (0-100)
    "cross_module_conflicts":[{"conflict":"Growth vs Margin","severity":0,"resolution":"Balanced"}],   // 2-3 highest level strategic tensions
    "decision_comparison":[{"name":"Do Nothing","revenue_impact":"-12%","risk_index":72,"market_share":"-5%","status":"not_recommended","note":"..."},{"name":"Recommended Path","revenue_impact":"+4%","risk_index":50,"market_share":"Stable","status":"recommended","note":"..."},{"name":"Optimal Strategy","revenue_impact":"+9%","risk_index":42,"market_share":"+6%","status":"optimal","note":"..."}]   // exactly 3 scenarios: status must be not_recommended | recommended | optimal`,
    fallback: (company, industry) => baseFallback('advisor', 'AI Advisor', company, {
        executive_summary: `Synthesizing intelligence across all operational vectors, ${company} is at a strategic inflection point. We are seeing a classic tension between the Market Intel mandate to capture whitespace and the Financial Engine's mandate to defend EBITDA. Given the competitive pressure from Rival Alpha's freemium tier, the optimal path is a surgical, defensive product bundling strategy that protects the core installed base without requiring massive new CapEx.`,
        kpis: [
            { label: 'Strategy Coherence', value: 85, unit: '%', trend: 'up', delta: 'Strong', confidence: 90 },
            { label: 'Execution Readiness', value: 62, unit: '/100', trend: 'flat', delta: 'Moderate', confidence: 80 },
            { label: 'Risk/Reward Ratio', value: 2.4, unit: 'x', trend: 'down', delta: 'Favorable', confidence: 85 },
            { label: 'AI Confidence', value: 88, unit: '%', trend: 'up', delta: '+2pts', confidence: 88 },
        ],
        why_it_matters: [
            { signal: 'Conflicting mandates: Growth vs Profitability', why: 'Competitor moves demand response, but macro environment penalizes cash burn', impact: 'Risk of strategic paralysis or executing poorly on both fronts', recommended_action: 'Commit to the "Defend & Deepen" scenario; pause risky adjacencies' },
            { signal: 'Engineering bottleneck (Digital Twin)', why: 'QA delays are slowing time-to-market', impact: 'Directly undermines the ability to execute the defensive product bundling strategy', recommended_action: 'Elevate QA automation to a Board-level priority' },
        ],
        root_cause: [{ factor: 'Market Transition', pct: 40 }, { factor: 'Internal Misalignment', pct: 35 }, { factor: 'Resource Constraints', pct: 25 }],
        alerts: [
            { severity: 'critical', title: 'Strategic misalignment between Sales and Product', probability: 85, timeline: 'current', impact: 'Wasted effort on wrong features' },
            { severity: 'high', title: 'Competitor speed advantage', probability: 75, timeline: 'ongoing', impact: 'First-mover disadvantage in key segments' },
        ],
        opportunities: [
            { title: 'Unified Pricing & Packaging Overhaul', potential: 90, note: 'Solves both the competitor threat and the margin pressure simultaneously' },
            { title: 'Strategic M&A', potential: 60, note: 'Acquire smaller QA automation tool to solve internal bottleneck and sell externally' },
        ],
        recommendations: [
            { priority: 'high', action: 'Align Executive Team on "Defend & Deepen" mandate', impact: 'Creates unified focus and stops shadow projects', roi: 'Strategic clarity', complexity: 'medium' },
            { priority: 'high', action: 'Greenlight the Pricing/Packaging Overhaul', impact: 'Counters rival freemium while protecting EBITDA', roi: '+8% Revenue', complexity: 'high' },
            { priority: 'medium', action: 'Reallocate 15% of R&D to Internal Tooling', impact: 'Unblocks the Digital Twin throughput constraint', roi: '-20% Time-to-Market', complexity: 'low' },
        ],
        scenarios: [
            { name: 'Unified Defense (Recommended)', revenue_impact: '+8%', risk_index: 35, market_share: '+1%', note: 'Focus on core, optimize pricing, fix bottlenecks', recommended: true },
            { name: 'Aggressive Counter-Attack', revenue_impact: '+15%', risk_index: 75, market_share: '+4%', note: 'Launch freemium, burn cash, high execution risk', recommended: false },
            { name: 'Pure Profit Focus', revenue_impact: '-5%', risk_index: 40, market_share: '-3%', note: 'Cut all R&D, milk the cash cow, slowly lose share', recommended: false },
        ],
        ripple_mermaid: `graph LR\n  A[Executive Misalignment]:::danger --> B[Resource Fragmentation]:::warn\n  B --> C[Slow Time-to-Market]:::danger\n  C --> D[Competitor Advantage]:::danger\n  A --> E[Unified Strategy Mandate]:::safe\n  E --> F[Focused Execution]:::safe\n  F --> G[Margin Protection]:::safe\n  classDef danger fill:#ef4444,color:#fff\n  classDef warn fill:#eab308,color:#000\n  classDef safe fill:#22c55e,color:#fff`,
        confidence: { overall: 88, data_quality: 85, signal_strength: 90, scenario_stability: 88 },
        charts: {
            priority_matrix: [
                { initiative: 'Pricing Overhaul', impact: 90, effort: 75 },
                { initiative: 'QA Automation', impact: 85, effort: 40 },
                { initiative: 'Freemium Launch', impact: 70, effort: 95 },
                { initiative: 'EU Expansion', impact: 60, effort: 85 },
                { initiative: 'Customer Health Checks', impact: 50, effort: 20 },
            ],
            cross_module_conflicts: [
                { conflict: 'Growth vs Margin', severity: 85, resolution: 'Balanced' },
                { conflict: 'Speed vs Stability', severity: 70, resolution: 'Lean to Stability' },
            ],
            decision_comparison: [
                { name: 'Do Nothing',           revenue_impact: '-12%', risk_index: 72, market_share: '-5%',    status: 'not_recommended', note: 'Status quo accelerates market share erosion and cash burn' },
                { name: 'Diversify Supply',     revenue_impact: '+4%',  risk_index: 50, market_share: 'Stable', status: 'recommended',     note: 'Reduces single-supplier dependency, stabilises margins' },
                { name: 'Optimal Path',         revenue_impact: '+9%',  risk_index: 42, market_share: '+6%',    status: 'optimal',         note: 'Highest upside with manageable risk — execute in parallel tracks' },
            ],
        },
    }),
};
