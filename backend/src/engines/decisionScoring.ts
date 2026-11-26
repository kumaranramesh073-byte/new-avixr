/* ═══════════════════════════════════════════════════════════════════════════
   Qsimutron — Decision Scoring Engine
   Scores agent outputs on confidence, impact, urgency, and feasibility.
   Returns composite DecisionScore with ranked recommendations.
   ═══════════════════════════════════════════════════════════════════════════ */

import { callClaude, parseJSON } from '../groq.js';

export interface ScoreDimension {
    score: number;      // 0-100
    rationale: string;
}

export interface AIStrategy {
    id: string;
    type: string;
    title: string;
    description: string;
    metricLabel: string;
    metricValue: string;
    timeline: string;
    status: 'RECOMMENDED' | 'HIGH IMPACT' | 'OPPORTUNITY';
}

export interface DecisionScore {
    confidence: ScoreDimension;
    impact: ScoreDimension;
    urgency: ScoreDimension;
    feasibility: ScoreDimension;
    compositeScore: number;     // weighted average 0-100
    recommendation: string;
    executiveSummary: string;
    rank: 'EXECUTE_NOW' | 'PLAN_AND_EXECUTE' | 'MONITOR_AND_WAIT' | 'DEPRIORITIZE';
    strategies: AIStrategy[];
}

export async function scoreDecision(
    query: string,
    agentOutputs: Record<string, unknown>[],
    simulationSummary: string
): Promise<DecisionScore> {
    console.log(`[Engine] DecisionScoring: Scoring decision quality...`);

    const outputSummary = agentOutputs.map((o, i) => `Agent ${i + 1}: ${JSON.stringify(o).slice(0, 200)}`).join('\n');

    const raw = await callClaude(
        `You are the DECISION SCORING ENGINE for Qsimutron.
Score the quality and actionability of agent recommendations.
Return ONLY valid JSON (no markdown):
{
  "confidence": {"score": 0-100, "rationale": "Why this confidence level"},
  "impact": {"score": 0-100, "rationale": "Expected business impact"},
  "urgency": {"score": 0-100, "rationale": "Time sensitivity"},
  "feasibility": {"score": 0-100, "rationale": "Implementation difficulty"},
  "compositeScore": 0-100,
  "recommendation": "1-sentence action recommendation",
  "executiveSummary": "50-word executive summary",
  "rank": "EXECUTE_NOW|PLAN_AND_EXECUTE|MONITOR_AND_WAIT|DEPRIORITIZE",
  "strategies": [
    {
      "id": "1",
      "type": "PRIMARY STRATEGY",
      "title": "Strategy title",
      "description": "Strategy description",
      "metricLabel": "E.g. Risk reduction:",
      "metricValue": "30%",
      "timeline": "6 months",
      "status": "RECOMMENDED"
    },
    {
      "id": "2",
      "type": "ALTERNATIVE STRATEGY",
      "title": "Strategy title",
      "description": "Strategy description",
      "metricLabel": "E.g. Dependency reduction:",
      "metricValue": "30%",
      "timeline": "18 months",
      "status": "HIGH IMPACT"
    },
    {
      "id": "3",
      "type": "MARKET STRATEGY",
      "title": "Strategy title",
      "description": "Strategy description",
      "metricLabel": "E.g. ROI:",
      "metricValue": "25%",
      "timeline": "12 months",
      "status": "OPPORTUNITY"
    }
  ]
}
Scoring weights: Confidence 25%, Impact 35%, Urgency 20%, Feasibility 20%
rank rules: compositeScore >= 80 → EXECUTE_NOW, 60-79 → PLAN_AND_EXECUTE, 40-59 → MONITOR_AND_WAIT, <40 → DEPRIORITIZE
Provide exactly 3 strategic recommendations mapped to the specific user query.`,
        `Query: "${query}"\nSimulation: ${simulationSummary}\nAgent outputs:\n${outputSummary}`,
        500
    );

    try {
        return JSON.parse(raw.replace(/```json|```/g, '').trim()) as DecisionScore;
    } catch {
        return {
            confidence: { score: 65, rationale: 'Moderate data coverage' },
            impact: { score: 70, rationale: 'Significant operational relevance' },
            urgency: { score: 50, rationale: 'Standard timeline' },
            feasibility: { score: 75, rationale: 'Within current capabilities' },
            compositeScore: 66,
            recommendation: 'Proceed with planning phase before full execution.',
            executiveSummary: 'Analysis complete. Recommend structured review before implementation.',
            rank: 'PLAN_AND_EXECUTE',
            strategies: [
                {
                    id: '1',
                    type: 'PRIMARY STRATEGY',
                    title: 'Diversify sourcing channels immediately',
                    description: 'Establish new supplier relationships to reduce dependency and mitigate supply chain risks.',
                    metricLabel: 'Risk reduction:',
                    metricValue: '30%',
                    timeline: '6 months',
                    status: 'RECOMMENDED'
                },
                {
                    id: '2',
                    type: 'ALTERNATIVE STRATEGY',
                    title: 'Invest in vertical integration',
                    description: 'Develop in-house capabilities to create a circular supply chain and reduce raw material dependency.',
                    metricLabel: 'Dependency reduction:',
                    metricValue: '30%',
                    timeline: '18 months',
                    status: 'HIGH IMPACT'
                },
                {
                    id: '3',
                    type: 'MARKET STRATEGY',
                    title: 'Enter emerging markets',
                    description: 'Capitalize on emerging market opportunity with government subsidies and low competition.',
                    timeline: '12 months',
                    metricLabel: 'ROI:',
                    metricValue: '25%',
                    status: 'OPPORTUNITY'
                }
            ]
        };
    }
}
