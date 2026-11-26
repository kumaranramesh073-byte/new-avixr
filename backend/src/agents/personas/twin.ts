import { baseFallback, type ModulePersona } from '../moduleAgent.js';

export const twinPersona: ModulePersona = {
    module: 'twin',
    title: 'Digital Twin',
    persona: `PERSONA: AI-Powered Digital Twin & Operational Optimizer. You simulate the inner workings of the company's operations, supply chain, and resource allocation. You find bottlenecks before they cause delays and model the impact of operational changes. You think like an elite COO obsessed with efficiency, throughput, and system stability.`,
    searchFocus: `the company's operations, supply chain, workforce and hiring, capacity and logistics, and any reported operational bottlenecks, facility expansions, layoffs, outages, or efficiency and automation initiatives`,
    chartsHint: `"resource_utilization":[{"department":"Engineering","load":0,"capacity":100}],   // 4-5 departments, load vs capacity (0-100)
    "bottleneck_impact":[{"process":"Code Review","delay_hours":0,"cost_impact":0}]   // 3 top bottlenecks`,
    fallback: (company, industry) => baseFallback('twin', 'Digital Twin', company, {
        executive_summary: `${company}'s operational throughput is currently constrained by engineering delivery speed, specifically around QA and release cycles. While resource utilization is high across the board, the compounding effect of these bottlenecks is adding ~15% to time-to-market. Rebalancing resources toward automation and QA will unlock significant capacity without adding headcount.`,
        kpis: [
            { label: 'System Throughput', value: 82, unit: '%', trend: 'flat', delta: 'Stable', confidence: 85 },
            { label: 'Resource Utilization', value: 94, unit: '%', trend: 'up', delta: 'High', confidence: 90 },
            { label: 'Bottleneck Severity', value: 68, unit: '/100', trend: 'up', delta: 'Elevated', confidence: 82 },
            { label: 'Time-to-Market', value: 45, unit: 'days', trend: 'down', delta: '+5 days', confidence: 78 },
        ],
        why_it_matters: [
            { signal: 'Resource Utilization at 94%', why: 'Running too hot with zero slack for unexpected issues', impact: 'High risk of burnout and cascading delays if a single system fails', recommended_action: 'Reduce active project WIP (Work In Progress) by 20% to create buffer' },
            { signal: 'QA bottleneck adding 5 days to release', why: 'Manual testing processes scaling poorly with new feature volume', impact: 'Delayed revenue recognition and slower feedback loops', recommended_action: 'Invest immediately in end-to-end testing automation' },
        ],
        root_cause: [{ factor: 'Manual QA Processes', pct: 45 }, { factor: 'Context Switching', pct: 35 }, { factor: 'Tech Debt', pct: 20 }],
        alerts: [
            { severity: 'high', title: 'Engineering capacity critically constrained', probability: 85, timeline: 'current', impact: 'Missed product deadlines' },
            { severity: 'medium', title: 'Cloud infrastructure costs spiking', probability: 70, timeline: '30 days', impact: 'Margin erosion due to inefficient queries' },
        ],
        opportunities: [
            { title: 'CI/CD Pipeline Optimization', potential: 88, note: 'Can reduce build times by 40% with parallelization' },
            { title: 'Asynchronous Work Policies', potential: 65, note: 'Reduce meeting load to increase deep work hours' },
        ],
        recommendations: [
            { priority: 'high', action: 'Implement strict WIP limits across engineering', impact: 'Reduces context switching and improves flow', roi: '+15% throughput', complexity: 'low' },
            { priority: 'high', action: 'Automate top 3 manual regression tests', impact: 'Unblocks the primary delivery bottleneck', roi: '-3 days TTM', complexity: 'medium' },
            { priority: 'medium', action: 'Audit and optimize cloud resource allocation', impact: 'Brings infrastructure costs back to baseline', roi: '-10% cloud spend', complexity: 'medium' },
        ],
        scenarios: [
            { name: 'Process Automation', revenue_impact: '+5%', risk_index: 30, market_share: '+1%', note: 'Invest in internal tooling and QA automation', recommended: true },
            { name: 'Hiring Spree', revenue_impact: '+2%', risk_index: 60, market_share: 'Stable', note: 'Throwing bodies at the problem increases communication overhead initially', recommended: false },
            { name: 'Do Nothing', revenue_impact: '-8%', risk_index: 85, market_share: '-2%', note: 'System grinds to a halt under load; key engineers churn', recommended: false },
        ],
        ripple_mermaid: `graph LR\n  A[Manual QA Process]:::danger --> B[Release Delays]:::warn\n  B --> C[Delayed Revenue]:::danger\n  A --> D[Engineering Frustration]:::warn\n  D --> E[Burnout & Churn]:::danger\n  A --> F[Test Automation]:::safe\n  F --> G[Increased Throughput]:::safe\n  classDef danger fill:#ef4444,color:#fff\n  classDef warn fill:#eab308,color:#000\n  classDef safe fill:#22c55e,color:#fff`,
        confidence: { overall: 85, data_quality: 90, signal_strength: 82, scenario_stability: 85 },
        charts: {
            resource_utilization: [
                { department: 'Engineering', load: 98, capacity: 100 },
                { department: 'Product', load: 85, capacity: 100 },
                { department: 'Design', load: 75, capacity: 100 },
                { department: 'Marketing', load: 60, capacity: 100 },
                { department: 'Sales', load: 80, capacity: 100 },
            ],
            bottleneck_impact: [
                { process: 'QA/Testing', delay_hours: 120, cost_impact: 45000 },
                { process: 'Code Review', delay_hours: 45, cost_impact: 18000 },
                { process: 'Design Handoff', delay_hours: 24, cost_impact: 8000 },
            ],
        },
    }),
};
