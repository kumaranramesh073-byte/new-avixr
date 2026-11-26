# Q-SIMUTRON — Rolling Out Real-World Grounding to All 8 Modules

**Implementation Plan & Investigation Report**
Author: Investigation by Claude (Opus 4.8) · Date: 2026-06-03
Audience: The engineer (human or LLM) who will implement this.
Status: Ready to implement. No design questions left open.

> **TL;DR for the implementer.** The grounding engine is already built and is
> fully generic. Today only the **AI Advisor** module uses real web data; the
> other 7 modules invent their numbers from the LLM's memory. To fix that you do
> **two things**: (1) add a one-line `searchFocus` string to each of the 7
> remaining persona files (copy-paste strings provided in §4), and (2) add a
> small in-memory cache to the grounding agent so 8 modules don't burn 32 web
> searches every time someone opens the dashboard (code provided in §5).
> **No frontend changes are required** — the dashboard already shows the
> "Grounded in N live web sources" badge and the Live Sources panel for any
> module that returns `grounded: true`. Follow §4, then §5, then verify with §7.

---

## 1. Executive Summary

Q-SIMUTRON has 8 intelligence modules: `forecasting`, `risk`, `market`,
`finance`, `sentiment`, `competitor`, `twin`, and `advisor`. Every one of them is
powered by a single generic runner, `runModuleAgent()`, which sends the company
profile to an LLM and asks it to produce a Bloomberg-style dashboard (KPIs,
alerts, scenarios, recommendations, etc.).

In a previous change, a **real multi-step grounding agent** was built and wired
into that runner. When a module's persona declares a `searchFocus` string, the
runner first plans search queries, hits the web (Tavily → DuckDuckGo → xAI
fallback chain), collects real evidence + source URLs, and injects that evidence
into the LLM prompt. The LLM then *grounds* its analysis in real facts and the UI
shows the citations as proof. This was proven on the AI Advisor (e.g. Zomato's
market share went from a hallucinated 21% to a real, sourced 58%).

**The gap:** only `advisor` has a `searchFocus`. The other 7 personas don't, so
they silently fall back to "use your industry knowledge to produce specific,
realistic intelligence" — i.e. plausible-looking but **fabricated** numbers. For
a platform that presents itself as Bloomberg-grade, that is a credibility and
legal risk on 7 of 8 surfaces.

**This plan** turns grounding on for all 7 remaining modules and adds the cost
and latency controls that become necessary once 8 modules are each doing live
web search. It is deliberately split so the trivial part (the switches) and the
important part (the cache) are independent and independently verifiable.

---

## 2. Current State — What the Investigation Found

### 2.1 The generic runner already supports grounding

File: [backend/src/agents/moduleAgent.ts](../backend/src/agents/moduleAgent.ts)

- The `ModulePersona` interface already has the optional field
  (`moduleAgent.ts:67`):
  ```ts
  /** When set, the module is grounded on live web search for these topics. */
  searchFocus?: string;
  ```
- `StandardModuleOutput` already carries the proof fields
  (`moduleAgent.ts:50-53`):
  ```ts
  sources?: Citation[];   // real web sources
  grounded?: boolean;     // true when grounded on live search
  ```
- `runModuleAgent()` already runs grounding automatically when a persona has a
  `searchFocus` and no `publicDataContext` was passed in
  (`moduleAgent.ts:108-123`):
  ```ts
  if (persona.searchFocus && !publicDataContext) {
      const g = await gatherRealWorldContext(persona.searchFocus, userParams);
      if (g.ok) { publicDataContext = g.context; sources = g.citations; grounded = true; }
  }
  ```
- The system prompt already instructs the model to ground in the evidence block
  (`moduleAgent.ts:78`): *"When a 'LIVE WEB INTELLIGENCE' block is provided …
  GROUND your analysis in it … Never fabricate facts that contradict the provided
  sources."*

**Conclusion:** the on-switch for any module is literally a single
`searchFocus` string in its persona file. No runner change is needed.

### 2.2 The grounding agent and its provider chain

File: [backend/src/agents/groundingAgent.ts](../backend/src/agents/groundingAgent.ts)

