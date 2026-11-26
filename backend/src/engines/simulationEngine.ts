/* ═══════════════════════════════════════════════════════════════════════════
   Qsimutron — Core Simulation Engine
   Causal Graph + Ripple Effect + Probabilistic Layer.
   Takes agent outputs and enriches them with causal chain annotations.
   ═══════════════════════════════════════════════════════════════════════════ */

import { callClaude } from '../groq.js';

export interface CausalLink {
    from: string;
    to: string;
    strength: number;   // 0-1
    direction: 'positive' | 'negative' | 'neutral';
    lag: string;         // e.g. "2-4 weeks"
}

export interface RippleEffect {
    trigger: string;
    primaryImpact: string;
    secondaryEffects: string[];
    magnitude: number;   // 0-1
}

export interface SimulationResult {
    causalChain: CausalLink[];
    rippleEffects: RippleEffect[];
    systemStability: number;  // 0-1, how stable the overall system is
    criticalPaths: string[];
    summary: string;
}

export async function runSimulation(
    query: string,
    agentOutputs: Record<string, unknown>[]
): Promise<SimulationResult> {
    console.log(`[Engine] SimulationEngine: Running causal graph simulation...`);

    const outputSummary = agentOutputs.map((o, i) => `Step ${i + 1}: ${JSON.stringify(o).slice(0, 300)}`).join('\n');

    const raw = await callClaude(
        `You are the CORE SIMULATION ENGINE for Qsimutron. You run causal graph analysis.
Given multiple agent outputs, identify cause-and-effect relationships and ripple effects.
Return ONLY valid JSON (no markdown):
{
  "causalChain": [{"from":"VariableA","to":"VariableB","strength":0.8,"direction":"positive","lag":"2 weeks"}],
  "rippleEffects": [{"trigger":"Event","primaryImpact":"Direct effect","secondaryEffects":["Indirect1","Indirect2"],"magnitude":0.7}],
  "systemStability": 0.75,
  "criticalPaths": ["Path description"],
  "summary": "2-sentence synthesis of system dynamics"
}
Rules:
- Identify 3-5 causal links
- Identify 2-3 ripple effects
- systemStability: 1.0 = fully stable, 0.0 = system collapse imminent
- criticalPaths: the dependency chains most likely to cause failure`,
        `Original query: "${query}"\nAgent outputs:\n${outputSummary}`,
        700
    );

    try {
        return JSON.parse(raw.replace(/```json|```/g, '').trim()) as SimulationResult;
    } catch {
        return {
            causalChain: [],
            rippleEffects: [],
            systemStability: 0.7,
            criticalPaths: ['Unable to compute critical paths from available data'],
            summary: 'Simulation completed with limited causal inference from available agent outputs.',
        };
    }
}
