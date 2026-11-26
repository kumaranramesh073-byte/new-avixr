# Q-SIMUTRON — Unified Theme Across OCT + All AI Agent Modules

**Implementation Plan & Investigation Report**
Author: Investigation by Claude (Opus 4.8) · Date: 2026-06-03
Audience: The engineer (human or LLM) who will implement this.
Goal: Make every AI-agent module page (and the Mermaid diagrams) follow the
**same theme as the main OCT dashboard**.

> **TL;DR for the implementer.** The OCT home and the module pages already use
> the *same* component system (shadcn `Card` + semantic Tailwind tokens). They
> look different for **one reason**: the shadcn `--primary` color is set to
> near-black (`0 0% 9%`), but the OCT brand identity is **indigo** (`#4f46e5` /
> `#6366f1`, hardcoded in the OCT home). So every `bg-primary` / `text-primary`
> across the 8 modules renders black instead of the brand indigo.
> **The fix is mostly ONE change:** set `--primary` and `--ring` to the OCT
> indigo in [frontend/src/index.css](../frontend/src/index.css). That single
> edit re-themes every module, the OCT results, the charts, and the advisor
> panels to the brand color at once, because they all read `--primary`.
> Then do two small follow-ups: (2) make the **Mermaid** renderer read its
> colors from the app tokens so diagrams match, and (3) sweep a few hardcoded
> hex values in the OCT home so the source of truth is the token, not a literal.
> Follow §5 → §6 → §7, verify with §8.

---

## 1. What "the theme" actually is (investigation)

There are **two parallel styling systems** in the frontend, and the confusion
comes from them disagreeing on the accent color.

### System A — shadcn/ui semantic tokens (the component layer)
Defined in [frontend/src/index.css](../frontend/src/index.css) `:root` and wired
into [tailwind.config.ts](../frontend/tailwind.config.ts). These are HSL triplets
consumed as `bg-primary`, `text-foreground`, `bg-muted`, `text-muted-foreground`,
`bg-card`, `border`, etc. **Both** the OCT results dashboard and every module
dashboard are built almost entirely from these:
- Module shell: [ModuleDashboard.tsx](../frontend/src/components/module/ModuleDashboard.tsx)
- OCT results: [DashboardTabs.tsx](../frontend/src/components/dashboard/DashboardTabs.tsx)

Both use `<Card>` from `@/components/ui/card`, `bg-primary/10 text-primary` for
icon chips, `text-muted-foreground` for captions, `bg-muted` for tracks, etc.
**Structurally they are already the same theme.**

### System B — `--qs-*` brand tokens + inline hex (the page layer)
Also defined in [index.css](../frontend/src/index.css) (the `--qs-blue`,
`--qs-gray-*`, fonts, radii, shadows block). Used by the older app chrome
(`Home.tsx`, sidebar/topbar) and — critically — by the **OCT home/centerpiece**
[MorningBriefing.tsx](../frontend/src/pages/MorningBriefing.tsx), which uses
**inline styles with hardcoded indigo hex** (`#4f46e5` button, `#6366f1`
spinner/accents, `#c7d2fe`/`#e0e7ff` rings) and `fontFamily: 'system-ui'`.

### The exact mismatch
| Surface | Accent it actually renders | Source |
|---|---|---|
| OCT home (Run OCT button, rings, spinner) | **Indigo `#4f46e5`/`#6366f1`** | hardcoded inline in `MorningBriefing.tsx` |
| OCT results (`DashboardTabs`) | **Black** (`--primary` = `0 0% 9%`) | `bg-primary/10 text-primary` |
| All 8 module dashboards | **Black** (`--primary`) | `ModuleDashboard.tsx` semantic tokens |
| Charts (`hsl(var(--primary))`) | **Black** | `Forecasting.tsx`, `MarketIntel.tsx` |
| Mermaid ripple diagrams | **Indigo `#6366f1`** | hardcoded in `MermaidRenderer.tsx` |

So the brand-defining OCT button is indigo, but everything built on `--primary`
is black, and Mermaid is its own indigo. Three different "accents" → the modules
feel like a different product from the OCT home. **There is no dark mode** to
worry about (`tailwind.config.ts` declares `darkMode: ['class']` but no dark
variables or theme toggle exist), so this is a single light theme.

