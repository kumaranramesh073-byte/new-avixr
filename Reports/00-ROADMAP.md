# Q-SIMUTRON — Build Roadmap

> **Purpose of this folder:** Every module we build gets a companion document here
> explaining **why** it exists and **how** it works — written for humans (mentors,
> investors, the GQI reviewer), not just engineers. This file is the master plan.

_Last updated: June 2, 2026_

---

## 1. The Vision (in one sentence)

Turn Q-SIMUTRON from a *beautiful dashboard* into an **enterprise strategic
cognition platform** — "Bloomberg + Palantir + BlackRock Aladdin" for simulating
business decisions **before** they are executed.

The difference between us and Power BI / Tableau / Gartner:
they **show data**; we **predict outcomes, explain why, simulate futures, and
recommend the next move** — with a confidence score attached.

---

## 2. What already exists (done ✅)

| Piece | Status |
|---|---|
| **OCT Simulator** (Home) — Bloomberg · BlackRock · Vanguard · Ecosystem agents | ✅ Live |
| 7-section scrolling "mini-Bloomberg" results dashboard | ✅ Live |
| Company-aware analysis (names real suppliers/competitors) | ✅ Live |
| PDF report export | ✅ Live |
| Supabase auth (email + Google) | ✅ Live |
| Render (backend) + Vercel (frontend) deployment | ✅ Live |
| HuggingFace → Groq Llama-3.3-70B LLM provider | ✅ Live |

The **13 sidebar modules** below are currently empty placeholders. This roadmap
fills them in, **two agents per phase.**

---

## 3. The key architectural idea — "Standard Module Intelligence"

We are NOT going to hand-build 10 unrelated dashboards. That would be slow,
inconsistent, and unmaintainable. Instead, **every** intelligence module returns
the **same JSON shape**, and a **single reusable dashboard shell** renders it.
Each module only differs in (a) its AI persona/prompt and (b) 1–2 custom charts.

This is what makes 10 modules achievable — and it's also what bakes in the
mentor's "20 platform-defining features" **everywhere at once**.

### The Standard Module Schema (every agent returns this)

```jsonc
{
  "module": "forecasting",
  "executive_summary": "Narrative paragraph — what's happening & what it means",  // → Narrative Engine (#20)
  "kpis": [
    { "label": "Revenue Forecast", "value": 14, "unit": "%", "trend": "up",
      "confidence": 82 }                                                          // → Confidence Layer (#2)
  ],
  "why_it_matters": [                                                             // → "Why This Matters" (#1)
    { "signal": "Competitor Threat 70",
      "why": "Aggressive enterprise SaaS pricing",
      "impact": "CAC may rise 12–18% within 2 quarters",
      "recommended_action": "Strengthen retention moat before Q3" }
  ],
  "root_cause": [ { "factor": "Pricing pressure", "pct": 38 } ],                  // → Root-cause analysis
  "alerts": [
    { "severity": "critical", "title": "...", "probability": 71,
      "timeline": "30 days", "impact": "..." }
  ],
  "opportunities": [ { "title": "...", "potential": 74, "note": "..." } ],        // → Opportunity Radar (#15)
  "recommendations": [                                                            // → Autonomous Recs (#7)
    { "priority": "high", "action": "...", "impact": "...",
      "roi": "+6% margin", "complexity": "medium" }
  ],
  "scenarios": [                                                                  // → Multi-Scenario (#4) + Decision Sim (#3)
    { "name": "Base Case", "revenue_impact": "+4%", "risk_index": 50, "note": "..." }
  ],
  "ripple_mermaid": "graph LR ...",                                               // → Ripple Simulation (#8)
  "confidence": { "overall": 82, "data_quality": 76,
                  "signal_strength": 68, "scenario_stability": 71 },             // → Confidence Layer (#2)
  "charts": { /* module-specific series */ },
  "generated_at": "ISO-8601"
}
```

### How the 20 "platform-defining features" map in

