"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON Control — LLM & Search-API Pricing Config
   Editable on the Cost Settings page. Persisted to localStorage for now;
   when wired to the backend this becomes a config table the backend reads
   to compute $ cost per request. Add new providers/models freely.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as React from "react";

export type ProviderKind = "llm" | "search";

export interface PriceModel {
  id: string;
  /** Display name, e.g. "GPT-OSS 120B" */
  label: string;
  provider: string; // e.g. "OpenRouter", "Groq", "xAI"
  kind: ProviderKind;
  /** USD per 1M input/prompt tokens (LLM only). */
  inputPerM: number;
  /** USD per 1M output/completion tokens (LLM only). */
  outputPerM: number;
  /** USD per 1K search requests (search APIs only). */
  perKRequests: number;
  enabled: boolean;
}

// Defaults reflect the providers wired into the main backend today.
// Rates are starting estimates — tune them on the Cost Settings page.
export const DEFAULT_PRICING: PriceModel[] = [
  {
    id: "openrouter-gpt-oss-120b",
    label: "GPT-OSS 120B",
    provider: "OpenRouter",
    kind: "llm",
    inputPerM: 0.15,
    outputPerM: 0.6,
    perKRequests: 0,
    enabled: true,
  },
  {
    id: "groq-llama-3.3-70b",
    label: "Llama 3.3 70B Versatile",
    provider: "Groq",
    kind: "llm",
    inputPerM: 0.59,
    outputPerM: 0.79,
    perKRequests: 0,
    enabled: true,
  },
  {
    id: "hf-llama-3.3-70b",
    label: "Llama 3.3 70B (HuggingFace)",
    provider: "HuggingFace",
    kind: "llm",
    inputPerM: 0.0,
    outputPerM: 0.0,
    perKRequests: 0,
    enabled: false,
  },
  {
    id: "tavily-search",
    label: "Tavily Search",
    provider: "Tavily",
    kind: "search",
    inputPerM: 0,
    outputPerM: 0,
    perKRequests: 8.0,
    enabled: true,
  },
  {
    id: "perplexity-search",
    label: "Perplexity Sonar",
    provider: "Perplexity",
    kind: "search",
    inputPerM: 0,
    outputPerM: 0,
    perKRequests: 5.0,
    enabled: true,
  },
  {
    id: "xai-search",
    label: "xAI (Grok) Live Search",
    provider: "xAI",
    kind: "search",
    inputPerM: 0,
    outputPerM: 0,
    perKRequests: 25.0,
    enabled: true,
  },
];

const STORAGE_KEY = "qsim-control-pricing";

export function loadPricing(): PriceModel[] {
  if (typeof window === "undefined") return DEFAULT_PRICING;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as PriceModel[];
      // Merge: keep any new defaults that aren't saved yet.
      const byId = new Map(saved.map((m) => [m.id, m]));
      for (const def of DEFAULT_PRICING) if (!byId.has(def.id)) byId.set(def.id, def);
      return Array.from(byId.values());
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_PRICING;
}

export function savePricing(models: PriceModel[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
}

/** React hook: pricing state with persistence. */
export function usePricing() {
  const [models, setModels] = React.useState<PriceModel[]>(DEFAULT_PRICING);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    setModels(loadPricing());
  }, []);

  const update = React.useCallback((id: string, patch: Partial<PriceModel>) => {
    setModels((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    setDirty(true);
  }, []);

  const addModel = React.useCallback((model: PriceModel) => {
    setModels((prev) => [...prev, model]);
    setDirty(true);
  }, []);

  const removeModel = React.useCallback((id: string) => {
    setModels((prev) => prev.filter((m) => m.id !== id));
    setDirty(true);
  }, []);

  const save = React.useCallback(() => {
    savePricing(models);
    setDirty(false);
  }, [models]);

  const reset = React.useCallback(() => {
    setModels(DEFAULT_PRICING);
    savePricing(DEFAULT_PRICING);
    setDirty(false);
  }, []);

  return { models, dirty, update, addModel, removeModel, save, reset };
}
