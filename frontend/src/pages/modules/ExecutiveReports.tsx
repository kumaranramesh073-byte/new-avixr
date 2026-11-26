import { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Presentation, Download, RefreshCw, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

// Mock data to simulate the aggregated state of all agents if they haven't been run yet
const MOCK_MODULES = [
    { key: 'advisor', name: 'AI Advisor', status: 'optimal', score: 88, alert: 'Strategic misalignment resolved', trend: 'up' },
    { key: 'twin', name: 'Digital Twin', status: 'warning', score: 68, alert: 'Engineering bottleneck detected', trend: 'down' },
    { key: 'forecasting', name: 'Forecasting', status: 'optimal', score: 82, alert: 'Revenue on track (+11%)', trend: 'up' },
    { key: 'risk', name: 'Risk Center', status: 'warning', score: 58, alert: 'Supply chain disruption risk', trend: 'down' },
    { key: 'market', name: 'Market Intel', status: 'optimal', score: 75, alert: 'Whitespace identified', trend: 'up' },
    { key: 'competitor', name: 'Competitors', status: 'warning', score: 65, alert: 'Rival freemium launch', trend: 'down' },
    { key: 'finance', name: 'Finance Engine', status: 'optimal', score: 88, alert: 'EBITDA protected', trend: 'up' },
    { key: 'sentiment', name: 'Sentiment', status: 'optimal', score: 85, alert: 'NPS stable', trend: 'flat' },
];

export default function ExecutiveReports() {
    const businessDNA = useAuthStore(s => s.businessDNA);
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const handleGenerate = () => {
        setGenerating(true);
        setTimeout(() => {
            setGenerating(false);
            setGenerated(true);
        }, 2500);
    };

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#f8fafc',
                logging: false,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgHeight = (canvas.height * pageWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
            heightLeft -= pageHeight;
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            const company = businessDNA?.companyName || 'Company';
            pdf.save(`${company}-Executive-Board-Report.pdf`);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="min-h-full bg-[#f8fafc] pb-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-background px-4 py-3 lg:px-6">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <Presentation size={18} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold tracking-tight text-foreground">Executive Board Report</h1>
                        <p className="text-xs text-muted-foreground">Aggregated intelligence across all modules</p>
                    </div>
                </div>
                <button
                    onClick={generated ? handleDownloadPDF : handleGenerate}
                    disabled={generating || downloading}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-70"
                >
                    {(generating || downloading) ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                    {generating ? 'Compiling Deck...' : downloading ? 'Downloading...' : generated ? 'Download PDF' : 'Generate PDF Deck'}
                </button>
            </div>

            <div ref={reportRef} className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
                
                {generated && (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                        <CheckCircle2 size={20} className="text-emerald-600" />
                        <div>
                            <p className="text-sm font-semibold">Board Report Generated</p>
                            <p className="text-xs opacity-90">The comprehensive 15-page synthesis has been compiled and saved to your workspace.</p>
                        </div>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={downloading}
                            className="ml-auto rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-70"
                        >
                            {downloading ? 'Downloading...' : 'Download PDF'}
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card className="bg-gradient-to-br from-primary to-indigo-600 text-white shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-white/80">Company Focus</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{businessDNA?.companyName || 'Acme Corp'}</div>
                            <div className="text-sm text-white/80">{businessDNA?.industry || 'Technology'}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Overall System Health</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">Optimal</div>
                            <div className="text-sm text-muted-foreground">5 of 8 modules reporting green</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Threats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-500">3 Critical</div>
                            <div className="text-sm text-muted-foreground">Requires executive alignment</div>
                        </CardContent>
                    </Card>
                </div>

                <h2 className="mt-8 text-lg font-bold tracking-tight">Module Status Matrix</h2>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {MOCK_MODULES.map(mod => (
                        <Card key={mod.key} className={mod.status === 'warning' ? 'border-amber-200 bg-amber-50/30' : ''}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-bold">{mod.name}</CardTitle>
                                    <Badge variant="outline" className={mod.status === 'optimal' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>
                                        {mod.score}/100
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start gap-2">
                                    {mod.status === 'optimal' ? (
                                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                                    ) : (
                                        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                                    )}
                                    <p className="text-xs font-medium text-foreground/80">{mod.alert}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileText size={16} className="text-primary" /> Executive Narrative
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                            <p>
                                Q-SIMUTRON has synthesized intelligence across all 8 operational vectors. The primary strategic tension lies between defending market share against <strong>Rival Alpha's new freemium tier</strong> and protecting <strong>EBITDA margins</strong> during an inflationary period.
                            </p>
                            <p>
                                The AI Advisor recommends a <strong>"Defend & Deepen"</strong> strategy. This involves rolling out a defensive pricing bundle to protect the top-of-funnel, while simultaneously instituting a hiring freeze and reallocating existing engineering resources to solve the QA automation bottleneck identified by the Digital Twin.
                            </p>
                            <p>
                                Executing this unified strategy is projected to stabilize LTV:CAC ratios, prevent enterprise churn, and yield a +8% revenue impact over the next 3 quarters without compromising the cash runway.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Board-Level Action Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { action: 'Approve Defensive Pricing Bundle', owner: 'Product & Sales', deadline: 'Next 14 Days' },
                                    { action: 'Implement Q3 Hiring Freeze', owner: 'Finance & HR', deadline: 'Immediate' },
                                    { action: 'Reallocate 15% R&D to QA Automation', owner: 'Engineering', deadline: 'Next 30 Days' },
                                    { action: 'Launch Enterprise Health-Checks', owner: 'Customer Success', deadline: 'Next 7 Days' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-lg border bg-card p-3">
                                        <div>
                                            <p className="text-sm font-semibold">{item.action}</p>
                                            <p className="text-xs text-muted-foreground">Owner: {item.owner}</p>
                                        </div>
                                        <Badge variant="secondary">{item.deadline}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
