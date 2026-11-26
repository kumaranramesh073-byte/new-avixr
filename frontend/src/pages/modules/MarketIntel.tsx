import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ModuleDashboard } from '../../components/module/ModuleDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Compass } from 'lucide-react';

function MarketIntelCharts(charts: Record<string, any>) {
    const marketShare = charts.market_share || [];
    const trendRadar = charts.trend_radar || [];

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Market Share</CardTitle>
                    <CardDescription className="text-xs">Competitive landscape distribution</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={marketShare} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="competitor" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}
                                />
                                <Bar dataKey="share" radius={[0, 4, 4, 0]} barSize={20}>
                                    {marketShare.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : '#94a3b8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Trend Radar</CardTitle>
                    <CardDescription className="text-xs">Alignment with macro forces</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={trendRadar}>
                                <PolarGrid strokeDasharray="3 3" opacity={0.3} />
                                <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function MarketIntel() {
    return (
        <ModuleDashboard
            moduleKey="market"
            title="Market Intelligence"
            subtitle="Competitor heatmap & whitespace opportunities"
            icon={Compass}
            accent="bg-indigo-100 text-indigo-600"
            extraCharts={MarketIntelCharts}
        />
    );
}
