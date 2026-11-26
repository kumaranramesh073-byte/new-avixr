---
name: qsimutron-orchestrator
description: Autonomous agentic orchestrator skill for the Qsimutron platform. Use when the user submits any enterprise query that requires multi-agent execution, plan generation, or agent routing. This is the master controller that decomposes queries, selects specialized agents, manages execution flow through engine layers (Intent → Agents → Simulation → Scoring → Output), and synthesizes the final executive intelligence output.
---

# Autonomous Agentic Orchestrator

## Role

Master planning and routing intelligence for the Qsimutron multi-agent architecture. Decomposes user queries, selects optimal agent combinations, and manages the full execution pipeline.

## Execution Pipeline

```
USER QUERY
    ↓
INTENT ENGINE (classify → extract entities → set priority)
    ↓
ORCHESTRATOR (select agents → order steps → set data sources)
    ↓
AGENT EXECUTION (parallel where possible)
    ↓
SIMULATION ENGINE (causal graph → ripple effects)
    ↓
DECISION SCORING (confidence × impact × urgency × feasibility)
    ↓
EXECUTIVE OUTPUT (personalized by Personalization Agent)
    ↓
FEEDBACK LOOP (record outcome → improve future routing)
```

## Available Agents

| Agent | Codename | Best For | Output Types |
|-------|----------|----------|-------------|
| PredictiveAnalysis | ORACLE-7 | Forecasting, trends, anomalies | chart, text |
| Finance | LEDGER-X | P&L, NPV/IRR, cashflow | chart, text |
| StrategyOptimization | PARETO-9 | Scenarios, trade-offs, allocation | table, text |
| RiskSynthesis | SENTINEL-4 | Threats, compliance, mitigation | map, text |
| Personalization | PRISM-1 | Stakeholder adaptation | text |
| MLInsight | — | ML models, time-series | chart, text |
| InfoRetrieval | — | Record lookup, search | table, text |
| Dashboard | — | Visualization, geospatial | chart, map |
| Optimizer | — | Supply chain, scheduling | text |

## Routing Rules

1. Always run Intent Engine FIRST to classify the query
2. Select 3-5 agents based on intent classification
3. Always include Personalization as the FINAL agent
4. Order agents by dependency: data retrieval → analysis → synthesis → personalization
5. Assign data sources based on query domain:
   - Financial queries → Snowflake
   - Operational queries → Azure Data Lake
   - Analytics queries → BigQuery
   - ML/AI queries → Delta Lake
   - General queries → C3.ai

## Anti-Regression Rules

- Never skip the Intent Engine classification step
- Never assign more than 5 agents to a single query
- Never assign fewer than 2 agents (minimum: domain agent + Personalization)
- Always validate agent output before passing to next engine layer

## References

- Backend: `backend/src/agents/orchestrator.ts`
- Intent Engine: `backend/src/engines/intentEngine.ts`
- Simulation: `backend/src/engines/simulationEngine.ts`
- Scoring: `backend/src/engines/decisionScoring.ts`
- Feedback: `backend/src/engines/feedbackLoop.ts`
- Route handler: `backend/src/routes/sessions.ts`
