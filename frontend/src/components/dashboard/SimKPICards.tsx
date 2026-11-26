import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface SimData {
    market_score: number;
    competitor_threat: number;
    volatility_index: number;
    bloomberg_output: { market_velocity: number };
    vanguard_output: { stability_score: number };
}

export function SimKPICards({ data }: { data: SimData }) {
    const cards = [
        {
            label: 'Market Score',
            value: data.market_score,
            unit: '/100',
            trend: data.market_score >= 50 ? 'up' : 'down',
            delta: data.market_score >= 50 ? `+${data.market_score - 50}pts` : `${data.market_score - 50}pts`,
            footer: data.market_score >= 60 ? 'Healthy market position' : data.market_score >= 40 ? 'Moderate market pressure' : 'Critical market risk',
            sub: 'Composite OCT signal',
        },
        {
            label: 'Competitor Threat',
            value: data.competitor_threat,
            unit: '/100',
            trend: data.competitor_threat >= 60 ? 'down' : 'up',
            delta: data.competitor_threat >= 60 ? `High ${data.competitor_threat}%` : `Low ${data.competitor_threat}%`,
            footer: data.competitor_threat >= 70 ? 'Immediate threat response needed' : data.competitor_threat >= 50 ? 'Elevated competitive pressure' : 'Manageable threat level',
            sub: 'Bloomberg + BlackRock RPN',
        },
        {
            label: 'Volatility Index',
            value: data.volatility_index,
            unit: '/100',
            trend: data.volatility_index >= 60 ? 'down' : 'up',
            delta: `${data.volatility_index >= 60 ? 'High' : 'Low'} ${data.volatility_index}`,
            footer: data.volatility_index >= 70 ? 'High market turbulence' : data.volatility_index >= 40 ? 'Moderate volatility' : 'Stable conditions',
            sub: 'Bloomberg velocity signal',
        },
        {
            label: 'Stability Score',
            value: data.vanguard_output.stability_score,
            unit: '/100',
            trend: data.vanguard_output.stability_score >= 50 ? 'up' : 'down',
            delta: data.vanguard_output.stability_score >= 50 ? `+${data.vanguard_output.stability_score - 50}pts` : `${data.vanguard_output.stability_score - 50}pts`,
            footer: data.vanguard_output.stability_score >= 60 ? 'Strong long-term outlook' : 'Stability enhancement required',
            sub: 'Vanguard framework',
        },
    ];

    return (
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
            {cards.map((c) => (
                <Card key={c.label} className="@container/card">
                    <CardHeader>
                        <CardDescription>{c.label}</CardDescription>
                        <CardTitle className="text-3xl font-bold tabular-nums">
                            {c.value}<span className="text-base font-normal text-muted-foreground">{c.unit}</span>
                        </CardTitle>
                        <CardAction>
                            <Badge variant="outline" className={`gap-1 ${c.trend === 'up' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-red-500 border-red-200 bg-red-50'}`}>
                                {c.trend === 'up' ? <IconTrendingUp className="size-3" /> : <IconTrendingDown className="size-3" />}
                                {c.delta}
                            </Badge>
                        </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1 text-sm">
                        <div className="flex gap-2 font-medium leading-none">
                            {c.footer} {c.trend === 'up' ? <IconTrendingUp className="size-4 text-emerald-500" /> : <IconTrendingDown className="size-4 text-red-400" />}
                        </div>
                        <div className="text-muted-foreground text-xs">{c.sub}</div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
