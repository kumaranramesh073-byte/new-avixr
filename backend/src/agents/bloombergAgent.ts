/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON OCT — Bloomberg Principle Agent
   Persona: Bloomberg Terminal / High-Frequency Trading Analyst
   Focuses on real-time market velocity, immediate competitor news,
   supply chain disruptions, and short-term capital flow signals.
   ═══════════════════════════════════════════════════════════════════════════ */

import { callGroq, parseJSON } from '../groq.js';

export interface BloombergThreat {
    signal: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    timestamp: string;
}

export interface BloombergOutput {
    headline: string;
    threats: BloombergThreat[];
    market_velocity: number;
    raw_summary: string;
}

const BLOOMBERG_SYSTEM = `You are the Bloomberg Principle Agent for Q-SIMUTRON, the world's most advanced market simulation engine.

PERSONA: Bloomberg Terminal — High-Frequency Trading Analyst & Real-Time Market Intelligence Layer.

YOUR MISSION: Analyze public market data, news, and competitor intelligence. Output strictly in terminal-style data points.

ANALYSIS FRAMEWORK:
1. Real-time market velocity signals (price movements, volume spikes, news cadence)
2. Immediate competitor tactical moves (pricing changes, product launches, M&A rumors, hiring signals)
3. Supply chain disruption indicators (raw material prices, logistics bottlenecks, port congestion)
4. Short-term capital flow signals (VC funding rounds, IPO filings, layoffs, insider selling)
5. Macro-economic micro-shocks (rate decisions, regulatory filings, earnings surprises)

OUTPUT RULES:
- Be surgical, brutal, and precise. No fluff. Terminal-style.
- Every threat must be actionable and time-sensitive.
- Assign SEVERITY: critical (act today), high (act this week), medium (monitor), low (awareness)
- Market velocity: 0-100 score reflecting how fast the market is moving

Return ONLY valid JSON matching this exact schema:
{
  "headline": "One-sentence terminal-style market headline summarizing the biggest immediate threat",
  "threats": [
    {"signal": "Specific, actionable threat description", "severity": "critical|high|medium|low", "timestamp": "Relative timestamp like '2h ago' or '14:32 EST'"},
    ... (3 to 5 threats total)
  ],
  "market_velocity": <integer 0-100>,
  "raw_summary": "2-3 sentence Bloomberg-style summary of the full intelligence picture"
}`;

export async function runBloombergAgent(
    publicDataContext: string,
    userParams: Record<string, string>
): Promise<BloombergOutput> {
    console.log('[Bloomberg Agent] Analyzing market velocity and competitor intelligence...');

    const userPrompt = `SIMULATION PARAMETERS:
${userParams.companyName ? `Target Company: ${userParams.companyName}${userParams.companyDescription ? ` (${userParams.companyDescription})` : ''}` : ''}
Industry: ${userParams.industry}
Primary Competitor Type: ${userParams.competitor}
Strategic Priority: ${userParams.priority}
Geography: ${userParams.geography}
Primary Threat: ${userParams.primaryThreat}

PUBLIC MARKET INTELLIGENCE (last 24 hours):
${publicDataContext || 'No live data available — generate realistic synthetic signals based on industry context.'}

Analyze the above and return your Bloomberg terminal assessment.`;

    let raw = '';
    try {
        raw = await callGroq(BLOOMBERG_SYSTEM, userPrompt, 1200);
    } catch (err: any) {
        console.warn(`[Bloomberg Agent] LLM call failed (${err.message}) — using fallback.`);
    }

    const fallback: BloombergOutput = {
        headline: `${userParams.industry} sector faces elevated volatility — competitor activity intensifying`,
        threats: [
            { signal: `Competitor pricing pressure detected in ${userParams.industry} vertical`, severity: 'high', timestamp: '2h ago' },
            { signal: `Market velocity spike: ${userParams.primaryThreat} signals elevated`, severity: 'critical', timestamp: '45m ago' },
            { signal: `Capital reallocation detected from growth to defensive positions`, severity: 'medium', timestamp: '6h ago' },
        ],
        market_velocity: 72,
        raw_summary: `${userParams.industry} market showing elevated activity. Competitor moves accelerating. Recommend immediate strategic review.`,
    };

    const parsed = parseJSON<BloombergOutput>(raw, fallback);

    // Clamp market_velocity to valid range
    parsed.market_velocity = Math.max(0, Math.min(100, parsed.market_velocity ?? 72));

    console.log(`[Bloomberg Agent] Done. Market velocity: ${parsed.market_velocity}, Threats: ${parsed.threats.length}`);
    return parsed;
}
