/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON OCT — Ecosystem & Supply Chain Agent
   Persona: Vanguard/McKinsey-style ecosystem mapper.
   Produces the "mini-Bloomberg" data layer: real-named supplier companies,
   competitor companies, growth opportunities, a supply-chain Mermaid graph,
   and chartable financial / market-share datasets.
   ═══════════════════════════════════════════════════════════════════════════ */

import { callGroq, parseJSON } from '../groq.js';

export interface Supplier {
    name: string;
    category: string;
    region: string;
    dependency: number;       // 0-100 how reliant the business is on them
    risk: 'high' | 'medium' | 'low';
    note: string;             // brief analysis
}

export interface CompetitorProfile {
    name: string;
    positioning: string;
    threat: number;           // 0-100
    momentum: 'rising' | 'stable' | 'declining';
    recent_move: string;
    note: string;             // brief analysis
}

export interface Opportunity {
    title: string;
    potential: number;        // 0-100
    note: string;
}

export interface EcosystemOutput {
    suppliers: Supplier[];
    competitors: CompetitorProfile[];
    opportunities: Opportunity[];
    supply_chain_mermaid: string;
    sector_breakdown: Array<{ name: string; value: number }>;      // revenue mix
    financial_projection: Array<{ period: string; revenue: number; cost: number; profit: number }>;
    market_share: Array<{ name: string; value: number }>;          // company vs rivals
}

const ECOSYSTEM_SYSTEM = `You are the Ecosystem & Supply Chain Principle Agent for Q-SIMUTRON, a Bloomberg-grade business simulation engine.

YOUR MISSION: Map the real-world commercial ecosystem around the target company. Use your knowledge of the actual industry to name REAL, plausible supplier companies and REAL competitor companies (use well-known firm names where they genuinely operate in this space). Provide brutally concise analyst notes.

OUTPUT RULES:
- Suppliers: name actual vendor/partner companies that a business in this industry would realistically depend on (cloud, logistics, payments, hardware, raw materials, distribution, etc.). dependency 0-100, risk high/medium/low. note = one tight analyst sentence.
- Competitors: name actual competitor companies in this industry/geography. threat 0-100, momentum rising/stable/declining. recent_move = a plausible recent strategic action. note = one analyst sentence.
- Opportunities: 3 concrete growth plays. potential 0-100.
- supply_chain_mermaid: a Mermaid "graph LR" (left-right) diagram of suppliers -> the company -> distribution -> customers, 6-9 nodes, returned as an ARRAY OF STRINGS where each element is ONE line of the diagram (first line "graph LR"). Include classDef lines: "classDef danger fill:#ef4444,color:#fff", "classDef warn fill:#eab308,color:#000", "classDef safe fill:#22c55e,color:#fff". Mark threatening nodes :::danger, neutral :::warn, healthy :::safe.
- sector_breakdown: 4-5 revenue-mix segments that sum to ~100.
- financial_projection: 6 forward periods (e.g. Q1-Q4 + next 2), realistic revenue/cost/profit numbers (thousands or millions, internally consistent).
- market_share: the target company plus 3-4 named rivals, values sum to ~100.

Return ONLY valid JSON matching this exact schema (no markdown, no prose outside JSON):
{
  "suppliers": [{"name":"","category":"","region":"","dependency":0,"risk":"high|medium|low","note":""}],
  "competitors": [{"name":"","positioning":"","threat":0,"momentum":"rising|stable|declining","recent_move":"","note":""}],
  "opportunities": [{"title":"","potential":0,"note":""}],
  "supply_chain_mermaid": ["graph LR", "  S1[Supplier]:::warn --> C[Company]", "  C --> U1[Customers]:::safe", "  classDef warn fill:#eab308,color:#000", "  classDef safe fill:#22c55e,color:#fff"],
  "sector_breakdown": [{"name":"","value":0}],
  "financial_projection": [{"period":"","revenue":0,"cost":0,"profit":0}],
  "market_share": [{"name":"","value":0}]
}`;

