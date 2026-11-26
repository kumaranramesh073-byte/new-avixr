/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON OCT — Vanguard Principle Agent
   Persona: Vanguard Boglehead / Long-term Stability Analyst
   Ignores short-term noise. Focuses on structural stability, compounding,
   and conservative steady growth. Counter-balances Bloomberg & BlackRock.
   ═══════════════════════════════════════════════════════════════════════════ */

import { callGroq, parseJSON } from '../groq.js';
import type { BloombergOutput } from './bloombergAgent.js';
import type { BlackRockOutput } from './blackrockAgent.js';

export interface VanguardAction {
    step: string;
    rationale: string;
    timeline: string;
}

export interface VanguardOutput {
    stability_score: number;
    long_term_outlook: string;
    actions: VanguardAction[];
    grounding_statement: string;
}

const VANGUARD_SYSTEM = `You are the Vanguard Principle Agent for Q-SIMUTRON, embodying the Vanguard investment philosophy.

PERSONA: Vanguard — The Boglehead. You are calm, rational, and long-term focused. You have survived every market cycle since 1975. You are the antidote to panic.

YOUR MISSION: Review the Bloomberg (short-term noise) and BlackRock (macro-risk) reports. Provide a grounding, long-term strategic counter-balance. Identify which threats are real versus which are market hysteria. Recommend low-cost, durable execution steps.

PHILOSOPHY FRAMEWORK:
1. IGNORE NOISE: Distinguish between short-term volatility and structural change
2. COMPOUND ADVANTAGE: What can we do TODAY that compounds positively over 3-5 years?
3. LOW-COST EXECUTION: Cheap, durable actions over expensive reactive maneuvers
4. STRUCTURAL MOATS: What structural advantages does the company have that competitors cannot easily replicate?
5. CONSERVATIVE CONFIDENCE: Be honest about uncertainty. Don't overclaim.

STABILITY SCORE: Rate 0-100. Higher = more structurally stable. This is NOT the inverse of the RPN — it measures your OWN structural durability, independent of short-term threats.

Return ONLY valid JSON matching this exact schema:
{
  "stability_score": <integer 0-100>,
  "long_term_outlook": "One paragraph Vanguard-style long-term outlook statement",
  "actions": [
    {"step": "Short action title", "rationale": "Why this is a durable long-term action", "timeline": "Q1 2026 / 6 months / etc."},
    {"step": "Short action title", "rationale": "Why this is a durable long-term action", "timeline": "..."},
    {"step": "Short action title", "rationale": "Why this is a durable long-term action", "timeline": "..."}
  ],
  "grounding_statement": "One-sentence Bogelhead-style reality check on the Bloomberg/BlackRock panic"
}`;

export async function runVanguardAgent(
    bloombergOutput: BloombergOutput,
    blackrockOutput: BlackRockOutput,
    userParams: Record<string, string>
): Promise<VanguardOutput> {
    console.log('[Vanguard Agent] Applying long-term stability framework...');

    const userPrompt = `COMPANY CONTEXT:
${userParams.companyName ? `Company: ${userParams.companyName}` : ''}
Industry: ${userParams.industry}
Growth Stage: ${userParams.growthStage}
Time Horizon: ${userParams.timeHorizon}
Strategic Priority: ${userParams.priority}
Risk Tolerance: ${userParams.riskTolerance}
Company Size: ${userParams.companySize}

BLOOMBERG REPORT (short-term):
Headline: ${bloombergOutput.headline}
Market Velocity: ${bloombergOutput.market_velocity}/100
Summary: ${bloombergOutput.raw_summary}

BLACKROCK ALADDIN REPORT (macro-risk):
Risk Priority Number: ${blackrockOutput.rpn}/100
Category: ${blackrockOutput.risk_category}
Capital Recommendation: ${blackrockOutput.capital_recommendation}
Key Ripple Effects:
${blackrockOutput.ripple_effects.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}

Now provide your Vanguard long-term stability assessment. Ground the team. Separate signal from noise. Give durable execution steps.`;

    let raw = '';
    try {
        raw = await callGroq(VANGUARD_SYSTEM, userPrompt, 1200);
    } catch (err: any) {
        console.warn(`[Vanguard Agent] LLM call failed (${err.message}) — using fallback.`);
    }

    const fallback: VanguardOutput = {
        stability_score: 67,
        long_term_outlook: `While Bloomberg signals elevated short-term volatility and BlackRock flags systemic risk, the structural fundamentals of a ${userParams.industry} business at the ${userParams.growthStage} stage remain intact. The market has been here before. Businesses that maintain disciplined execution through cycles emerge stronger.`,
        actions: [
            {
                step: 'Deepen Customer Retention Moat',
                rationale: 'Retention compounds over time and reduces dependency on expensive new customer acquisition during competitive downturns.',
                timeline: 'Next 90 days',
            },
            {
                step: 'Reduce Variable Cost Base',
                rationale: 'Structural efficiency creates optionality to invest opportunistically when competitors over-extend.',
                timeline: 'Q1 2026',
            },
            {
                step: 'Invest in Proprietary Data Advantage',
                rationale: 'Data assets built today compound into durable competitive moats that are structurally difficult for competitors to replicate.',
                timeline: '6–12 months',
            },
        ],
        grounding_statement: `Markets overreact to short-term news — the structural case for this business remains sound if execution discipline is maintained.`,
    };

    const parsed = parseJSON<VanguardOutput>(raw, fallback);
    parsed.stability_score = Math.max(0, Math.min(100, parsed.stability_score ?? 67));

    console.log(`[Vanguard Agent] Done. Stability score: ${parsed.stability_score}`);
    return parsed;
}
