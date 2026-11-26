/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Theme & Personalization
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor, Palette, Check, Layout, Wind } from 'lucide-react';

export default function Theme() {
    const [theme, setTheme] = useState('light');
    const [accent, setAccent] = useState('blue');
    const [density, setDensity] = useState('comfortable');

    const themes = [
        { id: 'light', name: 'Enterprise Light', icon: <Sun size={20} />, color: '#fff' },
        { id: 'dark', name: 'Midnight Nebula', icon: <Moon size={20} />, color: '#0f172a' },
        { id: 'system', name: 'System Default', icon: <Monitor size={20} />, color: '#f1f5f9' },
    ];

    const accents = [
        { id: 'blue', color: '#0047BB' },
        { id: 'purple', color: '#6366f1' },
        { id: 'emerald', color: '#10b981' },
        { id: 'orange', color: '#f59e0b' },
    ];

    return (
        <div style={{ flex: 1, overflow: 'auto', padding: 40 }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <div style={{ marginBottom: 48 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--qs-gray-900)', marginBottom: 8 }}>Appearance Settings</h2>
                    <p style={{ fontSize: 15, color: 'var(--qs-gray-500)' }}>Customize the platform interface to match your enterprise branding or personal preference.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                    {/* Theme Mode */}
                    <section>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--qs-gray-400)', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Palette size={16} /> Theme Mode
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                            {themes.map((t) => (
                                <motion.div
                                    key={t.id}
                                    whileHover={{ y: -2 }}
                                    onClick={() => setTheme(t.id)}
                                    className="card card-body"
                                    style={{
                                        cursor: 'pointer',
                                        border: theme === t.id ? '2px solid var(--qs-blue)' : '1px solid var(--qs-gray-100)',
                                        background: t.id === 'dark' ? '#1e293b' : '#fff',
                                        color: t.id === 'dark' ? '#fff' : 'var(--qs-gray-900)',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            {t.icon}
                                            <span style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</span>
                                        </div>
                                        {theme === t.id && <Check size={16} color="var(--qs-blue)" />}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Accent Color */}
                    <section>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--qs-gray-400)', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Layout size={16} /> Global Accent
                        </h3>
                        <div style={{ display: 'flex', gap: 12 }}>
                            {accents.map((a) => (
                                <div
                                    key={a.id}
                                    onClick={() => setAccent(a.id)}
                                    style={{
                                        width: 48, height: 48, borderRadius: 12, background: a.color, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                                        boxShadow: accent === a.id ? `0 0 0 3px #fff, 0 0 0 6px ${a.color}` : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {accent === a.id && <Check size={20} />}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Interface Density */}
                    <section>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--qs-gray-400)', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Wind size={16} /> Information Density
                        </h3>
                        <div className="card" style={{ padding: 4, display: 'inline-flex', background: 'var(--qs-gray-50)', borderRadius: 12 }}>
                            {['Compact', 'Comfortable', 'Spacious'].map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setDensity(d.toLowerCase())}
                                    style={{
                                        padding: '8px 24px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                        background: density === d.toLowerCase() ? '#fff' : 'transparent',
                                        color: density === d.toLowerCase() ? 'var(--qs-gray-900)' : 'var(--qs-gray-400)',
                                        boxShadow: density === d.toLowerCase() ? 'var(--shadow-sm)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </section>

                    <div style={{ borderTop: '1px solid var(--qs-gray-100)', paddingTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button className="btn btn-secondary">Reset to Defaults</button>
                        <button className="btn btn-primary" onClick={() => alert('Theme settings applied globally.')}>Apply Settings</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
