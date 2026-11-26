export interface Supplier {
    name: string;
    category: string;
    region: string;
    dependency: number;
    risk: 'high' | 'medium' | 'low';
    note: string;
}

export interface CompetitorProfile {
    name: string;
    positioning: string;
    threat: number;
    momentum: 'rising' | 'stable' | 'declining';
    recent_move: string;
    note: string;
}

export interface Opportunity {
    title: string;
    potential: number;
    note: string;
}

export interface EcosystemOutput {
    suppliers: Supplier[];
    competitors: CompetitorProfile[];
    opportunities: Opportunity[];
    supply_chain_mermaid: string;
    sector_breakdown: Array<{ name: string; value: number }>;
    financial_projection: Array<{ period: string; revenue: number; cost: number; profit: number }>;
    market_share: Array<{ name: string; value: number }>;
}

export interface SimulationResponse {
    market_score: number;
    competitor_threat: number;
    volatility_index: number;
    bloomberg_output: {
        headline: string;
        threats: Array<{ signal: string; severity: 'critical' | 'high' | 'medium' | 'low'; timestamp: string }>;
        market_velocity: number;
    };
    blackrock_output: {
        rpn: number;
        risk_category: string;
        ripple_effects: string[];
        capital_recommendation: string;
    };
    vanguard_output: {
        stability_score: number;
        actions: Array<{ step: string; rationale: string; timeline: string }>;
        long_term_outlook: string;
    };
    ecosystem_output: EcosystemOutput;
    company_name: string;
    mermaid_graph_code: string;
    generated_at: string;
}
