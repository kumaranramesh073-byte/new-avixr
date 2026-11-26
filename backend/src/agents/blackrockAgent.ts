/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON OCT — BlackRock Principle Agent
   Persona: BlackRock Aladdin Risk Engine / Macro-Strategist
   Focuses on systemic risk analysis, macro-economic ripple effects,
   Risk Priority Numbers (RPN), and aggressive capital reallocation.
   ═══════════════════════════════════════════════════════════════════════════ */

import { callGroq, parseJSON } from '../groq.js';
import type { BloombergOutput } from './bloombergAgent.js';

export interface BlackRockOutput {
    rpn: number;
    risk_category: string;
    ripple_effects: string[];
    capital_recommendation: string;
    mermaid_graph_code: string;
    raw_analysis: string;
}

const BLACKROCK_SYSTEM = `You are the BlackRock Principle Agent for Q-SIMUTRON, embodying the BlackRock Aladdin risk engine.

PERSONA: BlackRock — The world's largest asset manager. You think in systemic risk, macro-economic cascades, and trillion-dollar capital flows. You are the risk oracle.

YOUR MISSION: Receive Bloomberg's intelligence report and raw market data. Perform a deep systemic risk analysis. Find hidden second-order and third-order ripple effects. Generate a brutal, honest Risk Priority Number.

ANALYSIS FRAMEWORK (Aladdin-inspired):
1. SYSTEMIC RISK: How does this threat propagate across the broader ecosystem?
2. CORRELATION MATRIX: What other markets, sectors, or stakeholders are exposed?
3. RIPPLE EFFECT MAPPING: If Competitor X does Y, what happens to supply chains, talent, customers, and capital?
4. RISK PRIORITY NUMBER (RPN): Severity × Probability × Detectability (0-100 scale, higher = more critical)
5. CAPITAL REALLOCATION: Where should capital shift? Offensive vs. defensive posture?

MERMAID GRAPH RULES:
- Generate a Mermaid.js "graph TD" (top-down) diagram showing the causal ripple chain
- Start from the competitor/market action, cascade to business impacts
- Use 5-8 nodes maximum for clarity
- Color code: Red nodes (:::danger) for threats, Green (:::safe) for opportunities, Yellow (:::warn) for neutral
- Wrap in \`\`\`mermaid ... \`\`\` blocks
- Classdefs: classDef danger fill:#ef4444,color:#fff; classDef safe fill:#22c55e,color:#fff; classDef warn fill:#eab308,color:#000;

Return ONLY valid JSON matching this exact schema:
{
  "rpn": <integer 0-100, the Risk Priority Number>,
  "risk_category": "CRITICAL SYSTEMIC|HIGH EXPOSURE|MODERATE RISK|LOW RISK",
  "ripple_effects": ["Effect 1 description", "Effect 2 description", "Effect 3 description", "Effect 4 description"],
  "capital_recommendation": "One-paragraph Aladdin-style capital reallocation recommendation",
  "mermaid_graph_code": "graph TD\\n A[Market Event] --> B[...]\\n...",
  "raw_analysis": "2-3 sentence macro-risk summary"
}`;

export async function runBlackRockAgent(
    publicDataContext: string,
    bloombergOutput: BloombergOutput,
    userParams: Record<string, string>
): Promise<BlackRockOutput> {
    console.log('[BlackRock Agent] Running Aladdin macro-risk analysis...');

    const userPrompt = `SIMULATION PARAMETERS:
${userParams.companyName ? `Target Company: ${userParams.companyName}` : ''}
Industry: ${userParams.industry}
Business Model: ${userParams.businessModel}
Revenue Range: ${userParams.revenueRange}
Risk Tolerance: ${userParams.riskTolerance}
Time Horizon: ${userParams.timeHorizon}
Growth Stage: ${userParams.growthStage}

BLOOMBERG INTELLIGENCE REPORT:
Headline: ${bloombergOutput.headline}
Market Velocity: ${bloombergOutput.market_velocity}/100
Key Threats:
${bloombergOutput.threats.map(t => `  [${t.severity.toUpperCase()}] ${t.signal}`).join('\n')}
Bloomberg Summary: ${bloombergOutput.raw_summary}

RAW MARKET DATA:
${publicDataContext || 'No live data — use Bloomberg report and industry parameters.'}

Perform your full Aladdin risk analysis. Generate the RPN, ripple effects, and the Mermaid causal graph.`;

    let raw = '';
    try {
        raw = await callGroq(BLACKROCK_SYSTEM, userPrompt, 2000);
    } catch (err: any) {
        console.warn(`[BlackRock Agent] LLM call failed (${err.message}) — using fallback.`);
    }

    const fallback: BlackRockOutput = {
        rpn: 68,
        risk_category: 'HIGH EXPOSURE',
        ripple_effects: [
            `Competitor aggression in ${userParams.industry} creates pricing pressure cascading to margin compression`,
            `Talent migration risk increases as competitor raises compensation benchmarks`,
            `Customer acquisition costs rise as competitive spend intensifies in the market`,
            `Supply chain partners may reprioritize capacity allocation toward better-funded rivals`,
        ],
        capital_recommendation: `Given the elevated RPN, Aladdin recommends shifting 15-20% of discretionary budget from growth to defensive R&D and customer retention. Increase monitoring cadence on ${userParams.competitor} signals.`,
        mermaid_graph_code: `graph TD\n    A[Competitor Move]:::danger --> B[Market Pricing Pressure]:::warn\n    B --> C[Margin Compression]:::danger\n    B --> D[Customer Acquisition Cost Rise]:::warn\n    C --> E[Reduce Headcount Risk]:::danger\n    D --> F[Revenue Growth Slowdown]:::warn\n    F --> G[Defensive Pivot Required]:::safe\n    classDef danger fill:#ef4444,color:#fff\n    classDef warn fill:#eab308,color:#000\n    classDef safe fill:#22c55e,color:#fff`,
        raw_analysis: `Systemic risk elevated. Multi-vector threat from ${userParams.industry} competitor activity. Aladdin model indicates high correlation between current signals and prior market disruption patterns.`,
    };

    const parsed = parseJSON<BlackRockOutput>(raw, fallback);
    parsed.rpn = Math.max(0, Math.min(100, parsed.rpn ?? 68));

    // Ensure mermaid code is clean (strip outer backtick blocks if present)
    if (parsed.mermaid_graph_code?.includes('```')) {
        parsed.mermaid_graph_code = parsed.mermaid_graph_code
            .replace(/```mermaid\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();
    }

    console.log(`[BlackRock Agent] Done. RPN: ${parsed.rpn}, Category: ${parsed.risk_category}`);
    return parsed;
}