### Confirmed evidence (line refs)
- `--primary: 0 0% 9%;` and `--ring: 221 83% 53%;` — [index.css](../frontend/src/index.css) `:root`.
- OCT indigo button `background: '#4f46e5'` — [MorningBriefing.tsx:189](../frontend/src/pages/MorningBriefing.tsx#L189); spinner `#6366f1` — lines 319-321; rings `#c7d2fe`/`#e0e7ff` — lines 166-178; `fontFamily: 'system-ui'` — lines 133, 271.
- Module accents use `bg-primary/10 text-primary`, `border-l-primary`, `bg-primary/60` throughout [ModuleDashboard.tsx](../frontend/src/components/module/ModuleDashboard.tsx) (e.g. lines 335, 402, 404, 67, 222).
- Charts bind brand color to `hsl(var(--primary))` — [Forecasting.tsx:24-36](../frontend/src/pages/modules/Forecasting.tsx#L24), [MarketIntel.tsx:31-52](../frontend/src/pages/modules/MarketIntel.tsx#L31).
- Mermaid hardcodes `lineColor: '#6366f1'`, `primaryColor: '#f0f4ff'`, `primaryBorderColor: '#c7d2fe'`, `fontSize: '13px'` (no `fontFamily`) — [MermaidRenderer.tsx:4-24](../frontend/src/components/shared/MermaidRenderer.tsx#L4).

---

## 2. Root-Cause Summary

The modules are **not** mis-built — they correctly use semantic tokens. They look
wrong only because the **brand accent token (`--primary`) holds the wrong value
(black)**. The OCT identity that the user calls "correct" is indigo, but it lives
as hardcoded hex in one page instead of in the token. Unifying the theme = making
the token equal the brand, then pointing the few hardcoded/independent surfaces
(Mermaid, OCT inline hex) at that same source of truth.

---

## 3. Design Decisions

**Decision 1 — Canonical accent = the OCT indigo.** The user said the OCT home is
the correct theme; its button is `#4f46e5` (indigo-600). We adopt that as the app
brand `--primary`. (Note: a different blue, `--qs-blue: #2563FF`, also exists in
the codebase. We are standardizing on the OCT indigo because that is the "main"
the user pointed at. If the brand should instead be `#2563FF`, it is a one-line
change at the same spot — see §6.1's note.)

**Decision 2 — Drive everything from tokens, don't repaint each component.**
Because both dashboards already consume `--primary`, we change the token, not the
57 call-sites. This is the smallest, safest, most consistent change and it
guarantees future surfaces inherit the theme automatically.

**Decision 3 — Use indigo-600 (`#4f46e5`), not indigo-500 (`#6366f1`), for
`--primary`.** `--primary` is used behind small text (`text-primary` on 11-12px
labels in `ModuleDashboard`). On white, `#4f46e5` has ~5.9:1 contrast (passes
WCAG AA for text) while `#6366f1` is ~3.6:1 (fails for small text). Use `#6366f1`
only for large fills/diagram lines where contrast is not a text concern.

**Decision 4 — Keep the per-module *icon* accents.** Each module passes its own
icon chip color (e.g. Risk = `bg-red-100 text-red-600`, Market =
`bg-indigo-100 text-indigo-600`) via the `accent` prop. These are intentional
per-module identity and are **not** the brand primary — leave them. Unification
is about the shared `--primary`, surfaces, and Mermaid, not about flattening
every semantic color (red alerts, green success, amber opportunities stay).

**Decision 5 — Mermaid reads from the live tokens.** Instead of hardcoding indigo,
the renderer will read the app CSS variables at render time so diagrams always
match the current theme (and the IBM Plex font), with a safe fallback.

---

## 4. Scope — Files To Touch

| # | File | Change | Effort |
|---|------|--------|--------|
| 1 | `frontend/src/index.css` | Retoken `--primary`, `--ring`, `--chart-1`; add `--qs-indigo*` brand tokens | tiny, **highest leverage** |
| 2 | `frontend/src/components/shared/MermaidRenderer.tsx` | Theme Mermaid from app tokens + IBM Plex font | small |
| 3 | `frontend/src/pages/MorningBriefing.tsx` | Replace hardcoded indigo hex + `system-ui` font with the tokens | small, optional-but-recommended |
| — | All 8 module pages, `ModuleDashboard`, `DashboardTabs`, advisor panels, charts | **none** — they inherit via `--primary` | 0 |

> The reason the table is so short is the whole point of the investigation: the
> components are already token-driven, so the theme lives in the tokens.

---

## 5. PART 1 (Required, do first) — Retoken the brand color

File: [frontend/src/index.css](../frontend/src/index.css), the shadcn `:root`
block (the one with `--background`, `--primary`, etc. near the top).

### 5.1 Change these three lines
Find and replace **values only** (keep the variable names):

```css
/* BEFORE */
--primary: 0 0% 9%;
--ring: 221 83% 53%;
--chart-1: 221 83% 53%;

/* AFTER  (243 75% 59% == #4f46e5, the OCT indigo button color) */
--primary: 243 75% 59%;
--ring: 243 75% 59%;
--chart-1: 243 75% 59%;
```

Leave `--primary-foreground: 0 0% 98%;` (white) unchanged — white text on indigo
is correct and high-contrast.

### 5.2 Add brand indigo tokens to the `--qs-*` block
In the second `:root` block (the `/* Brand Colors */` section with `--qs-blue`),
add these so Mermaid and the OCT page can reference one source of truth instead of
literal hex:

```css
  /* Indigo brand (canonical app accent — matches OCT) */
  --qs-indigo: #4f46e5;        /* indigo-600 — primary accent / text-safe */
  --qs-indigo-bright: #6366f1; /* indigo-500 — large fills, diagram lines */
  --qs-indigo-light: #eef2ff;  /* indigo-50  — soft node/background fills */
  --qs-indigo-border: #c7d2fe; /* indigo-200 — borders / rings */
```

### 5.3 What this immediately fixes (no further code)
After §5.1 alone, the following all become indigo and match the OCT identity:
- Every module: executive-summary left border + gradient, "Recommended" badge,
  confidence bars, `text-primary` actions, icon chips that use `bg-primary/10`,
  the loading spinner ring, the Re-run focus ring.
- OCT results (`DashboardTabs`) header chip + any `--primary` usage.
- Forecasting revenue area + Market share/radar charts (`hsl(var(--primary))`).
- All shadcn focus rings (`--ring`) and primary buttons app-wide.

---

## 6. PART 2 (Required) — Make Mermaid follow the app theme

File: [frontend/src/components/shared/MermaidRenderer.tsx](../frontend/src/components/shared/MermaidRenderer.tsx)

Today Mermaid is initialized **once at module import** with hardcoded indigo and
no app font. Change it to initialize from the live CSS tokens inside the render
effect, so diagrams always match the current theme and use IBM Plex.

### 6.1 Add a token reader (top of file, after imports)
```ts
// Read an app CSS custom property at runtime, with a fallback.
function cssVar(name: string, fallback: string): string {
    if (typeof window === 'undefined') return fallback;
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
}
```

### 6.2 Remove the top-level `mermaid.initialize({...})` call (lines 4-24)
Delete the static `mermaid.initialize(...)` block. We will initialize per-render
with theme values instead.

### 6.3 Initialize from tokens inside the render effect
In the existing `useEffect` that calls `mermaid.render(...)` (around line 87),
initialize **before** rendering, reading the tokens added in §5.2:

```ts
        (async () => {
            try {
                const indigo       = cssVar('--qs-indigo',        '#4f46e5');
                const indigoBright = cssVar('--qs-indigo-bright', '#6366f1');
                const indigoLight  = cssVar('--qs-indigo-light',  '#eef2ff');
                const indigoBorder = cssVar('--qs-indigo-border', '#c7d2fe');
                const ink          = cssVar('--qs-gray-900',      '#111827');
                const font         = cssVar('--font-primary',
                    "'IBM Plex Sans', -apple-system, sans-serif");

                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'base',
                    themeVariables: {
                        background: '#ffffff',
                        primaryColor: indigoLight,
                        primaryTextColor: ink,
                        primaryBorderColor: indigoBorder,
                        lineColor: indigoBright,
                        secondaryColor: '#f9fafb',
                        tertiaryColor: '#f3f4f6',
                        edgeLabelBackground: '#ffffff',
                        fontFamily: font,
                        fontSize: '13px',
                    },
                    flowchart: { curve: 'basis', htmlLabels: true, padding: 20 },
                    securityLevel: 'loose',
                });

                const cleanChart = sanitizeMermaid(chart);
                const { svg } = await mermaid.render(diagramId, cleanChart);
                if (!cancelled) setSvgContent(svg);
            } catch (err: any) {
                if (!cancelled) {
                    console.warn('[MermaidRenderer] Render error:', err?.message);
                    setError(err?.message ?? 'Invalid Mermaid syntax');
                }
            }
        })();
```

### 6.4 (Optional) align the classDef preset to brand tokens
The `PRESET` map in `sanitizeMermaid` (lines 48-57) already uses the standard
semantic palette (`danger`/`warn`/`safe` = red/yellow/green) which matches the
`--qs-red/yellow/green` tokens — **leave these as-is**; they are the universal
ripple semantics and are consistent with the app. No change needed unless you
want the neutral/`info` class to use indigo: set
`info: 'fill:#eef2ff,stroke:#4f46e5,color:#3730a3'`.

**Result:** ripple diagrams render with indigo nodes/lines and IBM Plex text that
exactly match the (now-indigo) module cards and OCT identity.

---

## 7. PART 3 (Recommended) — Point the OCT home at the tokens

File: [frontend/src/pages/MorningBriefing.tsx](../frontend/src/pages/MorningBriefing.tsx)

The OCT home is "correct" visually, but it hardcodes the indigo hex and uses
`system-ui` while modules use IBM Plex. To make the **token** the single source of
truth (so future theme tweaks propagate) and to unify the font, do these
low-risk replacements. These are cosmetic-equivalent today and prevent drift.

1. **Font.** Replace both `fontFamily: 'system-ui, -apple-system, sans-serif'`
   occurrences (lines ~133 and ~271) with `fontFamily: 'var(--font-primary)'`.
   This matches the modules (which inherit IBM Plex from `body`).
2. **Indigo literals → tokens.** Swap the hardcoded hex for `var(--qs-indigo*)`:
   - Button `background: '#4f46e5'` → `'var(--qs-indigo)'` (line ~189)
   - Spinner border-top `'#6366f1'` and `Zap color="#6366f1"` → `'var(--qs-indigo-bright)'` (lines ~319-321)
   - Ring borders `'#c7d2fe'`, `'#e0e7ff'` → `'var(--qs-indigo-border)'` (lines ~166-178)

> This part is optional for *visual* parity (OCT already looks right) but
> required for *true* unification — after it, changing the brand is a single
> token edit and nothing in OCT is pinned to a literal. If time-boxed, ship
> Parts 1-2 first; Part 3 can follow.

---

## 8. Verification

1. **Type-check:** `cd frontend && npx tsc --noEmit` → exit 0.
2. **Run the app** (dev server) and log in past onboarding.
3. **OCT home (`/oct`):** the Run OCT button, rings, and spinner are indigo —
   unchanged from before (proves Part 1 didn't regress the reference).
4. **Each module (`/forecast`, `/risk`, `/market`, `/finance`, `/sentiment`,
   `/competitors`, `/twin`, `/advisor`):** confirm the executive-summary accent
   bar, "Recommended" scenario badge, confidence bars, `text-primary` actions,
   and the loading spinner are now **indigo**, not black. Side-by-side with `/oct`
   the accent should be identical.
5. **Charts:** Forecasting revenue area and Market share/radar render in indigo
   (they bind `hsl(var(--primary))`).
6. **Mermaid:** open any module's "Ripple Effect Chain" and the OCT Mirror-World
   graph — nodes/lines are indigo and the text is IBM Plex; the two diagrams look
   like the same design language.
7. **Contrast spot-check:** small `text-primary` labels (e.g. the recommended-
   action line in "Why This Matters") are legible on white — confirms the
   indigo-600 choice over indigo-500.
8. **Buttons/focus:** any primary button + keyboard focus ring app-wide is indigo.

---

## 9. Risks, Edge Cases, Rollback

- **Over-darkening / wrong shade.** If indigo-600 reads too dark or off-brand,
  swap §5.1 to indigo-500 `239 84% 67%` (`#6366f1`) — but re-check small-text
  contrast (Decision 3). One-line change.
- **Brand is actually blue, not indigo.** If the intended brand is `--qs-blue`
  `#2563FF`, set `--primary`/`--ring`/`--chart-1` to `221 100% 57%` instead. Same
  single spot; everything re-themes accordingly. (We chose indigo per "follow the
  main OCT".)
- **A surface that *wanted* black primary.** Search for `bg-primary`/`text-primary`
  used as a neutral (e.g. body text) — none found in the module/dashboard sweep;
  primary is used as an accent everywhere. If one turns up looking too colorful,
  switch that specific call-site to `text-foreground`/`bg-foreground`.
- **Mermaid init timing.** Initializing inside the effect (Part 2) runs after the
  DOM/CSS exist, so `getComputedStyle` returns real values; the `cssVar` fallbacks
  cover SSR/first-paint. No global re-init race because each render sets the theme
  immediately before `mermaid.render`.
- **Rollback.** Part 1: restore the three original values in `index.css`
  (`--primary: 0 0% 9%`, `--ring`/`--chart-1: 221 83% 53%`). Part 2: restore the
  static `mermaid.initialize` block. Part 3: revert the hex/font swaps. All three
  parts are independent.

---

## 10. Suggested Commit Sequence

1. `style(theme): set brand --primary/--ring to OCT indigo so all modules match the OCT accent`
   — `index.css` (Part 1). This is the visible unification.
2. `style(mermaid): theme ripple diagrams from app tokens + IBM Plex font`
   — `MermaidRenderer.tsx` (Part 2).
3. `refactor(oct): replace hardcoded indigo hex + system-ui with brand tokens`
   — `MorningBriefing.tsx` (Part 3).

Keep them separate so the high-impact token change (1) can be reviewed and, if
needed, reverted independently of the Mermaid and OCT-cleanup work. End commit
messages with the project's standard co-author trailer.
