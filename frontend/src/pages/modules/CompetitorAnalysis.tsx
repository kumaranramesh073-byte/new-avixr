import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ModuleDashboard } from '../../components/module/ModuleDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crosshair } from 'lucide-react';

function CompetitorAnalysisCharts(charts: Record<string, any>) {
    const featureParity = charts.feature_parity || [];
    const pricingMap = charts.pricing_map || [];

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Feature Parity vs Top Competitor</CardTitle>
                    <CardDescription className="text-xs">Us vs Them across core capabilities</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={featureParity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="feature" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}
                                />
                                <Bar dataKey="us" name="Us" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={12} />
                                <Bar dataKey="them" name="Them" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Pricing Topology</CardTitle>
                    <CardDescription className="text-xs">Head-to-head tier comparison</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pricingMap} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="tier" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}
                                />
                                <Bar dataKey="our_price" name="Our Price ($)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={25} />
                                <Bar dataKey="their_price" name="Their Price ($)" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={25} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function CompetitorAnalysis() {
    return (
        <ModuleDashboard
            moduleKey="competitor"
            title="Competitor War Room"
            subtitle="Strategic threat intelligence & positioning"
            icon={Crosshair}
            accent="bg-orange-100 text-orange-600"
            extraCharts={CompetitorAnalysisCharts}
        />
    );
}
