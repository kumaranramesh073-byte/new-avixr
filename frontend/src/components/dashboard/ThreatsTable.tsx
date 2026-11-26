import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Threat {
    signal: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    timestamp: string;
}

const SEVERITY_CONFIG: Record<string, { label: string; class: string }> = {
    critical: { label: 'Critical', class: 'bg-red-100 text-red-700 border-red-200' },
    high:     { label: 'High',     class: 'bg-orange-100 text-orange-700 border-orange-200' },
    medium:   { label: 'Medium',   class: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    low:      { label: 'Low',      class: 'bg-green-100 text-green-700 border-green-200' },
};

export function ThreatsTable({ threats, headline, velocity }: { threats: Threat[]; headline: string; velocity: number }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100">
                        <span className="text-sm">📡</span>
                    </div>
                    <div>
                        <CardTitle className="text-base">Bloomberg Intelligence</CardTitle>
                        <CardDescription className="text-xs">Market velocity: <span className="font-semibold text-orange-600">{velocity}/100</span></CardDescription>
                    </div>
                </div>
                <blockquote className="mt-2 rounded-lg border-l-4 border-orange-200 bg-orange-50 px-4 py-2 text-xs text-orange-800 italic leading-relaxed">
                    "{headline}"
                </blockquote>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="pl-6 text-xs">Signal</TableHead>
                            <TableHead className="text-xs">Severity</TableHead>
                            <TableHead className="pr-6 text-xs text-right">Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {threats.map((t, i) => {
                            const cfg = SEVERITY_CONFIG[t.severity] ?? SEVERITY_CONFIG.low;
                            return (
                                <TableRow key={i}>
                                    <TableCell className="pl-6 py-3 text-xs font-medium max-w-[220px]">
                                        {t.signal}
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 ${cfg.class}`}>
                                            {cfg.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="pr-6 py-3 text-xs text-muted-foreground text-right whitespace-nowrap">
                                        {t.timestamp}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
