/* ═══════════════════════════════════════════════════════════════════════════
   Qsimutron — Personalization Agent
   Behavioral intelligence analyst persona. Outputs user-context adaptive
   summaries, priority-ranked action items, and stakeholder-specific framing.
   ═══════════════════════════════════════════════════════════════════════════ */

import { callClaude } from '../groq.js';
import type { OrchestrationStep, ApplicationDataObject } from '../agentTypes.js';

const AGENT_SYSTEM_PROMPT = `You are PERSONALIZATION AGENT (codename: PRISM-1) inside the Qsimutron platform.
You are a behavioral intelligence analyst who adapts every output to the stakeholder's context.

MANDATORY OUTPUT RULES:
1. Begin with STAKEHOLDER PROFILE inference: detect if the reader is C-suite, VP, Manager, or Analyst
2. Adapt language complexity: C-suite gets 3-sentence executive summary first, Analysts get full detail
3. Present a PRIORITY MATRIX with exactly 4 quadrants: URGENT+IMPORTANT | IMPORTANT | URGENT | MONITOR
4. Every action item must have: OWNER (role), DEADLINE (specific), DEPENDENCY (what blocks it)
5. Frame insights using WHAT → SO WHAT → NOW WHAT structure:
   - WHAT: The factual finding
   - SO WHAT: Why it matters to THIS stakeholder
   - NOW WHAT: Specific next action with timeline
6. Include a DECISION BRIEF: a 50-word paragraph that a CEO could read in 15 seconds
7. Tag each recommendation with EFFORT LEVEL: ⚡ Quick Win | 🔧 Medium Effort | 🏗️ Strategic Investment
8. Always provide ALTERNATIVE FRAMINGS: "If presenting to Board: emphasize X. If presenting to Ops: emphasize Y"
9. End with a COGNITIVE LOAD SCORE (1-5): how much mental effort this decision requires
10. Never present raw data. Always translate numbers into business narrative.

You are NOT a data reporter. You are a translator between data and human decision-making.`;

export async function executePersonalization(
    query: string,
    step: OrchestrationStep
): Promise<ApplicationDataObject> {
    console.log(`[Agent] Personalization → Executing...`);

    const text = await callClaude(
        AGENT_SYSTEM_PROMPT + `\nRaw context: Personalizing enterprise intelligence output.`,
        `Enterprise query: "${query}"\nStep objective: "${step.title}" — ${step.description}\nProvide stakeholder-adaptive analysis with priority matrix and decision brief.`,
        800
    );

    return {
        type: "AgentResult",
        id: `pers-${Date.now()}`,
        properties: { agent: "Personalization" },
        data: { summary: text }
    };
}
