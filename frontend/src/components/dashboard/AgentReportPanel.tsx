/* ═══════════════════════════════════════════════════════════════════════════
   Qsimutron — AgentReportPanel
   Reusable component that displays live agent output with markdown rendering.
   Used across all sub-agent dashboards.
   ═══════════════════════════════════════════════════════════════════════════ */

import ReactMarkdown from 'react-markdown';
import { Loader2, RefreshCw, AlertTriangle, Sparkles, Download } from 'lucide-react';
import '../../styles/agent-dashboard.css';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useRef } from 'react';

interface AgentReportPanelProps {
    title: string;
    loading: boolean;
    error: string | null;
    output: string | null;
    timestamp: string | null;
    onRerun: () => void;
}

export default function AgentReportPanel({ title, loading, error, output, timestamp, onRerun }: AgentReportPanelProps) {
    const reportRef = useRef<HTMLDivElement>(null);

    const downloadPDF = async () => {
        if (!reportRef.current) return;

        const canvas = await html2canvas(reportRef.current, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Qsimutron_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    return (
        <div className="dash-panel" style={{ margin: '0 28px 24px' }}>
            <div className="dash-panel-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={14} color="var(--qs-blue)" />
                    {title}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {timestamp && (
                        <span style={{ fontSize: 11, color: 'var(--qs-gray-400)' }}>
                            Generated: {new Date(timestamp).toLocaleString()}
                        </span>
                    )}
                    <button
                        className="dash-btn dash-btn-outline"
                        onClick={downloadPDF}
                        disabled={loading || !output}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        <Download size={12} />
                        Download
                    </button>
                    <button
                        className="dash-btn dash-btn-outline"
                        onClick={onRerun}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Running...' : 'Re-generate'}
                    </button>
                </div>
            </div>

            <div style={{ padding: 20, minHeight: 120 }}>
                {loading && (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 10, padding: 40, color: 'var(--qs-gray-400)',
                    }}>
                        <Loader2 size={20} className="animate-spin" />
                        <span style={{ fontSize: 13 }}>Agent is generating intelligence report...</span>
                    </div>
                )}

                {error && (
                    <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10, padding: 16,
                        background: 'rgba(251,113,133,0.10)', borderRadius: 12, border: '1px solid rgba(251,113,133,0.30)',
                    }}>
                        <AlertTriangle size={16} color="#FB7185" style={{ marginTop: 2 }} />
                        <div>
                            <div style={{ fontWeight: 700, color: '#FB7185', marginBottom: 4 }}>Agent Error</div>
                            <div style={{ fontSize: 12, color: 'var(--qs-gray-500)' }}>{error}</div>
                        </div>
                    </div>
                )}

                {output && !loading && (
                    <div className="agent-report-content" ref={reportRef}>
                        <ReactMarkdown
                            components={{
                                h1: ({ children }) => <h1 style={{ fontSize: 18, fontWeight: 800, margin: '16px 0 10px', color: 'var(--qs-gray-900)' }}>{children}</h1>,
                                h2: ({ children }) => <h2 style={{ fontSize: 15, fontWeight: 700, margin: '14px 0 8px', color: 'var(--qs-gray-800)', borderBottom: '1px solid var(--qs-gray-100)', paddingBottom: 6 }}>{children}</h2>,
                                h3: ({ children }) => <h3 style={{ fontSize: 13, fontWeight: 700, margin: '12px 0 6px', color: 'var(--qs-gray-700)' }}>{children}</h3>,
                                p: ({ children }) => <p style={{ margin: '8px 0', fontSize: 13, lineHeight: 1.7, color: 'var(--qs-gray-700)' }}>{children}</p>,
                                strong: ({ children }) => <strong style={{ fontWeight: 700, color: 'var(--qs-gray-900)' }}>{children}</strong>,
                                ul: ({ children }) => <ul style={{ margin: '6px 0', paddingLeft: 20 }}>{children}</ul>,
                                ol: ({ children }) => <ol style={{ margin: '6px 0', paddingLeft: 20 }}>{children}</ol>,
                                li: ({ children }) => <li style={{ margin: '3px 0', fontSize: 13, lineHeight: 1.6, color: 'var(--qs-gray-700)' }}>{children}</li>,
                                table: ({ children }) => <table className="dash-table" style={{ margin: '10px 0' }}>{children}</table>,
                                thead: ({ children }) => <thead>{children}</thead>,
                                tbody: ({ children }) => <tbody>{children}</tbody>,
                                tr: ({ children }) => <tr>{children}</tr>,
                                th: ({ children }) => <th>{children}</th>,
                                td: ({ children }) => <td>{children}</td>,
                                code: ({ children, className }) => {
                                    const isBlock = className?.includes('language-');
                                    if (isBlock) {
                                        return (
                                            <pre style={{ background: 'var(--qs-gray-50)', padding: 14, borderRadius: 6, overflowX: 'auto', fontSize: 12, margin: '8px 0', border: '1px solid var(--qs-gray-100)' }}>
                                                <code>{children}</code>
                                            </pre>
                                        );
                                    }
                                    return <code style={{ background: 'var(--qs-gray-100)', padding: '2px 6px', borderRadius: 4, fontSize: 12, color: '#c2410c' }}>{children}</code>;
                                },
                                blockquote: ({ children }) => (
                                    <blockquote style={{ borderLeft: '3px solid var(--qs-blue)', paddingLeft: 14, margin: '8px 0', color: 'var(--qs-gray-600)' }}>
                                        {children}
                                    </blockquote>
                                ),
                                hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--qs-gray-100)', margin: '16px 0' }} />,
                            }}
                        >
                            {output}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}
