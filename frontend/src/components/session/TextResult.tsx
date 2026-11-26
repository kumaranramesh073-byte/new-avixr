/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — TextResult
   Renders agent output text with full markdown support.
   Handles bold, tables, lists, headers, and structured agent output.
   ═══════════════════════════════════════════════════════════════════════════ */

import ReactMarkdown from 'react-markdown';
import MermaidRenderer from '../shared/MermaidRenderer';
import type { TextContentData } from '../../types';

interface TextResultProps {
    content: TextContentData;
}

export default function TextResult({ content }: TextResultProps) {
    if (!content?.summary) return null;

    return (
        <div className="markdown-output" style={{ fontSize: 13.5, color: 'var(--qs-gray-700)', lineHeight: 1.75 }}>
            <ReactMarkdown
                components={{
                    h1: ({ children }) => (
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--qs-gray-900)', margin: '16px 0 8px', borderBottom: '1px solid var(--qs-gray-100)', paddingBottom: 8 }}>
                            {children}
                        </h3>
                    ),
                    h2: ({ children }) => (
                        <h4 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--qs-gray-900)', margin: '14px 0 6px' }}>
                            {children}
                        </h4>
                    ),
                    h3: ({ children }) => (
                        <h5 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--qs-gray-800)', margin: '12px 0 4px' }}>
                            {children}
                        </h5>
                    ),
                    strong: ({ children }) => (
                        <strong style={{ fontWeight: 700, color: 'var(--qs-gray-900)' }}>{children}</strong>
                    ),
                    em: ({ children }) => (
                        <em style={{ fontStyle: 'italic', color: 'var(--qs-gray-600)' }}>{children}</em>
                    ),
                    p: ({ children }) => (
                        <p style={{ marginBottom: 10, lineHeight: 1.75 }}>{children}</p>
                    ),
                    ul: ({ children }) => (
                        <ul style={{ paddingLeft: 20, marginBottom: 10, listStyleType: 'disc' }}>{children}</ul>
                    ),
                    ol: ({ children }) => (
                        <ol style={{ paddingLeft: 20, marginBottom: 10, listStyleType: 'decimal' }}>{children}</ol>
                    ),
                    li: ({ children }) => (
                        <li style={{ marginBottom: 4 }}>{children}</li>
                    ),
                    table: ({ children }) => (
                        <div style={{ overflow: 'auto', marginBottom: 12, borderRadius: 8, border: '1px solid var(--qs-gray-200)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead style={{ background: 'var(--qs-gray-50)' }}>{children}</thead>
                    ),
                    th: ({ children }) => (
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: 'var(--qs-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--qs-gray-200)' }}>
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--qs-gray-100)', color: 'var(--qs-gray-700)' }}>
                            {children}
                        </td>
                    ),
                    code: ({ className, children }) => {
                        if (className === 'language-mermaid') {
                            return <MermaidRenderer chart={String(children).trim()} />;
                        }
                        return (
                            <code style={{ background: 'var(--qs-gray-50)', padding: '2px 6px', borderRadius: 4, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                                {children}
                            </code>
                        );
                    },
                    pre: ({ children }) => (
                        <pre style={{ background: 'var(--qs-gray-50)', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 12, marginBottom: 12, border: '1px solid var(--qs-gray-200)' }}>
                            {children}
                        </pre>
                    ),
                    hr: () => (
                        <hr style={{ border: 'none', borderTop: '1px solid var(--qs-gray-200)', margin: '14px 0' }} />
                    ),
                    blockquote: ({ children }) => (
                        <blockquote style={{ borderLeft: '3px solid var(--qs-blue)', paddingLeft: 16, margin: '10px 0', color: 'var(--qs-gray-600)', fontStyle: 'italic' }}>
                            {children}
                        </blockquote>
                    ),
                }}
            >
                {content.summary}
            </ReactMarkdown>
        </div>
    );
}
