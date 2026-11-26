import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart3 } from 'lucide-react';

interface Props {
    data: Array<{ period: string; revenue: number; cost: number; profit: number }>;
}

const config = {
    revenue: { label: 'Revenue', color: '#6366f1' },
    cost: { label: 'Cost', color: '#f97316' },
    profit: { label: 'Profit', color: '#22c55e' },
};

export function FinancialProjectionChart({ data }: Props) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100">
                        <BarChart3 size={15} className="text-emerald-600" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Financial Projection</CardTitle>
                        <CardDescription className="text-xs">Revenue · cost · profit across the forward window</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-2 pt-2 sm:px-6">
                <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
                    <BarChart data={data} barGap={2}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                        <YAxis tickLine={false} axisLine={false} width={40} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                        <ChartTooltip cursor={{ fill: 'rgba(99,102,241,0.05)' }} content={<ChartTooltipContent />} />
                        <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="cost" fill="#f97316" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartContainer>
                <div className="mt-2 flex justify-center gap-4">
                    {Object.entries(config).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="size-2.5 rounded-sm" style={{ background: v.color }} />
                            {v.label}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
