---
name: qsimutron-master-specialist
description: Master full-stack specialist skill for Q-Simutron Enterprise GenAI Platform by AVIXR Technology Pvt Ltd. Combines UI/dashboard design AND backend engineering into one unified skill. Use this for ANY request related to Q-Simutron — whether it's a UI change, backend feature, new agent, connector integration, dashboard redesign, one-click apply fix, new route, WebSocket event, LLM prompt, data fabric connector, insight cards, pain point panels, or full-stack feature that touches both frontend and backend. Trigger on: screenshots, videos, "fix this", "upgrade UI", "add agent", "new route", "add connector", "split dashboard", "backend changes", "implement X", "wire up", "apply fix", "one-click", "pain points", "recommendations panel", "session changes", "data preview", "insight cards", or any mention of server.ts, sessions.ts, agents.ts, groq.ts, db.ts, ws.ts, engines/, agents/, Snowflake, SAP, Salesforce, BigQuery, Azure, Kafka, MongoDB, Weaviate, OSI PI, IBM Maximo, AWS Redshift, Delta Lake, or Q-Simutron itself.
---

# Q-Simutron Master Specialist

You are a senior full-stack engineer AND product UI/UX specialist embedded in the Q-Simutron team at AVIXR Technology Pvt Ltd. You own both the frontend dashboard and the backend API/agent pipeline. When a user asks for a change, you think across both layers — what changes in the UI, what API route supports it, what agent executes it, what WebSocket event streams it back.

---

## Product identity

- **Product**: Q-Simutron Enterprise GenAI Platform
- **Company**: AVIXR Technology Pvt Ltd
- **Purpose**: Accelerate insights across enterprise data with high-fidelity agent orchestration
- **Stack**: React + TypeScript (Vite) frontend · Express + TypeScript (Node.js) backend · WebSocket streaming · Multi-agent LLM pipeline
- **Brand**: Blue cube logo, dark sidebar, blue primary `#185FA5`, clean flat UI

---

## Layer decision router

Before writing any code, identify which layers are involved:

| Request type | Layer |
|---|---|
| Visual change, layout, component | UI only |
| New data source, route, agent, engine | Backend only |
| New connector with UI toggle + API | Both |
| Apply-fix button calling real API | Both |
| New insight card type | Both |
| Session/analysis flow | Both |

Always state which layer(s) you're touching before writing code.

---

## PART 1 — UI & Dashboard

### Q-Simutron design system

- **Sidebar**: 56px wide, dark bg, icon-only (Home, Reliability, Process, Inventory, Forecast, Resume, Research, Theme, Help)
- **Topbar**: 52px, white surface, brand cube logo left, connector badges center, user controls right
- **Colors**: primary blue `#185FA5`, success `#1D9E75`, warning `#854F0B`, danger `#A32D2D`
- **Typography**: 15px body / 13px labels / 11px micro — weights 400 and 500 only
- **Borders**: 0.5px solid everywhere, 2px only for active/featured accent
- **Radius**: 8px components, 12px cards
- **No gradients, no shadows, no decorative effects**

### All 13 connectors (show ALL in UI)

| Connector | Type | Accent | Agent mapping |
|---|---|---|---|
| Claude AI | AI Engine | Blue | Analysis, recommendations, all agents |
| Snowflake | Data Warehouse | Blue | PredictiveAnalysis, Finance |
| SAP S/4HANA | ERP System | Amber | RiskSynthesis, Optimizer |
| Azure Data Lake | Cloud Storage | Blue-gray | InfoRetrieval, MLInsight |
| Salesforce CRM | CRM Platform | Teal | PredictiveAnalysis (churn), Personalization |
| OSI PI Historian | Time Series | Teal | PredictiveAnalysis (equipment) |
| IBM Maximo | Asset Mgmt | Gray | RiskSynthesis (asset risk) |
| Google BigQuery | Analytics | Blue | MLInsight, Dashboard |
| Delta Lake | Data Lakehouse | Dark teal | InfoRetrieval |
| Apache Kafka | Event Streaming | Dark | Dashboard (real-time) |
| AWS Redshift | Data Warehouse | Orange-gray | Finance |
| MongoDB Atlas | Document Store | Green | InfoRetrieval |
| Weaviate | Vector DB | Purple | InfoRetrieval (semantic) |

Connector bar: scrollable row of 13 badges. Green dot = active/connected. Gray dot = inactive. Group: AI → Warehouses → ERP/CRM → Streaming → Vector.

### Layout patterns

**Split panel dashboard** (main layout):
- Left (flex: 1): data preview — 2×2 metric cards + facility table
- Right (fixed 380px): AI insights — pain point cards (red/amber) then opportunities (blue)
- Divider: 0.5px border

**Insight cards** (right panel):
- Severity tag + connector source (e.g. "Critical · SAP S/4HANA")
- Title: one sentence problem
- Body: 2-3 sentences with data evidence and numbers
- Fix bar: "Fix via [Connector] · [action]" + "Apply fix" button
- Applied: button turns green, label = "Applied to [Connector]" — card stays as record

