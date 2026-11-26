import { Pie, PieChart, Cell, Label } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart as PieIcon } from 'lucide-react';

const PALETTE = ['#6366f1', '#f97316', '#22c55e', '#eab308', '#06b6d4', '#ec4899'];

interface Props {
    title: string;
    description: string;
    data: Array<{ name: string; value: number }>;
    highlightFirst?: boolean;
}

export function MarketShareChart({ title, description, data, highlightFirst }: Props) {
    const total = data.reduce((a, b) => a + (Number(b.value) || 0), 0);
    const config = data.reduce((acc, d, i) => {
        acc[d.name] = { label: d.name, color: PALETTE[i % PALETTE.length] };
        return acc;
    }, {} as Record<string, { label: string; color: string }>);

    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-0">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-100">
                        <PieIcon size={15} className="text-indigo-600" />
                    </div>
                    <div>
                        <CardTitle className="text-base">{title}</CardTitle>
                        <CardDescription className="text-xs">{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
                <ChartContainer config={config} className="mx-auto aspect-square max-h-[220px]">
                    <PieChart>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} strokeWidth={3} paddingAngle={2}>
                            {data.map((_, i) => (
                                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                            ))}
                            <Label
                                content={({ viewBox }: any) => {
                                    if (!viewBox || !('cx' in viewBox)) return null;
                                    return (
                                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                            <tspan x={viewBox.cx} y={viewBox.cy - 4} className="fill-foreground text-2xl font-bold">
                                                {highlightFirst ? `${data[0]?.value ?? 0}%` : total}
                                            </tspan>
                                            <tspan x={viewBox.cx} y={viewBox.cy + 16} className="fill-muted-foreground text-[10px]">
                                                {highlightFirst ? (data[0]?.name ?? '') : 'total'}
                                            </tspan>
                                        </text>
                                    );
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                    {data.map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="size-2.5 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
                            <span className="text-foreground/80">{d.name}</span>
                            <span className="tabular-nums font-medium">{d.value}%</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
