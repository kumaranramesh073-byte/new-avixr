import { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';

// Read an app CSS custom property at runtime, with a fallback.
function cssVar(name: string, fallback: string): string {
    if (typeof window === 'undefined') return fallback;
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
}

function sanitizeMermaid(raw: string): string {
    let code = raw
        // strip markdown fences
        .replace(/```mermaid\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    // Strip a bare "mermaid" word if LLM put it as the first line without backticks
    code = code.replace(/^mermaid\s*\n/i, '');

    // Fix LLM artifact: -->|label|> Node  →  -->|label| Node
    code = code.replace(/\|([^|]+)\|>/g, '|$1|');

    // Collect class names used via :::className
    const usedClasses = new Set<string>();
    code.replace(/:::(\w+)/g, (_, cls) => { usedClasses.add(cls); return _; });

    // Check if classDef already defined for them
    if (usedClasses.size > 0) {
        const definedClasses = new Set<string>();
        code.replace(/classDef\s+(\w+)/g, (_, cls) => { definedClasses.add(cls); return _; });

        const PRESET: Record<string, string> = {
            danger:  'fill:#fee2e2,stroke:#ef4444,color:#991b1b',
            warn:    'fill:#fef9c3,stroke:#eab308,color:#854d0e',
            warning: 'fill:#fef9c3,stroke:#eab308,color:#854d0e',
            info:    'fill:#dbeafe,stroke:#3b82f6,color:#1e40af',
            success: 'fill:#dcfce7,stroke:#22c55e,color:#166534',
            safe:    'fill:#dcfce7,stroke:#22c55e,color:#166534',
            neutral: 'fill:#f3f4f6,stroke:#d1d5db,color:#374151',
            default: 'fill:#f3f4f6,stroke:#d1d5db,color:#374151',
        };

        const defs: string[] = [];
        for (const cls of usedClasses) {
            if (!definedClasses.has(cls)) {
                const style = PRESET[cls] ?? PRESET.default;
                defs.push(`classDef ${cls} ${style}`);
            }
        }

        if (defs.length > 0) {
            code = code + '\n' + defs.join('\n');
        }
    }

    return code;
}

interface MermaidRendererProps {
    chart: string;
    className?: string;
}

export default function MermaidRenderer({ chart, className }: MermaidRendererProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const uid = useId().replace(/:/g, '_');
    const diagramId = `mermaid_${uid}`;
    const [error, setError] = useState<string | null>(null);
    const [svgContent, setSvgContent] = useState<string | null>(null);

    useEffect(() => {
        if (!chart?.trim()) return;

        let cancelled = false;
        setError(null);
        setSvgContent(null);

        (async () => {
            try {
                const indigoBright = cssVar('--qs-indigo-bright', '#6366f1');
                const indigoLight  = cssVar('--qs-indigo-light',  '#eef2ff');
                const indigoBorder = cssVar('--qs-indigo-border', '#c7d2fe');
                const ink          = cssVar('--qs-gray-900',      '#111827');
                const font         = cssVar('--font-primary',
                    "'IBM Plex Sans', -apple-system, sans-serif");

                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'base',
                    themeVariables: {
                        background: '#ffffff',
                        primaryColor: indigoLight,
                        primaryTextColor: ink,
                        primaryBorderColor: indigoBorder,
                        lineColor: indigoBright,
                        secondaryColor: '#f9fafb',
                        tertiaryColor: '#f3f4f6',
                        edgeLabelBackground: '#ffffff',
                        fontFamily: font,
                        fontSize: '13px',
                    },
                    flowchart: { curve: 'basis', htmlLabels: true, padding: 20 },
                    securityLevel: 'loose',
                });

                const cleanChart = sanitizeMermaid(chart);

                // Render into a detached element to avoid DOM conflicts with React
                const { svg } = await mermaid.render(diagramId, cleanChart);
                if (!cancelled) {
                    setSvgContent(svg);
                }
            } catch (err: any) {
                if (!cancelled) {
                    console.warn('[MermaidRenderer] Render error:', err?.message);
                    setError(err?.message ?? 'Invalid Mermaid syntax');
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [chart, diagramId]);

    // Apply responsive styles to the SVG after it's injected
    useEffect(() => {
        if (!svgContent || !wrapperRef.current) return;
        const svgEl = wrapperRef.current.querySelector('svg');
        if (svgEl) {
            svgEl.style.width = '100%';
            svgEl.style.height = 'auto';
            svgEl.style.maxWidth = '100%';
            svgEl.removeAttribute('width');
            svgEl.removeAttribute('height');
        }
    }, [svgContent]);

    if (error) {
        return (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Diagram Render Error
                </div>
                <pre style={{ margin: 0, fontSize: 11, color: '#6b7280', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {chart}
                </pre>
            </div>
        );
    }

    if (!svgContent) {
        return (
            <div style={{ minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>Rendering diagram...</div>
            </div>
        );
    }

    return (
        <div
            ref={wrapperRef}
            className={className}
            style={{ width: '100%' }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
        />
    );
}