export async function runEcosystemAgent(
    publicDataContext: string,
    userParams: Record<string, string>
): Promise<EcosystemOutput> {
    console.log('[Ecosystem Agent] Mapping suppliers, competitors, and projections...');

    const company = userParams.companyName || `a ${userParams.industry} company`;

    const userPrompt = `TARGET COMPANY: ${company}
${userParams.companyDescription ? `What they do: ${userParams.companyDescription}` : ''}
Industry: ${userParams.industry}
Geography: ${userParams.geography}
Business Model: ${userParams.businessModel}
Revenue Range: ${userParams.revenueRange}
Company Size: ${userParams.companySize}
Strategic Priority: ${userParams.priority}

PUBLIC MARKET INTELLIGENCE:
${publicDataContext || 'No live data — use your industry knowledge to name real supplier and competitor companies.'}

Map the full ecosystem for ${company}. Name real companies. Return the JSON.`;

    const ind = userParams.industry || 'the sector';
    const fallback: EcosystemOutput = {
        suppliers: [
            { name: 'Amazon Web Services', category: 'Cloud Infrastructure', region: 'Global', dependency: 82, risk: 'high', note: 'Single-cloud concentration creates uptime and pricing exposure.' },
            { name: 'Stripe', category: 'Payments', region: 'Global', dependency: 64, risk: 'medium', note: 'Core to revenue collection; fee changes hit margin directly.' },
            { name: 'Salesforce', category: 'CRM / GTM', region: 'Global', dependency: 47, risk: 'low', note: 'Embedded in sales ops; switching cost high but stable vendor.' },
            { name: 'Cloudflare', category: 'Edge / Security', region: 'Global', dependency: 38, risk: 'low', note: 'Resilient multi-region edge; low disruption risk.' },
        ],
        competitors: [
            { name: 'Established Incumbent', positioning: `Market leader in ${ind}`, threat: 71, momentum: 'stable', recent_move: 'Expanded enterprise tier with aggressive discounting.', note: 'Brand and distribution moat; slow to innovate.' },
            { name: 'Fast-Growing Challenger', positioning: 'Product-led disruptor', threat: 64, momentum: 'rising', recent_move: 'Closed a large funding round to fuel land-grab.', note: 'Velocity is the threat — undercutting on price and speed.' },
            { name: 'Niche Specialist', positioning: 'Vertical-focused', threat: 41, momentum: 'stable', recent_move: 'Deepened a key partnership integration.', note: 'Defensible niche but limited TAM.' },
        ],
        opportunities: [
            { title: 'Adjacent vertical expansion', potential: 74, note: 'Reuse core platform to enter a neighboring segment with low CAC.' },
            { title: 'Usage-based pricing tier', potential: 61, note: 'Capture price-sensitive mid-market without eroding enterprise ARPU.' },
            { title: 'Strategic supplier diversification', potential: 55, note: 'Add a second cloud to cut concentration risk and unlock leverage.' },
        ],
        supply_chain_mermaid: `graph LR\n  S1[Cloud / AWS]:::warn --> C[${company}]\n  S2[Payments / Stripe]:::warn --> C\n  S3[Data Vendors]:::safe --> C\n  C --> D[Distribution Channels]\n  D --> U1[Enterprise Customers]:::safe\n  D --> U2[SMB Customers]:::safe\n  classDef danger fill:#ef4444,color:#fff\n  classDef warn fill:#eab308,color:#000\n  classDef safe fill:#22c55e,color:#fff`,
        sector_breakdown: [
            { name: 'Core Product', value: 48 },
            { name: 'Services', value: 22 },
            { name: 'Add-ons', value: 18 },
            { name: 'Partnerships', value: 12 },
        ],
        financial_projection: [
            { period: 'Q1', revenue: 1200, cost: 820, profit: 380 },
            { period: 'Q2', revenue: 1340, cost: 880, profit: 460 },
            { period: 'Q3', revenue: 1510, cost: 940, profit: 570 },
            { period: 'Q4', revenue: 1680, cost: 1010, profit: 670 },
            { period: 'Q5', revenue: 1880, cost: 1090, profit: 790 },
            { period: 'Q6', revenue: 2100, cost: 1180, profit: 920 },
        ],
        market_share: [
            { name: company, value: 24 },
            { name: 'Established Incumbent', value: 38 },
            { name: 'Fast-Growing Challenger', value: 22 },
            { name: 'Others', value: 16 },
        ],
    };

    // Rate-limit / timeout on this 4th agent must NOT kill the whole simulation —
    // degrade gracefully to the company-aware fallback so the dashboard still renders.
    let raw = '';
    try {
        raw = await callGroq(ECOSYSTEM_SYSTEM, userPrompt, 2200);
    } catch (err: any) {
        console.warn(`[Ecosystem Agent] LLM call failed (${err.message}) — using fallback ecosystem map.`);
        return fallback;
    }

    const parsed = parseJSON<EcosystemOutput>(raw, fallback);

    // Defensive normalization so the dashboard never breaks
    if (!Array.isArray(parsed.suppliers) || parsed.suppliers.length === 0) parsed.suppliers = fallback.suppliers;
    if (!Array.isArray(parsed.competitors) || parsed.competitors.length === 0) parsed.competitors = fallback.competitors;
    if (!Array.isArray(parsed.opportunities) || parsed.opportunities.length === 0) parsed.opportunities = fallback.opportunities;
    if (!Array.isArray(parsed.sector_breakdown) || parsed.sector_breakdown.length === 0) parsed.sector_breakdown = fallback.sector_breakdown;
    if (!Array.isArray(parsed.financial_projection) || parsed.financial_projection.length === 0) parsed.financial_projection = fallback.financial_projection;
    if (!Array.isArray(parsed.market_share) || parsed.market_share.length === 0) parsed.market_share = fallback.market_share;
    // Mermaid arrives as an array of lines (safe JSON) — join into a single diagram string
    const rawMermaid = parsed.supply_chain_mermaid as unknown;
    if (Array.isArray(rawMermaid)) {
        parsed.supply_chain_mermaid = (rawMermaid as string[]).join('\n');
    }
    if (!parsed.supply_chain_mermaid || typeof parsed.supply_chain_mermaid !== 'string') {
        parsed.supply_chain_mermaid = fallback.supply_chain_mermaid;
    }
    // Clean mermaid backticks if the model added them
    if (parsed.supply_chain_mermaid.includes('```')) {
        parsed.supply_chain_mermaid = parsed.supply_chain_mermaid
            .replace(/```mermaid\s*/g, '').replace(/```\s*/g, '').trim();
    }

    parsed.suppliers.forEach(s => { s.dependency = Math.max(0, Math.min(100, Number(s.dependency) || 50)); });
    parsed.competitors.forEach(c => { c.threat = Math.max(0, Math.min(100, Number(c.threat) || 50)); });

    console.log(`[Ecosystem Agent] Done. Suppliers: ${parsed.suppliers.length}, Competitors: ${parsed.competitors.length}`);
    return parsed;
}
