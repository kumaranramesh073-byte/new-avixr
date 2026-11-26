// Mirror of the backend Standard Module Intelligence schema (moduleAgent.ts).
export interface ModuleKPI { label: string; value: number | string; unit?: string; trend: 'up' | 'down' | 'flat'; delta?: string; confidence?: number; }
export interface WhyItMatters { signal: string; why: string; impact: string; recommended_action: string; }
export interface RootCause { factor: string; pct: number; }
export interface ModuleAlert { severity: 'critical' | 'high' | 'medium' | 'low'; title: string; probability: number; timeline: string; impact: string; }
export interface ModuleOpportunity { title: string; potential: number; note: string; }
export interface ModuleRecommendation { priority: 'high' | 'medium' | 'low'; action: string; impact: string; roi: string; complexity: 'low' | 'medium' | 'high'; }
export interface ModuleScenario { name: string; revenue_impact: string; risk_index: number; market_share?: string; note: string; recommended?: boolean; }
export interface ModuleConfidence { overall: number; data_quality: number; signal_strength: number; scenario_stability: number; }
export interface TimelineEntry { horizon: string; outlook: string; events: string[] }
export interface Citation { url: string; title: string; snippet: string; relevance_score: number; }

export interface StandardModuleOutput {
    module: string;
    title: string;
    executive_summary: string;
    kpis: ModuleKPI[];
    why_it_matters: WhyItMatters[];
    root_cause: RootCause[];
    alerts: ModuleAlert[];
    opportunities: ModuleOpportunity[];
    recommendations: ModuleRecommendation[];
    scenarios: ModuleScenario[];
    ripple_mermaid: string;
    confidence: ModuleConfidence;
    timeline?: TimelineEntry[];
    charts?: Record<string, any>;
    company_name: string;
    generated_at: string;
    sources?: Citation[];
    grounded?: boolean;
}
