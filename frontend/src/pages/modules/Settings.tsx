import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, Save, Database, Shield, BrainCircuit } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

export default function Settings() {
    const { businessDNA, completeOnboarding } = useAuthStore();
    const addToast = useToastStore(s => s.addToast);
    const [dnaForm, setDnaForm] = useState(businessDNA || {
        companyName: '', companyWebsite: '', industry: '', companyDescription: '',
        teamSize: '', goals: [] as string[],
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (businessDNA) setDnaForm(businessDNA);
    }, [businessDNA]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await completeOnboarding(dnaForm);
            addToast('Business DNA saved to database', 'success');
        } catch (err: any) {
            addToast(err?.message || 'Failed to save Business DNA', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-full bg-transparent pb-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-background px-4 py-3 lg:px-6">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <SettingsIcon size={18} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold tracking-tight text-foreground">Platform Settings</h1>
                        <p className="text-xs text-muted-foreground">Manage your Business DNA & Governance</p>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
                
                {/* Business DNA */}
                <Card>
                    <CardHeader className="border-b bg-white/5 pb-4">
                        <div className="flex items-center gap-2">
                            <BrainCircuit size={18} className="text-primary" />
                            <div>
                                <CardTitle className="text-base">Business DNA</CardTitle>
                                <CardDescription className="text-xs">The foundational context used by all AI agents</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600">Company Name</label>
                                <input
                                    type="text"
                                    value={dnaForm.companyName}
                                    onChange={e => setDnaForm({ ...dnaForm, companyName: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600">Industry Sector</label>
                                <input
                                    type="text"
                                    value={dnaForm.industry}
                                    onChange={e => setDnaForm({ ...dnaForm, industry: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-semibold text-slate-600">Company Website</label>
                                <input
                                    type="url"
                                    value={dnaForm.companyWebsite || ''}
                                    onChange={e => setDnaForm({ ...dnaForm, companyWebsite: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-semibold text-slate-600">Company Description</label>
                                <textarea
                                    rows={3}
                                    value={dnaForm.companyDescription}
                                    onChange={e => setDnaForm({ ...dnaForm, companyDescription: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600">Team Size</label>
                                <input
                                    type="text"
                                    value={dnaForm.teamSize || ''}
                                    onChange={e => setDnaForm({ ...dnaForm, teamSize: e.target.value })}
                                    placeholder="e.g. 10–50"
                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600">Strategic Goals (comma-separated)</label>
                                <input
                                    type="text"
                                    value={(dnaForm.goals || []).join(', ')}
                                    onChange={e => setDnaForm({ ...dnaForm, goals: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                    placeholder="Revenue Growth, Cost Reduction"
                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-70"
                            >
                                <Save size={16} />
                                {saving ? 'Saving...' : 'Save DNA'}
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Governance & Memory */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader className="border-b bg-white/5 pb-4">
                            <div className="flex items-center gap-2">
                                <Shield size={18} className="text-primary" />
                                <div>
                                    <CardTitle className="text-base">Agent Governance</CardTitle>
                                    <CardDescription className="text-xs">Control autonomous execution limits</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold">Human-in-the-Loop</p>
                                    <p className="text-xs text-muted-foreground">Require approval for high-risk scenarios</p>
                                </div>
                                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary">
                                    <span className="inline-block h-4 w-4 translate-x-6 transform rounded-full bg-white transition" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold">Cross-Module Overrides</p>
                                    <p className="text-xs text-muted-foreground">Allow AI Advisor to override module scores</p>
                                </div>
                                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary">
                                    <span className="inline-block h-4 w-4 translate-x-6 transform rounded-full bg-white transition" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b bg-white/5 pb-4">
                            <div className="flex items-center gap-2">
                                <Database size={18} className="text-primary" />
                                <div>
                                    <CardTitle className="text-base">Memory Layer</CardTitle>
                                    <CardDescription className="text-xs">Manage historical simulation data</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold">Current State Memory</p>
                                        <p className="text-xs text-muted-foreground">Active session cache (12 MB)</p>
                                    </div>
                                    <button className="text-xs font-semibold text-red-600 hover:underline">Clear</button>
                                </div>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold">Historical Scenarios</p>
                                        <p className="text-xs text-muted-foreground">24 saved permutations</p>
                                    </div>
                                    <button className="text-xs font-semibold text-primary hover:underline">Export</button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
