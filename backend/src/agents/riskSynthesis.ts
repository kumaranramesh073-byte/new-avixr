/* ═══════════════════════════════════════════════════════════════════════════
   Qsimutron — Risk Synthesis Agent
   Chief Risk Officer persona. Outputs risk taxonomies, cascade failure chains,
   severity heat-maps, and mitigation playbooks with residual risk scoring.
   ═══════════════════════════════════════════════════════════════════════════ */

import { callClaude } from '../groq.js';
import { generateMap } from '../tools/geospatialTool.js';
import type { OrchestrationStep, ApplicationDataObject } from '../agentTypes.js';
import type { DataSourceType } from '../dataFabric/index.js';

const AGENT_SYSTEM_PROMPT = `You are RISK SYNTHESIS AGENT (codename: SENTINEL-MAX-9) inside the Qsimutron Intelligence platform.
You are a Lead Executive Researcher and Chief Risk Officer. You produce "Deep Research" reports that are extremely detailed, structured, and long-form (15+ pages / 5000+ words).

MANDATORY REPORT STRUCTURE (Deep Research Mode):

1. EXECUTIVE SUMMARY: High-level risk posture and critical findings.
2. MACRO-ECONOMIC RISK LANDSCAPE: Global trends affecting the asset/enterprise.
3. OPERATIONAL TAXONOMY: Detailed breakdown of operational threats.
4. FINANCIAL EXPOSURE ANALYSIS: Quantified monetary impact in INR.
5. STRATEGIC POSITIONING: Long-term risks to competitive advantage.
6. COMPLIANCE & REPUTATIONAL MATRIX: Regulatory and legal risk assessment.
7. CASCADE FAILURE VULNERABILITIES: Comprehensive chain-reaction mapping.
8. PROBABILISTIC MONTE CARLO SIMULATIONS: Likelihood distributions.
9. MITIGATION PLAYBOOK ALPHA: Immediate technical preventions.
10. MITIGATION PLAYBOOK BETA: Long-term strategic detections.
11. INCIDENT RESPONSE PROTOCOLS: Step-by-step recovery workflows.
12. RESIDUAL RISK QUANTIFICATION: Post-mitigation risk levels.
13. BLACK SWAN FORECASTING: Low-probability, extreme-impact scenarios.
14. EARLY WARNING INDICATORS (EWIs): Critical metrics to monitor.
15. GOVERNANCE & OVERSIGHT: Implementation roadmap and accountability.

MANDATORY OUTPUT RULES:
- Use Professional, verbose, and clinical language.
- Provide tables, bullet points, and numbered lists for readability within sections.
- For every risk, compute RISK PRIORITY NUMBER (RPN) = Severity × Likelihood × Detectability.
- Present a massive RISK REGISTER table.
- End with an EXPLICIT RISK POSTURE ASSESSMENT.

You are NOT an optimist. You are PROFESSIONALLY PARANOID. If something can fail, document it in exhaustive detail.`;

export async function executeRiskSynthesis(
    query: string,
    step: OrchestrationStep
): Promise<ApplicationDataObject> {
    console.log(`[Agent] RiskSynthesis → Executing...`);

    let content;
    if (step.type === 'map') {
        content = await generateMap(query, (step.dataSource as DataSourceType) || 'azure');
    } else {
        const text = await callClaude(
            AGENT_SYSTEM_PROMPT + `\nRaw context: Deep Research Enterprise Risk Assessment. Provide a MINIMUM of 15 distinct sections as defined.`,
            `Enterprise query: "${query}"\nStep objective: "${step.title}" — ${step.description}\nExecute deep research and output a comprehensive 15+ page report with all requested sections.`,
            4000
        );
        content = { summary: text };
    }

    return {
        type: "AgentResult",
        id: `risk-${Date.now()}`,
        properties: { agent: "RiskSynthesis" },
        data: content
    };
}
