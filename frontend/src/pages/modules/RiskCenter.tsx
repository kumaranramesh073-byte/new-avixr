import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { ModuleDashboard } from '../../components/module/ModuleDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

function RiskCenterCharts(charts: Record<string, any>) {
    const riskCategories = charts.risk_categories || [];
    const trend = charts.trend || [];

    const getSeverityColor = (severity: string) => {
        if (severity === 'critical') return '#ef4444'; // red-500
        if (severity === 'high') return '#f97316'; // orange-500
        if (severity === 'medium') return '#eab308'; // yellow-500
        return '#22c55e'; // green-500
    };

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Risk Topology</CardTitle>
                    <CardDescription className="text-xs">Category-level risk distribution</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={riskCategories} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}
                                />
                                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                                    {riskCategories.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={getSeverityColor(entry.severity)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Historical Risk Trend</CardTitle>
                    <CardDescription className="text-xs">Overall risk score trajectory (6 months)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}
                                />
                                <Line type="monotone" dataKey="score" name="Overall Risk" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function RiskCenter() {
    return (
        <ModuleDashboard
            moduleKey="risk"
            title="Risk Center"
            subtitle="Enterprise threat intelligence & mitigation"
            icon={ShieldAlert}
            accent="bg-red-100 text-red-600"
            extraCharts={RiskCenterCharts}
        />
    );
}
