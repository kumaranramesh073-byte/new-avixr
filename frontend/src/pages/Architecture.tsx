/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Architecture Page
   Qsimutron Platform topology and agent orchestration visualization.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Terminal } from 'lucide-react';
import { ARCH_SECTIONS, AGENT_TYPES, DATA_PLATFORMS, STUDIO_TABS } from '../data/constants';

export default function Architecture() {
    const [activeTab, setActiveTab] = useState(0);
    return (
        <div style={{ flex: 1, overflow: 'auto', padding: 40 }}>
            {/* Header Area */}
            <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--qs-gray-900)', marginBottom: 6, letterSpacing: '-0.02em' }}>
                    Qsimutron Integrated Development Studio
                </h2>
                <p style={{ fontSize: 15, color: 'var(--qs-gray-500)' }}>
                    Enterprise AI architecture: Unified data layer, extensible models, and autonomous agent orchestration.
                </p>
            </div>

            {/* Studio Tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 40, border: '1px solid var(--qs-gray-200)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                {STUDIO_TABS.map((s, i) => (
                    <div
                        key={i}
                        onClick={() => setActiveTab(i)}
                        style={{
                            flex: 1, padding: '14px 12px', textAlign: 'center',
                            borderRight: i < STUDIO_TABS.length - 1 ? '1px solid var(--qs-gray-200)' : 'none',
                            fontSize: 13, fontWeight: 600, color: activeTab === i ? 'var(--qs-blue)' : 'var(--qs-gray-700)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            cursor: 'pointer',
                            background: activeTab === i ? 'var(--qs-gray-50)' : 'transparent',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {s}
                    </div>
                ))}
            </div>

            {/* Platform Topology Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 56 }}>
                <AnimatePresence mode="wait">
                    {ARCH_SECTIONS.slice(activeTab * 4, (activeTab + 1) * 4).map((sec, si) => (
                        <motion.div
                            key={`${activeTab}-${si}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: si * 0.05 }}
                            style={{
                                border: '1.5px solid var(--qs-gray-200)',
                                borderRadius: 12,
                                padding: 18,
                                background: '#fff',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Corner Accent */}
                            <div style={{ position: 'absolute', top: 0, left: 0, width: 40, height: 4, background: sec.color }} />

                            <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--qs-gray-400)', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                {sec.title}
                            </h4>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {sec.items.map((item, ii) => (
                                    <span key={ii} style={{
                                        fontSize: 11, padding: '4px 10px', background: 'var(--qs-gray-100)',
                                        borderRadius: 6, color: 'var(--qs-gray-700)', fontWeight: 600
                                    }}>
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Agent Orchestration Topology */}
            <div className="card" style={{ padding: 48, background: 'linear-gradient(135deg, #fff, var(--qs-gray-50))' }}>
                <div style={{ textAlign: 'center', marginBottom: 56 }}>
                    <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--qs-gray-900)', marginBottom: 8 }}>
                        Autonomously Orchestrate Impact
                    </h3>
                    <p style={{ color: 'var(--qs-gray-500)', fontSize: 16 }}>Specialized AI Agent Swarm Architecture</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, position: 'relative' }}>
                    {/* User Entry */}
                    <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--qs-gray-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
                    >
                        <Terminal size={28} color="#fff" />
                    </motion.div>

                    {/* Connection Lines (SVG) */}
                    <div style={{ width: 2, height: 40, background: 'var(--qs-gray-200)' }} />

                    {/* AI Response Hub */}
                    <div style={{ padding: '8px 24px', background: 'var(--qs-blue)', color: '#fff', borderRadius: 40, fontSize: 14, fontWeight: 700, boxShadow: 'var(--shadow-lg)' }}>
                        AI ORCHESTRATION HUB
                    </div>

                    <div style={{ width: 2, height: 40, background: 'var(--qs-gray-200)' }} />

                    {/* Planning Agent */}
                    <div style={{ padding: '16px 32px', border: '2px solid var(--qs-gray-800)', borderRadius: 16, background: '#fff', fontWeight: 700, color: 'var(--qs-gray-900)', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
                        <div style={{ fontSize: 10, color: 'var(--qs-blue)', marginBottom: 4 }}>MASTER CONTROLLER</div>
                        Planning & Orchestration Agent
                    </div>

                    <div style={{ width: 2, height: 32, background: 'var(--qs-gray-200)' }} />

                    {/* Agent Ring */}
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {AGENT_TYPES.map((a, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                style={{
                                    padding: '16px 20px',
                                    border: '1.5px solid var(--qs-gray-300)',
                                    borderRadius: 12,
                                    background: '#fff',
                                    fontSize: 12, fontWeight: 700, color: 'var(--qs-gray-700)',
                                    textAlign: 'center', whiteSpace: 'pre-line',
                                    minWidth: 140, boxShadow: 'var(--shadow-sm)'
                                }}
                            >
                                {a}
                            </motion.div>
                        ))}
                    </div>

                    <div style={{ width: 2, height: 32, background: 'var(--qs-gray-200)' }} />

                    {/* Data Fabric */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {DATA_PLATFORMS.map((plat, i) => (
                            <span key={i} style={{
                                fontSize: 11, padding: '6px 14px', border: '1px solid var(--qs-gray-200)',
                                borderRadius: 8, color: 'var(--qs-gray-600)', fontWeight: 700,
                                background: '#fff', display: 'flex', alignItems: 'center', gap: 6
                            }}>
                                <Server size={12} /> {plat}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
