import { baseFallback, type ModulePersona } from '../moduleAgent.js';

export const sentimentPersona: ModulePersona = {
    module: 'sentiment',
    title: 'Customer Sentiment',
    persona: `PERSONA: AI-Powered Customer Intelligence & Churn Predictor. You analyze customer feedback, support tickets, and usage patterns to measure brand health. You detect early warning signs of churn and identify features that drive highest satisfaction. You think like a Chief Customer Officer obsessing over NPS, retention, and customer lifetime value.`,
    searchFocus: `current customer sentiment and brand perception for the company — app-store and review-site ratings, NPS or satisfaction reports, recent customer complaints, social-media reaction, and any notable PR or reputation events`,
    chartsHint: `"sentiment_trend":[{"period":"W1","positive":0,"neutral":0,"negative":0}],   // 6 weeks of sentiment composition
    "feedback_drivers":[{"theme":"Usability","score":0,"volume":0}]   // 5 key themes, score 0-100 (satisfaction), volume 0-100 (mentions)`,
    fallback: (company, industry) => baseFallback('sentiment', 'Customer Sentiment', company, {
        executive_summary: `${company} is maintaining strong overall customer satisfaction, largely driven by core product reliability. However, recent weeks show a slight uptick in negative sentiment regarding onboarding friction and support response times. Addressing these early friction points is critical to prevent mid-tier cohort churn.`,
        kpis: [
            { label: 'Net Promoter Score', value: 42, unit: 'NPS', trend: 'down', delta: '-3pts', confidence: 85 },
            { label: 'Retention Rate', value: 91, unit: '%', trend: 'flat', delta: 'Stable', confidence: 90 },
            { label: 'Brand Sentiment', value: 78, unit: '/100', trend: 'up', delta: '+2pts', confidence: 82 },
            { label: 'Churn Risk', value: 14, unit: '%', trend: 'up', delta: 'Elevated', confidence: 76 },
        ],
        why_it_matters: [
            { signal: 'Uptick in onboarding complaints', why: 'New feature rollout increased product complexity without sufficient documentation', impact: 'First 30-day churn risk rising for new cohorts', recommended_action: 'Deploy immediate guided onboarding tours and in-app tooltips' },
            { signal: 'Support response time frustration', why: 'Ticket volume outstripping current CS team capacity', impact: 'Eroding trust among highest-LTV enterprise accounts', recommended_action: 'Implement AI triage layer for tier-1 support tickets' },
        ],
        root_cause: [{ factor: 'Product Complexity', pct: 45 }, { factor: 'Support Delays', pct: 35 }, { factor: 'Pricing Confusion', pct: 20 }],
        alerts: [
            { severity: 'high', title: 'Enterprise cohort satisfaction drop', probability: 70, timeline: 'current', impact: 'Renewal risk for major accounts' },
            { severity: 'medium', title: 'Social media sentiment dip', probability: 60, timeline: '7 days', impact: 'Brand perception impact' },
        ],
        opportunities: [
            { title: 'Power-user advocacy program', potential: 85, note: 'Leverage highly satisfied segment for case studies and referrals' },
            { title: 'Self-serve knowledge base revamp', potential: 75, note: 'Deflect low-level support tickets to improve response times' },
        ],
        recommendations: [
            { priority: 'high', action: 'Launch guided onboarding for new UI', impact: 'Reduces time-to-value for new signups', roi: '-15% early churn', complexity: 'medium' },
            { priority: 'high', action: 'Deploy AI support chatbot', impact: 'Instantly resolves tier-1 queries', roi: '+30% CS efficiency', complexity: 'medium' },
            { priority: 'medium', action: 'Initiate enterprise health-check calls', impact: 'Proactively saves at-risk accounts', roi: 'Retention protection', complexity: 'low' },
        ],
        scenarios: [
            { name: 'CX Overhaul', revenue_impact: '+8%', risk_index: 35, market_share: '+1%', note: 'Aggressive investment in customer success and support tech', recommended: true },
            { name: 'Status Quo', revenue_impact: '-4%', risk_index: 60, market_share: '-1%', note: 'Current churn trajectory continues', recommended: false },
            { name: 'Feature Halt', revenue_impact: 'Stable', risk_index: 45, market_share: 'Stable', note: 'Stop new features to focus purely on stability/bugs', recommended: false },
        ],
        ripple_mermaid: `graph LR\n  A[Support Delays]:::warn --> B[Customer Frustration]:::warn\n  B --> C[Negative Reviews]:::danger\n  B --> D[Enterprise Churn]:::danger\n  D --> E[Revenue Hit]:::danger\n  A --> F[AI Triage System]:::safe\n  classDef danger fill:#ef4444,color:#fff\n  classDef warn fill:#eab308,color:#000\n  classDef safe fill:#22c55e,color:#fff`,
        confidence: { overall: 85, data_quality: 82, signal_strength: 88, scenario_stability: 80 },
        charts: {
            sentiment_trend: [
                { period: 'W1', positive: 65, neutral: 25, negative: 10 },
                { period: 'W2', positive: 68, neutral: 22, negative: 10 },
                { period: 'W3', positive: 62, neutral: 24, negative: 14 },
                { period: 'W4', positive: 60, neutral: 25, negative: 15 },
                { period: 'W5', positive: 55, neutral: 27, negative: 18 },
                { period: 'W6', positive: 58, neutral: 24, negative: 18 },
            ],
            feedback_drivers: [
                { theme: 'Core Reliability', score: 88, volume: 95 },
                { theme: 'Feature Depth', score: 75, volume: 60 },
                { theme: 'Onboarding', score: 45, volume: 80 },
                { theme: 'Support Speed', score: 42, volume: 85 },
                { theme: 'Pricing/Value', score: 65, volume: 50 },
            ],
        },
    }),
};
