/* ═══════════════════════════════════════════════════════════════════════════
   Qsimutron — Intent & Goal Engine
   Classifies user queries into intent categories, extracts entities,
   time horizons, and priority signals for intelligent agent routing.
   ═══════════════════════════════════════════════════════════════════════════ */

import { callClaude, parseJSON } from '../groq.js';

export interface QueryIntent {
    primaryIntent: 'forecast' | 'financial' | 'strategic' | 'risk' | 'operational' | 'general';
    confidence: number;
    entities: string[];
    timeHorizon: 'immediate' | 'short-term' | 'mid-term' | 'long-term';
    priority: 'critical' | 'high' | 'medium' | 'low';
    suggestedAgents: string[];
    keywords: string[];
}

export async function classifyIntent(query: string): Promise<QueryIntent> {
    console.log(`[Engine] IntentEngine: Classifying query intent...`);

    const raw = await callClaude(
        `You are the INTENT & GOAL ENGINE for Qsimutron. Classify user queries precisely.
Return ONLY valid JSON (no markdown):
{
  "primaryIntent": "forecast|financial|strategic|risk|operational|general",
  "confidence": 0.0-1.0,
  "entities": ["extracted entity names"],
  "timeHorizon": "immediate|short-term|mid-term|long-term",
  "priority": "critical|high|medium|low",
  "suggestedAgents": ["PredictiveAnalysis","Finance","StrategyOptimization","RiskSynthesis","Personalization"],
  "keywords": ["key","terms"]
}

Agent routing rules:
- forecast/prediction/trend/anomaly → PredictiveAnalysis
- revenue/cost/ROI/budget/P&L/cashflow → Finance
- optimize/strategy/scenario/trade-off → StrategyOptimization
- risk/compliance/threat/failure/vulnerability → RiskSynthesis
- Always include Personalization as the LAST agent for final output adaptation
- suggestedAgents should list 2-4 agents in execution order`,
        query,
        400
    );

    console.log(`[Engine] IntentEngine: Raw response received (length: ${raw.length})`);
    if (raw.length < 50) console.log(`[Engine] IntentEngine: Raw response snippet: "${raw}"`);


    return parseJSON<QueryIntent>(raw, {
        primaryIntent: 'general',
        confidence: 0.5,
        entities: [],
        timeHorizon: 'mid-term',
        priority: 'medium',
        suggestedAgents: ['PredictiveAnalysis', 'Personalization'],
        keywords: query.split(' ').slice(0, 5),
    });
}
