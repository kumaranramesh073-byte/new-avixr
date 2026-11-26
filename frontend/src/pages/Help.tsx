/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Help & Documentation
   ═══════════════════════════════════════════════════════════════════════════ */

import { motion } from 'framer-motion';
import { Book, MessageSquare, Terminal, Shield, Search, ChevronRight } from 'lucide-react';

export default function Help() {
    const categories = [
        { title: 'Getting Started', icon: <Book size={24} />, docs: 12 },
        { title: 'API Reference', icon: <Terminal size={24} />, docs: 45 },
        { title: 'Security & Governance', icon: <Shield size={24} />, docs: 8 },
        { title: 'Data Integrations', icon: <Search size={24} />, docs: 21 },
    ];

    const faqs = [
        { q: 'How do I generate an enterprise API key?', a: 'Navigate to the TopBar user menu, select "API Keys", and click "Generate New Key".' },
        { q: 'What AI models are available by default?', a: 'Qsimutron provides access to GPT-4o, Claude 3.5 Sonnet, and local Llama 3 instances.' },
        { q: 'Can I export my ML drift reports?', a: 'Yes, go to the Models page, open any model drift monitor, and select "Export Report".' },
    ];

    return (
        <div style={{ flex: 1, overflow: 'auto', padding: 40, background: 'var(--qs-gray-50)' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 64 }}>
                    <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--qs-gray-900)', marginBottom: 16 }}>Documentation & Support</h2>
                    <p style={{ fontSize: 16, color: 'var(--qs-gray-500)', maxWidth: 600, margin: '0 auto' }}>
                        Everything you need to build, deploy, and manage enterprise-grade GenAI applications on the Qsimutron platform.
                    </p>
                </div>

                {/* Categories */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 56 }}>
                    {categories.map((cat, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -4 }}
                            className="card card-body"
                            style={{ textAlign: 'center', cursor: 'pointer' }}
                        >
                            <div style={{ color: 'var(--qs-blue)', margin: '0 auto 16px' }}>{cat.icon}</div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{cat.title}</h3>
                            <div style={{ fontSize: 12, color: 'var(--qs-gray-400)' }}>{cat.docs} Documents</div>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 40 }}>
                    <div>
                        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                            Frequently Asked Questions
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {faqs.map((f, i) => (
                                <div key={i} className="card card-body" style={{ padding: 24 }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--qs-gray-900)' }}>{f.q}</div>
                                    <p style={{ fontSize: 14, color: 'var(--qs-gray-500)', lineHeight: 1.6 }}>{f.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Direct Support</h3>
                        <div className="card card-body" style={{ background: 'var(--qs-blue)', color: '#fff', padding: 24 }}>
                            <MessageSquare size={32} style={{ marginBottom: 16 }} />
                            <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Enterprise Support</h4>
                            <p style={{ fontSize: 13, opacity: 0.9, marginBottom: 24, lineHeight: 1.5 }}>
                                Our dedicated AI engineers are available 24/7 to help with complex orchestration and deployment patterns.
                            </p>
                            <button className="btn btn-primary" style={{ background: '#fff', color: 'var(--qs-blue)', border: 'none', width: '100%' }}>
                                Open Support Ticket
                            </button>
                        </div>

                        <div style={{ marginTop: 32 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--qs-gray-400)', textTransform: 'uppercase', marginBottom: 16 }}>Useful Links</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {['Status Dashboard', 'Release Notes', 'Privacy Center', 'Developer Forum'].map((l, i) => (
                                    <a key={i} href="#" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', color: 'var(--qs-gray-700)', fontSize: 14 }}>
                                        {l} <ChevronRight size={14} color="var(--qs-gray-300)" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
