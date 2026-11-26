import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layout, Globe, ShieldCheck, ShoppingBag,
    ArrowRight, X, Star, Download, Box,
    FileText, Users, Activity, Settings, ExternalLink
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { SUITES } from '../data/constants';

interface AppDetail {
    name: string;
    description: string;
    version: string;
    status: string;
    category: string;
}

export default function Manage() {
    const [showMarketplace, setShowMarketplace] = useState(false);
    const [selectedSuite, setSelectedSuite] = useState<(typeof SUITES)[0] | null>(null);
    const [selectedApp, setSelectedApp] = useState<AppDetail | null>(null);
    const addToast = useToastStore((state) => state.addToast);

    const marketplaceApps = [
        { name: 'Supply Chain Twin', desc: 'Real-time digital twin of global supply network', cat: 'Supply Chain', stars: 4.8 },
        { name: 'Anti-Money Laundering v5', desc: 'Next-gen AML with GNN analysis', cat: 'Finance', stars: 4.9 },
        { name: 'Asset Health Monitor', desc: 'Advanced vibration and thermal analysis', cat: 'AIPM', stars: 4.7 },
        { name: 'ESG Scorecard', desc: 'Automated ESG data collection and reporting', cat: 'Sustainability', stars: 4.6 },
    ];

    return (
        <div style={{ flex: 1, overflow: 'auto', padding: 40 }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
                <div>
                    <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--qs-gray-900)', marginBottom: 8, letterSpacing: '-0.02em' }}>
                        Enterprise Application Suites
                    </h2>
                    <p style={{ fontSize: 15, color: 'var(--qs-gray-500)', maxWidth: 700 }}>
                        Configure and deploy pre-built industry application suites. Each suite includes cross-referenced data models and specialized AI agents.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-secondary" style={{ gap: 8 }} onClick={() => setShowMarketplace(true)}>
                        <ShoppingBag size={16} /> App Marketplace
                    </button>
                    <button className="btn btn-primary" onClick={() => addToast('Global settings updated', 'success')}>
                        Global Settings
                    </button>
                </div>
            </div>

            {/* Hero Features */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 56 }}>
                {[
                    { title: 'Global Orchestration', desc: 'Centralized management of agent swarms.', icon: <Globe size={24} /> },
                    { title: 'Industry Templates', desc: '15+ pre-built sectoral frameworks.', icon: <Layout size={24} /> },
                    { title: 'Critical Controls', desc: 'Enterprise-grade security and audit trails.', icon: <ShieldCheck size={24} /> },
                ].map((f, i) => (
                    <div key={i} className="card card-body" style={{ padding: 24 }}>
                        <div style={{ color: 'var(--qs-blue)', marginBottom: 16 }}>{f.icon}</div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                        <p style={{ fontSize: 14, color: 'var(--qs-gray-500)' }}>{f.desc}</p>
                    </div>
                ))}
            </div>

            {/* Industry Suites Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
                {SUITES.map((suite, si) => (
                    <motion.div
                        key={si}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: si * 0.1 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 8,
                                    background: suite.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#111827'
                                }}>
                                    {(() => {
                                        const IconComponent = Icons[suite.icon as keyof typeof Icons] as React.ElementType || Icons.Zap;
                                        return <IconComponent size={20} />;
                                    })()}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--qs-gray-800)', margin: 0 }}>{suite.name}</h3>
                                    <div style={{ fontSize: 13, color: 'var(--qs-gray-400)' }}>{suite.apps.length} Integrated Applications</div>
                                </div>
                            </div>
                            <button className="btn btn-ghost" style={{ gap: 8 }} onClick={() => setSelectedSuite(suite)}>
                                Suite Details <ArrowRight size={14} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                            {suite.apps.map((app, ai) => (
                                <motion.div
                                    key={ai}
                                    className="card card-body"
                                    whileHover={{ scale: 1.02, borderColor: suite.color }}
                                    onClick={() => setSelectedApp({
                                        name: app,
                                        description: `This application provides specialized AI capabilities for ${suite.name}. It leverages the enterprise data fabric to provide real-time insights and autonomous optimizations.`,
                                        version: 'v2.4.1',
                                        status: 'Deployed',
                                        category: suite.name
                                    })}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 12,
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--qs-gray-400)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            Qsimutron App
                                        </span>
                                    </div>

                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--qs-gray-900)', margin: 0, zIndex: 1 }}>
                                        {app}
                                    </h4>

                                    <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                                        <span className="badge badge-default" style={{ fontSize: 9 }}>v2.4</span>
                                        <span className="badge badge-success" style={{ fontSize: 9 }}>Active</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        {si < SUITES.length - 1 && <div style={{ borderBottom: '1px solid var(--qs-gray-100)', marginTop: 40 }} />}
                    </motion.div>
                ))}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showMarketplace && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="card"
                            style={{ width: '90%', maxWidth: 900, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                        >
                            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--qs-gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <ShoppingBag size={24} color="var(--qs-blue)" />
                                    <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Qsimutron Marketplace</h3>
                                </div>
                                <button onClick={() => setShowMarketplace(false)} className="btn-ghost" aria-label="Close"><X size={24} /></button>
                            </div>

                            <div style={{ flex: 1, padding: 32, overflow: 'auto', background: 'var(--qs-gray-50)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                                    {marketplaceApps.map((app, i) => (
                                        <div key={i} className="card card-body" style={{ display: 'flex', gap: 16 }}>
                                            <div style={{ width: 64, height: 64, borderRadius: 12, background: 'var(--qs-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Box size={32} color="var(--qs-blue)" />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{app.name}</h4>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--qs-yellow-dark)' }}>
                                                        <Star size={12} fill="currentColor" /> {app.stars}
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: 13, color: 'var(--qs-gray-500)', marginBottom: 16 }}>{app.desc}</p>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span className="badge badge-default" style={{ fontSize: 10 }}>{app.cat}</span>
                                                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12, gap: 6 }} onClick={() => addToast(`${app.name} deployment initiated`, 'success')}>
                                                        <Download size={14} /> Deploy
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {selectedSuite && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="card"
                            style={{ width: '100%', maxWidth: 700, padding: 0, overflow: 'hidden' }}
                        >
                            <div style={{ height: 120, background: selectedSuite.color, position: 'relative' }}>
                                <button
                                    onClick={() => setSelectedSuite(null)}
                                    style={{ position: 'absolute', right: 20, top: 20, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#111827', padding: 8, borderRadius: 100, cursor: 'pointer' }}
                                >
                                    <X size={20} />
                                </button>
                                <div style={{ position: 'absolute', left: 32, bottom: -24, width: 80, height: 80, borderRadius: 20, background: '#fff', boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                                    {(() => {
                                        const IconComponent = Icons[selectedSuite.icon as keyof typeof Icons] as React.ElementType || Icons.Zap;
                                        return <IconComponent size={40} color={selectedSuite.color} />;
                                    })()}
                                </div>
                            </div>

                            <div style={{ padding: '48px 32px 32px' }}>
                                <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{selectedSuite.name}</h3>
                                <p style={{ color: 'var(--qs-gray-500)', fontSize: 15, marginBottom: 32 }}>{selectedSuite.description}</p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    <div>
                                        <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--qs-gray-400)', marginBottom: 16 }}>Included Assets</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                                                <FileText size={16} color="var(--qs-blue)" /> Unified Data Models
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                                                <Users size={16} color="var(--qs-green)" /> Specialized Agent Personas
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                                                <Activity size={16} color="var(--qs-red)" /> Performance Dashboards
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--qs-gray-50)', padding: 20, borderRadius: 16 }}>
                                        <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--qs-gray-400)', marginBottom: 12 }}>Security Status</h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--qs-green-dark)', fontWeight: 600, fontSize: 14 }}>
                                            <ShieldCheck size={18} /> SOC2 Compliant
                                        </div>
                                        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--qs-gray-500)' }}>
                                            All applications in this suite follow the Qsimutron Zero-Trust data governance policies.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '20px 32px', borderTop: '1px solid var(--qs-gray-100)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                <button onClick={() => setSelectedSuite(null)} className="btn btn-secondary">Close</button>
                                <button className="btn btn-primary" style={{ gap: 8 }} onClick={() => addToast(`Configuration updated for ${selectedSuite.name}`, 'success')}><Settings size={16} /> Suite Configuration</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {selectedApp && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="card"
                            style={{ width: '100%', maxWidth: 500, padding: 32 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--qs-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--qs-blue)' }}>
                                    <Box size={24} />
                                </div>
                                <button onClick={() => setSelectedApp(null)} className="btn-ghost" aria-label="Close"><X size={24} /></button>
                            </div>

                            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{selectedApp.name}</h3>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                                <span className="badge badge-info">{selectedApp.category}</span>
                                <span className="badge badge-default">{selectedApp.version}</span>
                            </div>

                            <p style={{ fontSize: 14, color: 'var(--qs-gray-600)', lineHeight: 1.6, marginBottom: 32 }}>
                                {selectedApp.description}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '10px 0', borderBottom: '1px solid var(--qs-gray-100)' }}>
                                    <span style={{ color: 'var(--qs-gray-400)' }}>Status</span>
                                    <span style={{ fontWeight: 600, color: 'var(--qs-green)' }}>{selectedApp.status}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '10px 0', borderBottom: '1px solid var(--qs-gray-100)' }}>
                                    <span style={{ color: 'var(--qs-gray-400)' }}>Last Updated</span>
                                    <span style={{ fontWeight: 600 }}>2 hours ago</span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <button className="btn btn-secondary" style={{ gap: 8 }}><ExternalLink size={14} /> Open App</button>
                                <button className="btn btn-primary" style={{ gap: 8 }} onClick={() => addToast(`${selectedApp.name} settings updated`, 'info')}><Settings size={14} /> Manage</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
