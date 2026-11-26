import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ModuleDashboard } from '../../components/module/ModuleDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartPulse } from 'lucide-react';

function CustomerSentimentCharts(charts: Record<string, any>) {
    const sentimentTrend = charts.sentiment_trend || [];
    const feedbackDrivers = charts.feedback_drivers || [];

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Sentiment Composition Trend</CardTitle>
                    <CardDescription className="text-xs">Positive vs Neutral vs Negative over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sentimentTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}
                                />
                                <Area type="monotone" dataKey="positive" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.5} name="Positive" />
                                <Area type="monotone" dataKey="neutral" stackId="1" stroke="#cbd5e1" fill="#cbd5e1" fillOpacity={0.5} name="Neutral" />
                                <Area type="monotone" dataKey="negative" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} name="Negative" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Key Feedback Drivers</CardTitle>
                    <CardDescription className="text-xs">Satisfaction Score vs Mention Volume</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={feedbackDrivers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="theme" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}
                                />
                                <Bar dataKey="score" name="Satisfaction Score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={12} />
                                <Bar dataKey="volume" name="Mention Volume" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function CustomerSentiment() {
    return (
        <ModuleDashboard
            moduleKey="sentiment"
            title="Customer Sentiment"
            subtitle="CX monitoring & churn prediction"
            icon={HeartPulse}
            accent="bg-pink-100 text-pink-600"
            extraCharts={CustomerSentimentCharts}
        />
    );
}
