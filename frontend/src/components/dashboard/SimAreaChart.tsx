import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SimAreaChartProps {
    marketScore: number;
    competitorThreat: number;
    stabilityScore: number;
}

function generateProjection(base: number, months: number, volatility: number) {
    const points = [];
    let val = base;
    const now = new Date();
    for (let i = 0; i < months; i++) {
        const d = new Date(now);
        d.setMonth(now.getMonth() - (months - 1 - i));
        val = Math.max(5, Math.min(95, val + (Math.random() - 0.48) * volatility));
        points.push({ month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), value: Math.round(val) });
    }
    return points;
}

export function SimAreaChart({ marketScore, competitorThreat, stabilityScore }: SimAreaChartProps) {
    const [range, setRange] = React.useState('12m');

    const months = range === '3m' ? 3 : range === '6m' ? 6 : 12;

    const marketData = React.useMemo(() => generateProjection(marketScore, months, 8), [marketScore, months]);
    const threatData = React.useMemo(() => generateProjection(competitorThreat, months, 10), [competitorThreat, months]);
    const stabilityData = React.useMemo(() => generateProjection(stabilityScore, months, 6), [stabilityScore, months]);

    const combined = marketData.map((d, i) => ({
        month: d.month,
        market: d.value,
        threat: threatData[i]?.value ?? 50,
        stability: stabilityData[i]?.value ?? 50,
    }));

    const chartConfig = {
        market: { label: 'Market Score', color: '#6366f1' },
        threat: { label: 'Competitor Threat', color: '#ef4444' },
        stability: { label: 'Stability', color: '#22c55e' },
    };

    return (
        <Card className="@container/card">
            <CardHeader>
                <CardTitle>Simulation Trajectory</CardTitle>
                <CardDescription>Projected market, threat, and stability curves</CardDescription>
                <CardAction>
                    <Select value={range} onValueChange={setRange}>
                        <SelectTrigger className="w-32 h-8 text-xs" aria-label="Time range">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="3m" className="rounded-lg text-xs">3 months</SelectItem>
                            <SelectItem value="6m" className="rounded-lg text-xs">6 months</SelectItem>
                            <SelectItem value="12m" className="rounded-lg text-xs">12 months</SelectItem>
                        </SelectContent>
                    </Select>
                </CardAction>
            </CardHeader>
            <CardContent className="px-2 pt-2 sm:px-6 sm:pt-4">
                <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full">
                    <AreaChart data={combined}>
                        <defs>
                            <linearGradient id="fillMarket" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="fillThreat" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="fillStability" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} width={28} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <Area dataKey="market" type="natural" fill="url(#fillMarket)" stroke="#6366f1" strokeWidth={2} />
                        <Area dataKey="threat" type="natural" fill="url(#fillThreat)" stroke="#ef4444" strokeWidth={2} />
                        <Area dataKey="stability" type="natural" fill="url(#fillStability)" stroke="#22c55e" strokeWidth={2} />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