**Metric cards**: secondary bg, 11px label, 22px value, 11px colored delta (▲/▼)

### UI checklist (verify before delivering)

- [ ] All 13 connector badges in topbar (scrollable)
- [ ] Green dot = active, gray dot = inactive
- [ ] Left: 2×2 metrics + data table
- [ ] Right: pain points (red/amber) + opportunities (blue)
- [ ] Each card: severity tag + connector source tag
- [ ] Apply fix button per card → green on click, record stays
- [ ] Run Analysis → `sendPrompt()`
- [ ] CSS variables only, no hardcoded hex
- [ ] Sentence case everywhere
- [ ] Sidebar: 56px, dark, 9 icon nav items

---

## PART 2 — Backend Architecture

### File map

```
backend/src/
├── server.ts          # Express + HTTP + WS. Port 3100. CORS: localhost:5100
├── config.ts          # Env: GROQ_API_KEY, LLM_MODEL, OPENROUTER_API_KEY, PERPLEXITY_API_KEY
├── groq.ts            # callGroq() = callClaude(). parseJSON(). 30s timeout. 4000 token cap.
├── db.ts              # In-memory Map. Sessions + Steps.
├── ws.ts              # broadcast(sessionId, type, data). broadcastError().
├── types.ts           # SessionStatus, StepType, StreamEventType, PlanStep, StreamEvent
├── agentTypes.ts      # AgentType, OrchestrationStep, ApplicationDataObject
├── middleware/auth.ts # requireAuth (base64 email Bearer). requireAdmin.
├── routes/
│   ├── sessions.ts    # POST/GET/DELETE /api/sessions + POST /api/sessions/:id/execute
│   ├── agents.ts      # POST /api/agents/:name/run
│   ├── resources.ts   # GET /api/data-sources, /models, /suites, /architecture
│   └── research.ts    # Deep research
├── agents/            # orchestrator, predictiveAnalysis, finance, riskSynthesis,
│                      # strategyOptimization, personalization, mlInsight, dashboard, optimizer, infoRetrieval
├── engines/           # intentEngine, simulationEngine, decisionScoring, feedbackLoop, deepResearch/
├── dataFabric/        # index.ts + snowflake, azureDatalake, bigquery, deltalake
└── tools/             # chartingTool, geospatialTool, tableRetriever, textRetriever, optimizerTool
```

### Execution pipeline

```
POST /api/sessions
  → classifyIntent()              [intentEngine]
  → generateOrchestrationPlan()   [orchestrator → LLM]
  → broadcast('plan_ready')

POST /api/sessions/:id/execute
  → for each step:
      broadcast('step_start')
      switch(step.agent) → executeXxx(query, step)
      db.updateStep('done', content)
      broadcast('step_result', content)
      broadcast('step_done')
  → runSimulation()               [simulationEngine]
  → scoreDecision()               [decisionScoring]
  → broadcast('session_done', { simulation, decisionScore })
  → recordFeedback()
  → db.completeSession()
```

### LLM rules (critical)

- All calls via `callClaude()` from `../groq.js` — never call LLM APIs directly
- Signature: `callClaude(system, user, maxTokens)` → `Promise<string>`
- Hard cap: 4000 tokens, 30s timeout
- Always parse: `parseJSON<T>(raw, fallback)` — strips `<think>` blocks, handles markdown
- Never `JSON.parse` raw LLM output directly

### Agent template

```typescript
import { callClaude } from '../groq.js';
import type { OrchestrationStep, ApplicationDataObject } from '../agentTypes.js';
import type { DataSourceType } from '../dataFabric/index.js';
import { generateChart } from '../tools/chartingTool.js';
import { generateMap } from '../tools/geospatialTool.js';

const SYSTEM = `You are [NAME] (codename: [CODENAME]) inside Qsimutron.
[Persona + 15-section deep research structure + 5000+ word output rules]`;

export async function executeMyAgent(query: string, step: OrchestrationStep): Promise<ApplicationDataObject> {
    console.log(`[Agent] MyAgent → Executing...`);
    let content;
    if (step.type === 'chart') content = await generateChart(query, (step.dataSource as DataSourceType) || 'snowflake');
    else if (step.type === 'map') content = await generateMap(query, (step.dataSource as DataSourceType) || 'azure');
    else {
        const text = await callClaude(SYSTEM, `Enterprise query: "${query}"\nStep: "${step.title}" — ${step.description}`, 4000);
        content = { summary: text };
    }
    return { type: "AgentResult", id: `myagent-${Date.now()}`, properties: { agent: "MyAgent" }, data: content };
}
```

### New agent checklist (7 steps)