`gatherRealWorldContext(focus, userParams)` does:
1. **Plan** — one `callGroq` call returns 4 web-searchable queries
   (`PLAN_QUERIES = 4`), seeded from company + industry + geography + focus;
   falls back to template queries on failure.
2. **Search** via a cost-aware chain (stops at first provider that returns
   content):
   - **Tavily** (primary, free, 1,000 req/mo, no IP throttle) —
     [tavilyClient.ts](../backend/src/engines/deepResearch/tavilyClient.ts)
   - **DuckDuckGo** (free fallback, can be IP-throttled) —
     [duckDuckGoClient.ts](../backend/src/engines/deepResearch/duckDuckGoClient.ts)
   - **xAI Grok** (PAID last resort, hard-capped to **1** combined call) —
     [xaiSearchClient.ts](../backend/src/engines/deepResearch/xaiSearchClient.ts)
3. **Collect** — dedupe citations by URL, sort by relevance, cap at 8, build the
   `LIVE WEB INTELLIGENCE` evidence block.
4. Returns `{ context, citations, searchCount, ok, provider }`. If everything
   fails, `ok: false` and an empty context → the module degrades to its current
   ungrounded behavior (no regression, no crash).

**Crucially, there is no caching anywhere.** Every call to
`gatherRealWorldContext` does a fresh plan + up to 4 searches.

### 2.3 The frontend is already grounding-aware (generic)

File: [frontend/src/components/module/ModuleDashboard.tsx](../frontend/src/components/module/ModuleDashboard.tsx)

- `LiveSources` component renders clickable citations whenever
  `data.sources?.length` (`ModuleDashboard.tsx:299-314`, mounted at line 447-448).
- The header shows a **"Grounded in N live web source(s)"** badge whenever
  `data.grounded && data.sources?.length` (`ModuleDashboard.tsx:359-361`).
- Every module page renders through this one shared `ModuleDashboard` shell, and
  `StandardModuleOutput` in
  [frontend/src/components/module/types.ts](../frontend/src/components/module/types.ts)
  already has `sources?: Citation[]` and `grounded?: boolean` (lines 11, 30-31).

**Conclusion:** the moment a module starts returning `grounded: true` from the
backend, its dashboard automatically lights up with the badge and the Live
Sources panel. **Zero frontend work.**

### 2.4 The route is generic too

File: [backend/src/routes/modules.ts](../backend/src/routes/modules.ts)

`POST /api/modules/:module/run` looks the persona up in a registry and calls
`runModuleAgent(persona, userParams)`. All 8 personas are already registered
(`modules.ts:22-31`). **No route change is needed.**

### 2.5 The cost problem this plan must solve

Per module run today: **1 Groq plan call + up to 4 Tavily searches.**

The frontend (`useModule.ts`) auto-runs each module once per page visit and
caches the result in-memory for the session. So a single user touring all 8
module pages triggers **8 grounding passes = up to 32 Tavily searches + 8 plan
calls**, and all 8 passes search overlapping facts about the *same company*
(revenue, competitors, risks, …).

Tavily free tier = **1,000 searches/month**. 32 searches/tour →
**~31 full dashboard tours per month** before the quota is exhausted, after which
grounding silently falls through to DuckDuckGo (flaky) and then paid xAI. For a
demo shown to multiple people, that quota disappears fast. This is why §5 (the
cache) is not optional polish — it is what makes "ground all 8 modules"
financially viable on the free tier.

---

## 3. Design Decisions (and why the naive approach is wrong)

**Decision 1 — Keep per-module `searchFocus`, do NOT merge into one generic
pull.** Each module needs evidence tailored to its lens: `risk` wants lawsuits
and outages; `finance` wants margins and funding; `sentiment` wants reviews and
NPS. A single generic company pull would weaken exactly the tailoring that made
the Advisor convincing. So every persona gets its own focus string (§4).

**Decision 2 — Add a per-(company + focus) cache with a TTL, plus in-flight
de-duplication.** This is the smallest change that bounds cost without changing
grounding semantics:
- Re-running the same module for the same company within the TTL costs **0**
  searches.
