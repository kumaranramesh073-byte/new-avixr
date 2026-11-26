import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ModuleDashboard } from '../../components/module/ModuleDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeDollarSign } from 'lucide-react';

function FinanceEngineCharts(charts: Record<string, any>) {
    const cashflow = charts.cashflow || [];
    const metrics = charts.metrics || [];

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Cash Flow Analysis</CardTitle>
                    <CardDescription className="text-xs">Operating vs Net position (4 Quarters)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cashflow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}
                                />
                                <ReferenceLine y={0} stroke="#94a3b8" />
                                <Bar dataKey="operating" name="Operating Cash" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="net" name="Net Position" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Unit Economics & Margins</CardTitle>
                    <CardDescription className="text-xs">Actual vs Target benchmarks</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}
                                />
                                <Bar dataKey="value" name="Actual" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={12} />
                                <Bar dataKey="target" name="Target" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function FinanceEngine() {
    return (
        <ModuleDashboard
            moduleKey="finance"
            title="Financial Engine"
            subtitle="CFO-grade unit economics & ROI"
            icon={BadgeDollarSign}
            accent="bg-emerald-100 text-emerald-600"
            extraCharts={FinanceEngineCharts}
        />
    );
}