| # | Feature | Where it lives |
|---|---|---|
| 1 | Why This Matters | `why_it_matters[]` — every module |
| 2 | AI Confidence | `confidence{}` + per-KPI `confidence` |
| 3 | Decision Impact Simulator | `scenarios[]` + scenario runner |
| 4 | Multi-Scenario (best/base/worst/black-swan) | `scenarios[]` |
| 5 | Strategic Timeline | Forecasting module + timeline component |
| 6 | Explainability Panel | `why_it_matters` + `root_cause` + AI Agent Visibility |
| 7 | Autonomous Recommendations | `recommendations[]` |
| 8 | Live Ripple Simulation | `ripple_mermaid` (animated later) |
| 9 | Enterprise Memory Layer | DB of past runs (Phase 5+) |
| 10 | Competitive War Room | Competitor module (Phase 3) |
| 11 | Boardroom Presentation | Reports module (Phase 5) |
| 12 | AI-to-AI Debate | AI Advisor (Phase 4) |
| 13 | Executive Command Feed | Home / AI Advisor (Phase 4) |
| 14 | Strategic DNA Evolution | Onboarding + Settings (Phase 5) |
| 15 | Opportunity Radar | `opportunities[]` — every module |
| 16 | Cross-Department Impact | Ripple + Digital Twin (Phase 4) |
| 17 | Strategic Heatmap | Market Intel (Phase 2) |
| 18 | Decision Replay | Memory Layer (Phase 5+) |
| 19 | AI Agent Visibility | AI Advisor (Phase 4) |
| 20 | Executive Narrative Engine | `executive_summary` — every module |

**Takeaway:** ~13 of the 20 features come "for free" the moment the standard
schema + shell exist. The rest are specific modules in later phases.

---

## 4. Shared foundation (built once, in Phase 1)

**Backend**
- `src/agents/moduleAgent.ts` — generic agent runner: takes a persona prompt +
  Business DNA, returns the Standard Module Schema (with safe fallbacks, the same
  429-retry + array-of-lines mermaid tricks we already proved out).
- `src/routes/modules.ts` — `POST /api/modules/:module/run`, auth-protected.
- `src/agents/personas/*.ts` — one short persona file per module.

**Frontend**
- `src/components/module/ModuleDashboard.tsx` — the reusable shell: KPI cards,
  Why-This-Matters cards, Confidence ring, Alerts feed, Recommendations (priority-
  ranked), Scenario comparison cards, Ripple Mermaid, Narrative block.
- `src/hooks/useModule.ts` — fetch + loading-stage state (mirrors MorningBriefing).
- Each module page = `<ModuleDashboard module="forecasting" extraCharts={...} />`.

---

## 5. The Phases (2 agents each)

> Order is chosen by **dependency** (Advisor must come after the agents it
> synthesizes) and **buyer value** (predictive + risk first).

### Phase 1 — Forecasting Engine + Risk Center  ← _start here_
The predictive backbone. Forecasting = "what happens next"; Risk = "what can
hurt us." Both are the most detailed in the mentor docs and feed every other
module. **Also builds the shared foundation (Section 4).**

### Phase 2 — Market Intel + Financial Engine
External market foresight + internal financial intelligence (AI CFO). Adds the
Strategic Heatmap (#17).

### Phase 3 — Customer Sentiment + Competitor Analysis
Emotional/churn intelligence + the Competitive **War Room** (#10).

### Phase 4 — Digital Twin + AI Advisor
Digital Twin = live ripple/dependency view of the whole business (#16). AI Advisor
= the **Chief Strategy AI** that synthesizes all the above, runs the **AI-to-AI
Debate** (#12), AI Agent Visibility (#19), and powers the Executive Command Feed (#13).
_(Built last among intelligence modules because it depends on the others.)_

### Phase 5 — Reports Intelligence + Settings/Governance
Reports = one-click **board/investor report** aggregating **every agent's scores
& simulations** (your explicit ask) — Boardroom mode (#11). Settings = governance,
confidence logging, **Strategic DNA Evolution** (#14), and the **Memory Layer** (#9)
foundation for Decision Replay (#18).

### Phase 6 (optional / infra) — Integrations Mesh + Team Workspace
Enterprise connectivity + collaborative war rooms. Heavier infra; lower demo value
than the intelligence modules, so deferred.

### Phase 7 (optional) — Help/Enablement + animation polish
Explainability explorer, simulation academy, animated ripple propagation.

---

## 6. Working agreement

- **Two agents per phase.** Each phase ends with both module dashboards live and
  a companion doc in this folder (`NN-module-name.md`) explaining why + how.
- After each phase: `tsc` clean on both sides, smoke-tested against the live LLM,
  committed with a clear message. We confirm before starting the next phase.
- Multi-agent (subagent) help is used where a phase has two independent modules —
  they can be built in parallel by separate agents, then integrated.

---

## 7. Per-module doc index

_(Filled in as we build.)_

- `00-ROADMAP.md` — this file
- `01-forecasting-engine.md` — _Phase 1_
- `02-risk-center.md` — _Phase 1_
- … (added each phase)