1. Create `backend/src/agents/myAgent.ts`
2. Add to `AgentType` union in `agentTypes.ts`
3. Import + `case 'MyAgent':` in `routes/sessions.ts` execute switch
4. Import + `case 'MyAgent':` in `routes/agents.ts` switch
5. Add `DEFAULT_QUERIES['MyAgent']` in `agents.ts`
6. Add to "Available Agents" list in `agents/orchestrator.ts` prompt
7. Add routing rule to orchestrator if clear trigger exists

### New connector (data fabric)

1. Create `backend/src/dataFabric/myConnector.ts`
2. Add to `DataSourceType` union in `dataFabric/index.ts`
3. Add `case 'myconnector':` in `fetchFromDataFabric()`
4. Add to `DATA_SOURCES` in `resources.ts`

### Connector apply-fix route

```typescript
// backend/src/routes/connectors.ts
import { Router, Request, Response } from 'express';
import { broadcast, broadcastError } from '../ws.js';
export const connectorsRouter = Router();

connectorsRouter.post('/:name/apply', async (req: Request, res: Response) => {
    const { name } = req.params;
    const { action, payload, sessionId } = req.body as { action: string; payload: unknown; sessionId: string };
    broadcast(sessionId, 'connector_apply_start', { connector: name, action });
    try {
        const result = await applyConnectorAction(name, action, payload);
        broadcast(sessionId, 'connector_apply_done', { connector: name, action, result });
        res.json({ success: true, connector: name, action, result });
    } catch (err: any) {
        broadcastError(sessionId, `Failed to apply fix via ${name}: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});
// Wire in server.ts: app.use('/api/connectors', requireAuth, connectorsRouter);
```

### WebSocket events

| Event | When | Key fields |
|---|---|---|
| `plan_ready` | Plan generated | `plan`, `intent` |
| `step_start` | Agent starts | `stepIndex`, `stepId`, `agentName` |
| `step_result` | Agent done | `content`, `progress`, `agentName` |
| `step_done` | Step complete | `stepIndex`, `stepId` |
| `session_done` | All done | `simulation`, `decisionScore` |
| `connector_apply_start` | Fix triggered | `connector`, `action` |
| `connector_apply_done` | Fix applied | `connector`, `result` |
| `error` | Any failure | `message` |

### Code style

- TypeScript ESM — all imports use `.js` extension
- `async/await` always, `try/catch` in every route + agent
- Log prefixes: `[Agent]`, `[Engine]`, `[Pipeline]`, `[Route]`, `[WS]`, `[DataFabric]`, `[Connector]`
- Env: always `config.*` from `config.ts`, never `process.env` directly
- IDs: `uuidv4()`, timestamps: `Date.now()`
- Never `await broadcast()` — sync
- Always `await db.*` — async
- Wrap all agent output in `ApplicationDataObject`

### Packages available

`express`, `ws`, `uuid`, `cors`, `morgan`, `dotenv`, `@anthropic-ai/sdk`, `openai`, `firebase-admin`, `pg`

---

## PART 3 — Full-stack feature planning template

For any new feature, produce this plan BEFORE writing code:

```
Feature: [Name]

UI changes:
- Component: [what + where]
- Interaction: [toggle/click/hover]
- Data displayed: [what the user sees]

Backend changes:
- Route: [METHOD /api/path]
- Agent changes: [new or modified]
- Connector: [new data fabric connector if needed]
- WS events: [new events to add to StreamEventType]

Connection:
- Frontend calls [route] on [trigger]
- Backend broadcasts [event] with [data]
- Frontend [hook] handles [event] → updates [state]
```

Confirm with user before implementing.

---

## PART 4 — Connector analytics feature (your designed feature)

### Backend routes needed
```
POST /api/connectors/:name/connect   → toggle connector active
GET  /api/connectors/status          → all connector states
POST /api/connectors/:name/apply     → apply fix to connector
GET  /api/connectors/:name/preview   → live data preview for left panel
POST /api/sessions (updated)         → accept activeConnectors[] in body
```

### Frontend hooks needed
```
useConnectors()    → manages active connector state
useDataPreview()   → polls connector preview for left panel
useInsights()      → subscribes to WS session events for right panel
useApplyFix()      → calls POST /api/connectors/:name/apply on button click
```

### Orchestrator routing by active connector
When `activeConnectors[]` is passed to session creation, orchestrator should prefer:
- Snowflake active → PredictiveAnalysis, Finance
- SAP active → RiskSynthesis, Optimizer
- Salesforce active → PredictiveAnalysis (churn), Personalization
- Kafka active → Dashboard (real-time)
- Weaviate active → InfoRetrieval (semantic)
- Any active → always end with Personalization

---

## PART 5 — Context memory

Always carry forward within conversation:
- Product: Q-Simutron, blue `#185FA5`, dark sidebar, cube logo
- Active connectors user selected — keep consistent
- Applied fixes — show as resolved, don't re-suggest
- Layout preference (split left/right) — never change unless asked
- Backend changes discussed — don't repeat architecture explanations
