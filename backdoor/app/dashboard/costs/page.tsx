"use client";

import * as React from "react";
import {
  IconPlus,
  IconTrash,
  IconDeviceFloppy,
  IconRefresh,
  IconLock,
  IconCurrencyDollar,
  IconBolt,
  IconWorld,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { usePricing, type PriceModel } from "@/lib/llm-pricing";

// ── New model form state ──────────────────────────────────────────────────────
const EMPTY_MODEL: Omit<PriceModel, "id"> = {
  label: "",
  provider: "",
  kind: "llm",
  inputPerM: 0,
  outputPerM: 0,
  perKRequests: 0,
  enabled: true,
};

function ModelRow({
  model,
  onUpdate,
  onRemove,
  readOnly,
}: {
  model: PriceModel;
  onUpdate: (id: string, patch: Partial<PriceModel>) => void;
  onRemove: (id: string) => void;
  readOnly: boolean;
}) {
  const isSearch = model.kind === "search";

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_1fr_120px_120px_80px_80px_48px]">
      {/* Label */}
      <div className="space-y-1">
        <Label className="text-[10px] uppercase text-muted-foreground">Model label</Label>
        <Input
          value={model.label}
          onChange={(e) => onUpdate(model.id, { label: e.target.value })}
          disabled={readOnly}
          className="h-8 text-sm"
        />
      </div>
      {/* Provider */}
      <div className="space-y-1">
        <Label className="text-[10px] uppercase text-muted-foreground">Provider</Label>
        <Input
          value={model.provider}
          onChange={(e) => onUpdate(model.id, { provider: e.target.value })}
          disabled={readOnly}
          className="h-8 text-sm"
        />
      </div>
      {/* Input $/M or $/K req */}
      <div className="space-y-1">
        <Label className="text-[10px] uppercase text-muted-foreground">
          {isSearch ? "$/1K req" : "Input $/M tkns"}
        </Label>
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
          <Input
            type="number"
            step="0.0001"
            min="0"
            value={isSearch ? model.perKRequests : model.inputPerM}
            onChange={(e) =>
              onUpdate(model.id, {
                [isSearch ? "perKRequests" : "inputPerM"]: parseFloat(e.target.value) || 0,
              })
            }
            disabled={readOnly}
            className="h-8 pl-5 text-sm tabular-nums"
          />
        </div>
      </div>
      {/* Output $/M (LLM only) */}
      <div className="space-y-1">
        <Label className="text-[10px] uppercase text-muted-foreground">
          {isSearch ? "— (N/A)" : "Output $/M tkns"}
        </Label>
        <div className="relative">
          {!isSearch && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>}
          <Input
            type="number"
            step="0.0001"
            min="0"
            value={isSearch ? "" : model.outputPerM}
            onChange={(e) => !isSearch && onUpdate(model.id, { outputPerM: parseFloat(e.target.value) || 0 })}
            disabled={readOnly || isSearch}
            placeholder={isSearch ? "—" : "0.00"}
            className="h-8 pl-5 text-sm tabular-nums"
          />
        </div>
      </div>
      {/* Kind badge */}
      <div className="flex flex-col gap-1">
        <Label className="text-[10px] uppercase text-muted-foreground">Kind</Label>
        <Badge
          variant="outline"
          className={`w-fit text-[10px] ${
            isSearch
              ? "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
              : "border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
          }`}
        >
          {isSearch ? <IconWorld className="mr-1 size-3" /> : <IconBolt className="mr-1 size-3" />}
          {model.kind}
        </Badge>
      </div>
      {/* Enabled toggle */}
      <div className="flex flex-col gap-1">
        <Label className="text-[10px] uppercase text-muted-foreground">Active</Label>
        <Switch
          checked={model.enabled}
          onCheckedChange={(v) => onUpdate(model.id, { enabled: v })}
          disabled={readOnly}
          className="mt-1"
        />
      </div>
      {/* Delete */}
      <div className="flex items-end">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(model.id)}
          disabled={readOnly}
        >
          <IconTrash className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export default function CostsPage() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";
  const { models, dirty, update, addModel, removeModel, save, reset } = usePricing();

  const [addForm, setAddForm] = React.useState({ ...EMPTY_MODEL });
  const [showAdd, setShowAdd] = React.useState(false);

  const llmModels = models.filter((m) => m.kind === "llm");
  const searchModels = models.filter((m) => m.kind === "search");

  function handleAdd() {
    if (!addForm.label || !addForm.provider) return;
    addModel({
      ...addForm,
      id: `custom-${Date.now()}`,
    });
    setAddForm({ ...EMPTY_MODEL });
    setShowAdd(false);
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        {/* Header actions */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">LLM & Search API Pricing</h2>
            <p className="text-sm text-muted-foreground">
              Configure cost rates used to estimate per-request spend. New providers can be added below.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isSuperadmin && (
              <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <IconLock className="size-3" /> Read-only (Admin)
              </Badge>
            )}
            {isSuperadmin && (
              <>
                <Button variant="outline" size="sm" onClick={reset} className="gap-1.5 text-xs">
                  <IconRefresh className="size-3.5" /> Reset defaults
                </Button>
                <Button size="sm" onClick={save} disabled={!dirty} className="gap-1.5 text-xs">
                  <IconDeviceFloppy className="size-3.5" /> {dirty ? "Save changes" : "Saved"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* LLM providers */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10">
                <IconBolt className="size-4 text-violet-500" />
              </div>
              <div>
                <CardTitle className="text-base">LLM Providers</CardTitle>
                <CardDescription className="text-xs">Cost per 1M input / output tokens</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {llmModels.map((m) => (
              <ModelRow
                key={m.id}
                model={m}
                onUpdate={update}
                onRemove={removeModel}
                readOnly={!isSuperadmin}
              />
            ))}
          </CardContent>
        </Card>

        {/* Search APIs */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10">
                <IconWorld className="size-4 text-sky-500" />
              </div>
              <div>
                <CardTitle className="text-base">Search APIs</CardTitle>
                <CardDescription className="text-xs">Cost per 1K search requests</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {searchModels.map((m) => (
              <ModelRow
                key={m.id}
                model={m}
                onUpdate={update}
                onRemove={removeModel}
                readOnly={!isSuperadmin}
              />
            ))}
          </CardContent>
        </Card>

        {/* Add new provider */}
        {isSuperadmin && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
                    <IconPlus className="size-4 text-emerald-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Add Provider / Model</CardTitle>
                    <CardDescription className="text-xs">Register a new LLM or search API and its pricing</CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowAdd((s) => !s)} className="text-xs">
                  {showAdd ? "Cancel" : "Add new"}
                </Button>
              </div>
            </CardHeader>
            {showAdd && (
              <CardContent className="space-y-4">
                <Separator />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Model label</Label>
                    <Input value={addForm.label} onChange={(e) => setAddForm((f) => ({ ...f, label: e.target.value }))} placeholder="e.g. GPT-4o" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Provider</Label>
                    <Input value={addForm.provider} onChange={(e) => setAddForm((f) => ({ ...f, provider: e.target.value }))} placeholder="e.g. OpenAI" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Kind</Label>
                    <select
                      value={addForm.kind}
                      onChange={(e) => setAddForm((f) => ({ ...f, kind: e.target.value as "llm" | "search" }))}
                      className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="llm">LLM</option>
                      <option value="search">Search API</option>
                    </select>
                  </div>
                  {addForm.kind === "llm" ? (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">Input $/M tokens</Label>
                        <Input type="number" step="0.0001" min="0" value={addForm.inputPerM} onChange={(e) => setAddForm((f) => ({ ...f, inputPerM: parseFloat(e.target.value) || 0 }))} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Output $/M tokens</Label>
                        <Input type="number" step="0.0001" min="0" value={addForm.outputPerM} onChange={(e) => setAddForm((f) => ({ ...f, outputPerM: parseFloat(e.target.value) || 0 }))} className="h-8 text-sm" />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <Label className="text-xs">$/1K requests</Label>
                      <Input type="number" step="0.01" min="0" value={addForm.perKRequests} onChange={(e) => setAddForm((f) => ({ ...f, perKRequests: parseFloat(e.target.value) || 0 }))} className="h-8 text-sm" />
                    </div>
                  )}
                </div>
                <Button onClick={handleAdd} disabled={!addForm.label || !addForm.provider} className="gap-1.5 text-xs">
                  <IconCurrencyDollar className="size-3.5" /> Add provider
                </Button>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