- Two requests for the same module+company that arrive at once share **one**
  in-flight search instead of doubling it.
- It is keyed by `company + focus`, so it never returns risk evidence to the
  finance module — correctness is preserved.

**Decision 3 — TTL = 6 hours.** Market facts don't move minute-to-minute, and a
demo/session is far shorter than 6h, so within any realistic session every
repeat is a cache hit. Long enough to protect the quota, short enough that
"live" still means today's facts.

**Decision 4 — In-memory cache (a module-level `Map`), not Redis/DB.** The app
already uses an in-memory `Map` for module results on the frontend
(`useModule.ts:9`). Matching that keeps the change tiny and dependency-free.
Trade-off: the cache is per-process and clears on server restart — acceptable,
and documented in §8.

**Decision 5 (optional, flagged for later) — a cheaper "shared company corpus"
mode.** If even the cached 32-searches-on-cold-start is too much for the quota,
§9 describes a toggle that does ONE broad company research pass shared by all 8
modules (4 searches per company total). It is documented but **not** part of the
required work, because it slightly reduces per-module tailoring.

---

## 4. PART 1 (Required) — Turn Grounding On for the 7 Remaining Modules

This is the part that literally fulfils the request ("other agents should use
real-time data"). For each persona file below, add **one** `searchFocus`
property to the exported persona object, immediately after the `persona:` field
(matching how `advisor.ts:7` places it). Do not change anything else in these
files.

> Pattern to follow (already present in
> [advisor.ts:7](../backend/src/agents/personas/advisor.ts)):
> ```ts
> persona: `…`,
> searchFocus: `…`,   // ← add this line
> chartsHint: `…`,
> ```

### 4.1 `forecasting` — [backend/src/agents/personas/forecasting.ts](../backend/src/agents/personas/forecasting.ts)
Add after line 6 (`persona: …,`):
```ts
    searchFocus: `the company's recent and projected revenue growth, quarterly results, demand and sales trends, analyst forecasts, guidance, seasonality, and any factors expected to drive performance over the next few quarters`,
```

### 4.2 `risk` — [backend/src/agents/personas/risk.ts](../backend/src/agents/personas/risk.ts)
Add after line 6:
```ts
    searchFocus: `the company's key operational, financial, supply-chain, regulatory, legal, and cybersecurity risks, including recent incidents, lawsuits, recalls, outages, data breaches, regulatory actions, and any credit or liquidity concerns`,
```

### 4.3 `market` — [backend/src/agents/personas/market.ts](../backend/src/agents/personas/market.ts)
Add after line 6:
```ts
    searchFocus: `the company's market share and competitive position, the total addressable market and industry growth trends, macroeconomic and regulatory shifts, and emerging technologies or consumer-behaviour changes affecting the sector`,
```

### 4.4 `finance` — [backend/src/agents/personas/finance.ts](../backend/src/agents/personas/finance.ts)
Add after line 6:
```ts
    searchFocus: `the company's latest financial results — revenue, gross and EBITDA margins, profit or loss, cash position, funding rounds or debt, valuation — and analyst commentary on its financial health and unit economics`,
```

### 4.5 `sentiment` — [backend/src/agents/personas/sentiment.ts](../backend/src/agents/personas/sentiment.ts)
Add after line 6:
```ts
    searchFocus: `current customer sentiment and brand perception for the company — app-store and review-site ratings, NPS or satisfaction reports, recent customer complaints, social-media reaction, and any notable PR or reputation events`,
```

### 4.6 `competitor` — [backend/src/agents/personas/competitor.ts](../backend/src/agents/personas/competitor.ts)
Add after line 6:
```ts
    searchFocus: `the company's main competitors and their recent strategic moves — product launches, pricing changes, funding, acquisitions, market-share shifts, hiring sprees, and head-to-head positioning against this company`,
```

### 4.7 `twin` — [backend/src/agents/personas/twin.ts](../backend/src/agents/personas/twin.ts)
Add after line 6:
```ts
    searchFocus: `the company's operations, supply chain, workforce and hiring, capacity and logistics, and any reported operational bottlenecks, facility expansions, layoffs, outages, or efficiency and automation initiatives`,
```

**After Part 1:** every module returns `grounded: true` with real sources when
web search succeeds. The dashboard badge + Live Sources panel appear
automatically. **But** a full dashboard tour now costs up to 32 Tavily searches.
Do Part 2 before shipping.

---

## 5. PART 2 (Required before shipping) — Grounding Cache + In-Flight Dedup

All changes are in **one file**:
[backend/src/agents/groundingAgent.ts](../backend/src/agents/groundingAgent.ts).
No other file changes. The goal: identical `(company, focus)` requests within the
TTL reuse a stored result (0 searches), and concurrent identical requests share
one in-flight promise (no double-firing).

### 5.1 Add the cache machinery near the top of the file

Add this block immediately **after** the existing constants
(`PLAN_QUERIES` / `MAX_SOURCES`, around line 29) and before `templateQueries`:

```ts
// ─── Grounding cache ─────────────────────────────────────────────────────────
// Web facts don't change minute-to-minute, and a single dashboard tour runs all
// 8 modules for the SAME company — each doing live search would burn the Tavily
// free quota (1,000/mo) in ~31 tours. We cache each (company + focus) result for
// a few hours and de-duplicate concurrent identical requests so the 8 modules
// share work instead of multiplying it.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;   // 6 hours
const groundingCache = new Map<string, { result: GroundingResult; ts: number }>();
const inFlight = new Map<string, Promise<GroundingResult>>();

/** Normalise so "Zomato " and "zomato" share one cache entry. */
function cacheKey(company: string, focus: string): string {
    return `${company.trim().toLowerCase()}::${focus.trim().toLowerCase()}`;
}
```

### 5.2 Rename the existing function and wrap it with the cache

The existing public function is `gatherRealWorldContext(focus, userParams)`
(currently at `groundingAgent.ts:117`). Do **two** edits:

**(a)** Rename the existing implementation from `export async function
gatherRealWorldContext(` to `async function runGrounding(` — i.e. drop the
`export` and rename. Leave its entire body unchanged.

Change this (line ~117):
```ts
export async function gatherRealWorldContext(
    focus: string,
    userParams: Record<string, string>,
): Promise<GroundingResult> {
```
to:
```ts
async function runGrounding(
    focus: string,
    userParams: Record<string, string>,
): Promise<GroundingResult> {
```

**(b)** Add a new exported wrapper that is the cache layer. Put it directly
**above** `runGrounding` (so callers keep importing the same name —
`moduleAgent.ts:114` already calls `gatherRealWorldContext`, so no caller
changes):

```ts
/**
 * Public entry point. Caches each (company + focus) grounding result for
 * CACHE_TTL_MS and de-duplicates concurrent identical requests, so a dashboard
 * tour of 8 modules for one company does NOT fan out into 8× the web searches.
 * Only successful (ok:true) results are cached — failures are retried next time.
 */
export async function gatherRealWorldContext(
    focus: string,
    userParams: Record<string, string>,
): Promise<GroundingResult> {
    const company = userParams.companyName || `${userParams.industry || 'the'} company`;
    const key = cacheKey(company, focus);

    // 1) Fresh cache hit → no network, no LLM.
    const cached = groundingCache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        console.log(`[Grounding] CACHE HIT for "${company}" (0 searches).`);
        return cached.result;
    }

    // 2) An identical request is already running → await it instead of duplicating.
    const pending = inFlight.get(key);
    if (pending) {
        console.log(`[Grounding] Joining in-flight request for "${company}".`);
        return pending;
    }

    // 3) Cold path — run, store on success, always clear the in-flight marker.
    const promise = runGrounding(focus, userParams)
        .then(result => {
            if (result.ok) groundingCache.set(key, { result, ts: Date.now() });
            return result;
        })
        .finally(() => { inFlight.delete(key); });

    inFlight.set(key, promise);
    return promise;
}
```

### 5.3 Why this is safe

- **No semantic change** to grounding itself — `runGrounding` is the old body,
  untouched.
- **Correctness:** key includes `focus`, so the risk module never receives the
  finance module's evidence.
- **Failure handling:** only `ok:true` results are cached, so a transient search
  failure is retried on the next request rather than being cached as empty.
- **No leak:** the `inFlight` entry is always removed in `.finally()`.
- **Degradation unchanged:** if everything still fails, `ok:false` propagates
  exactly as before and the module renders ungrounded.

### 5.4 Cost after Part 2

A cold dashboard tour for one company: the first module to run for each distinct
`focus` does ~4 searches; every other module with a *different* focus does its
own ~4; repeats and concurrent hits are free. Within a session, re-visiting any
module is **0 searches**. Re-running the whole tour within 6h is **0 searches**.
That turns "~31 tours/month" into "~31 *distinct cold* company-tours/month",
which for demos (a handful of companies, revisited often) is comfortably within
the free quota. For the harder multi-company case, see §9.

---

## 6. Files Touched — Checklist

| # | File | Change | Required |
|---|------|--------|----------|
| 1 | `backend/src/agents/personas/forecasting.ts` | add `searchFocus` | ✅ |
| 2 | `backend/src/agents/personas/risk.ts` | add `searchFocus` | ✅ |
| 3 | `backend/src/agents/personas/market.ts` | add `searchFocus` | ✅ |
| 4 | `backend/src/agents/personas/finance.ts` | add `searchFocus` | ✅ |
| 5 | `backend/src/agents/personas/sentiment.ts` | add `searchFocus` | ✅ |
| 6 | `backend/src/agents/personas/competitor.ts` | add `searchFocus` | ✅ |
| 7 | `backend/src/agents/personas/twin.ts` | add `searchFocus` | ✅ |
| 8 | `backend/src/agents/groundingAgent.ts` | add cache + dedup wrapper (§5) | ✅ |
| — | frontend (any) | **none** — already generic | — |
| — | `backend/src/routes/modules.ts` | **none** — already generic | — |
| — | `backend/src/agents/moduleAgent.ts` | **none** — already calls grounding | — |

---

## 7. Verification

### 7.0 Prerequisites
- `backend/.env` must contain a working `TAVILY_API_KEY` (and optionally
  `XAI_API_KEY`). Confirm with: `grep -c TAVILY_API_KEY backend/.env`.
- Start the backend: `cd backend && npm run dev`.

### 7.1 Type-check both sides (must pass clean)
```bash
cd backend  && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```
Expect exit code 0 in both. The persona files only add a string; the grounding
file only adds typed code — there should be no new errors.

### 7.2 Backend live test — every newly-grounded module
For each module, confirm `grounded:true` and real sources. Example for `finance`
(repeat with `risk`, `market`, `sentiment`, `competitor`, `twin`, `forecasting`):
```bash
curl -s -X POST localhost:3100/api/modules/finance/run \
  -H 'Content-Type: application/json' \
  -d '{"userParams":{"companyName":"Tesla","industry":"Automotive","geography":"Global"}}' \
  | jq '{grounded, n_sources: (.sources|length), summary: .executive_summary, first_source: .sources[0].url}'
```
Expect `grounded: true`, `n_sources > 0`, a summary that references real recent
facts, and a plausible source URL. Watch the server log for one
`[Grounding] Researching "Tesla"…` line followed by `[Grounding] OK via tavily`.

### 7.3 Cache test (proves Part 2 works)
Run the **same** curl from 7.2 twice in a row. The first run logs
`[Grounding] Researching …` + `OK via tavily`; the **second** run logs
`[Grounding] CACHE HIT for "Tesla" (0 searches).` and returns near-instantly.
That confirms the TTL cache.

### 7.4 In-flight dedup test (optional)
Fire two identical requests at once:
```bash
curl -s -X POST localhost:3100/api/modules/risk/run -H 'Content-Type: application/json' \
  -d '{"userParams":{"companyName":"Nvidia","industry":"Semiconductors"}}' >/dev/null &
curl -s -X POST localhost:3100/api/modules/risk/run -H 'Content-Type: application/json' \
  -d '{"userParams":{"companyName":"Nvidia","industry":"Semiconductors"}}' >/dev/null &
wait
```
The log should show one `Researching "Nvidia"` and one
`Joining in-flight request for "Nvidia"`.

### 7.5 Degrade-path test (no regression)
Temporarily comment out `TAVILY_API_KEY` in `.env` (and ensure no `XAI_API_KEY`),
restart, and run 7.2 again. Expect the module to still return HTTP 200 with
`grounded:false`, no `sources`, and the normal fallback dashboard — **no crash,
no 500**. Restore the key afterwards.

### 7.6 Frontend smoke
Log in, complete onboarding, open each module page. Confirm the
**"Grounded in N live web sources"** badge and the **Live Sources** panel render,
and that clicking a source opens the real URL in a new tab. (No code changes
here — this is confirming the generic UI lit up.)

---

## 8. Risks, Edge Cases, Rollback

- **Latency.** Each cold module adds the grounding round-trip (plan call + up to
  4 parallel Tavily searches, ~2–6s) on top of the existing ~40s LLM synthesis.
  The cache removes this for repeats. If cold latency is unacceptable, the
  `STAGES` progress labels in `useModule.ts:11-18` already cover it UX-wise.
- **Tavily quota exhaustion.** When the monthly quota runs out, Tavily returns
  empty → the chain falls to DuckDuckGo → xAI → ungrounded. No crash, but
  `grounded` silently becomes `false`. Monitor the `[Grounding] OK via <provider>`
  logs. If `xai` starts appearing, you are spending money — see §9.
- **Cache is per-process / in-memory.** A backend restart clears it; horizontally
  scaled instances each keep their own. Acceptable for the current single-process
  deployment. If/when scaled, swap the `Map` for Redis behind the same
  `gatherRealWorldContext` signature — no caller changes.
- **Stale facts within TTL.** A 6h window means a fact that breaks mid-window
  isn't reflected until expiry. Lower `CACHE_TTL_MS` if "freshness" matters more
  than quota; raise it to protect quota harder.
- **Rollback.** Part 1 is reversible by deleting the 7 `searchFocus` lines
  (modules revert to ungrounded instantly — no other code depends on them). Part
  2 is reversible by renaming `runGrounding` back to `gatherRealWorldContext` and
  deleting the wrapper + cache block. Both parts are independent.

---

## 9. Optional Follow-up — "Shared Company Corpus" Mode (cuts cost ~8×)

Only do this if §5's cache still isn't enough for your quota (e.g. you demo many
*different* companies). Instead of each module researching its own focus, do ONE
broad research pass per company and let all 8 modules reuse it.

Sketch (do **not** implement unless needed):
1. In `groundingAgent.ts`, export a constant broad focus, e.g.
   `COMPANY_RESEARCH_FOCUS = "the company's latest financials, market position,
   competitors, key risks, customer sentiment, operations, and industry outlook"`.
2. Add `gatherCompanyContext(userParams)` that calls `runGrounding(
   COMPANY_RESEARCH_FOCUS, userParams)` through the same cache, keyed by company
   **only** (drop focus from the key).
3. In `moduleAgent.ts:114`, call `gatherCompanyContext(userParams)` instead of
   `gatherRealWorldContext(persona.searchFocus, …)`.

Cost becomes **~4 searches per company, total**, shared across all 8 modules
(~250 distinct companies/month on the free tier). Trade-off: the evidence is no
longer tailored per module, so each module's grounding is slightly less precise —
the persona prompt still specializes the *interpretation*, just not the
*evidence gathered*. Keep the per-module `searchFocus` strings from §4 in place
either way; they document intent and make reverting trivial.

---

## 10. Suggested Commit Sequence

1. `feat(modules): ground forecasting/risk/market/finance/sentiment/competitor/twin in live web data`
   — the 7 persona `searchFocus` additions (Part 1).
2. `perf(grounding): cache + de-dupe web research per company to protect Tavily quota`
   — the `groundingAgent.ts` cache (Part 2).

Keep them as two commits so Part 2 can be reviewed (and reverted) independently
of Part 1. End commit messages with the project's standard co-author trailer.
