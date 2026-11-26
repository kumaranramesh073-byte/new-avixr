import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ModuleDashboard } from '../../components/module/ModuleDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitMerge } from 'lucide-react';

function DigitalTwinCharts(charts: Record<string, any>) {
    const resourceUtilization = charts.resource_utilization || [];
    const bottleneckImpact = charts.bottleneck_impact || [];

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Resource Utilization vs Capacity</CardTitle>
                    <CardDescription className="text-xs">Department-level operational load</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={resourceUtilization} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="department" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}
                                />
                                <Bar dataKey="load" name="Current Load" radius={[4, 4, 0, 0]} barSize={25}>
                                    {resourceUtilization.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.load > 90 ? '#ef4444' : entry.load > 75 ? '#f59e0b' : 'hsl(var(--primary))'} />
                                    ))}
                                </Bar>
                                <Bar dataKey="capacity" name="Total Capacity" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={25} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Bottleneck Impact Matrix</CardTitle>
                    <CardDescription className="text-xs">Process delays mapped to financial cost</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bottleneckImpact} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="process" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}
                                />
                                <Bar dataKey="delay_hours" name="Delay (Hours)" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={12} />
                                <Bar dataKey="cost_impact" name="Cost Impact ($)" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function DigitalTwin() {
    return (
        <ModuleDashboard
            moduleKey="twin"
            title="Digital Twin"
            subtitle="Operational throughput & constraint modeling"
            icon={GitMerge}
            accent="bg-cyan-100 text-cyan-600"
            extraCharts={DigitalTwinCharts}
        />
    );
}
