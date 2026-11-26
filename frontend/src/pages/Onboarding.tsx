/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON — Minimal Business DNA Onboarding (3 Essential Sections)
   A → Company & Industry   B → Team Size   C → Strategic Goals
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Zap, Check } from 'lucide-react';
import { useAuthStore, type BusinessDNA } from '../store/authStore';

// ─── Section definitions ──────────────────────────────────────────────────────

const INDUSTRIES = ['SaaS', 'Retail', 'Manufacturing', 'Healthcare', 'Logistics', 'Finance', 'E-Commerce', 'Education', 'Government', 'Energy'];

const TEAM_OPTIONS = ['1–10', '10–50', '50–500', '500–5000', '5000+'];

const GOALS = ['Revenue Growth', 'Expansion Strategy', 'Cost Reduction', 'Customer Retention', 'Hiring Optimization', 'Supply Chain', 'Market Prediction', 'Risk Reduction'];

// ─── Reusable sub-components ──────────────────────────────────────────────────

function ChipSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {options.map(o => {
                const selected = value === o;
                return (
                    <button key={o} onClick={() => onChange(o)} type="button" style={{
                        padding: '9px 16px', borderRadius: 20,
                        background: selected ? 'rgba(99,102,241,0.1)' : '#ffffff',
                        border: selected ? '1.5px solid #6366f1' : '1.5px solid #e5e7eb',
                        color: selected ? '#4f46e5' : '#374151',
                        cursor: 'pointer', fontSize: 13, fontWeight: selected ? 600 : 400,
                        fontFamily: 'inherit', transition: 'all 0.18s',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        {selected && <Check size={11} color="#4f46e5" />}
                        {o}
                    </button>
                );
            })}
        </div>
    );
}

function MultiChipSelect({ options, values, onChange }: { options: string[]; values: string[]; onChange: (v: string[]) => void }) {
    const toggle = (o: string) => onChange(values.includes(o) ? values.filter(v => v !== o) : [...values, o]);
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {options.map(o => {
                const selected = values.includes(o);
                return (
                    <button key={o} onClick={() => toggle(o)} type="button" style={{
                        padding: '9px 16px', borderRadius: 20,
                        background: selected ? 'rgba(99,102,241,0.1)' : '#ffffff',
                        border: selected ? '1.5px solid #6366f1' : '1.5px solid #e5e7eb',
                        color: selected ? '#4f46e5' : '#374151',
                        cursor: 'pointer', fontSize: 13, fontWeight: selected ? 600 : 400,
                        fontFamily: 'inherit', transition: 'all 0.18s',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        {selected && <Check size={11} color="#4f46e5" />}
                        {o}
                    </button>
                );
            })}
        </div>
    );
}

const SECTIONS = [
    { id: 'A', title: 'Company & Industry', subtitle: 'Essential company identity, website, description, and sector' },
    { id: 'B', title: 'Team Size', subtitle: 'Organization scale for AI agent calibration' },
    { id: 'C', title: 'Business Goals', subtitle: 'What should Q-Simutron optimize for?' },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function Onboarding() {
    const navigate = useNavigate();
    const { completeOnboarding, user } = useAuthStore();
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Essential Business DNA fields
    const [companyName, setCompanyName] = useState('');
    const [companyWebsite, setCompanyWebsite] = useState('');
    const [companyDescription, setCompanyDescription] = useState('');
    const [industry, setIndustry] = useState('');
    const [teamSize, setTeamSize] = useState('');
    const [goals, setGoals] = useState<string[]>([]);

    const canAdvance = [
        !!industry && !!companyName.trim(),
        !!teamSize,
        goals.length > 0,
    ][step];

    const isLast = step === SECTIONS.length - 1;

    const handleNext = () => {
        if (!canAdvance && !isLast) return;
        if (isLast) handleSubmit();
        else setStep(s => s + 1);
    };

    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        const dna: BusinessDNA = {
            companyName: companyName.trim(),
            companyWebsite: companyWebsite.trim(),
            companyDescription: companyDescription.trim(),
            industry,
            teamSize,
            goals,
        };
        try {
            await completeOnboarding(dna);
            navigate('/morning');
        } catch (err: any) {
            setSubmitError(err?.message || 'Failed to save Business DNA to server');
            setIsSubmitting(false);
        }
    };

    const progress = ((step + 1) / SECTIONS.length) * 100;
    const current = SECTIONS[step];

    return (
        <div style={{
            minHeight: '100vh', width: '100vw', overflow: 'auto',
            background: '#f8fafc',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '32px 20px 48px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#111827',
        }}>
            {/* Logo */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 6 }}>
                    <img src="/favicon.png" alt="Q-SIMUTRON" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }} />
                    <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' }}>Business DNA Setup</span>
                </div>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                    {user?.displayName ? `${user.displayName} · ` : ''}3 essential sections
                </p>
            </motion.div>

            {/* Progress */}
            <div style={{ width: '100%', maxWidth: 640, marginBottom: 28 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {SECTIONS.map((s, i) => (
                        <div key={s.id} style={{
                            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                            borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: i < step ? 'rgba(99,102,241,0.15)' : i === step ? 'rgba(99,102,241,0.25)' : '#f9fafb',
                            border: i === step ? '1px solid rgba(99,102,241,0.5)' : '1px solid #e5e7eb',
                            color: i < step ? '#818cf8' : i === step ? '#4f46e5' : '#9ca3af',
                            cursor: i < step ? 'pointer' : 'default', transition: 'all 0.2s',
                        }} onClick={() => i < step && setStep(i)}>
                            <span style={{
                                width: 14, height: 14, borderRadius: '50%', fontSize: 9, fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: i < step ? '#6366f1' : '#e5e7eb',
                                color: i < step ? '#ffffff' : '#6b7280',
                            }}>
                                {i < step ? '✓' : s.id}
                            </span>
                            {s.title}
                        </div>
                    ))}
                </div>

                <div style={{ height: 3, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: 2 }}
                    />
                </div>
            </div>

            {/* Card */}
            <div style={{ width: '100%', maxWidth: 640 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.25 }}
                        style={{
                            background: '#f1f5f9', border: '1px solid #e5e7eb',
                            borderRadius: 16, padding: '32px',
                        }}
                    >
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <span style={{
                                    fontSize: 10, fontWeight: 800, padding: '3px 8px',
                                    borderRadius: 6, background: 'rgba(99,102,241,0.2)',
                                    color: '#4f46e5', letterSpacing: '0.08em',
                                }}>SECTION {current.id}</span>
                                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{current.title}</h2>
                            </div>
                            <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>{current.subtitle}</p>
                        </div>

                        {/* ── SECTION A: Company + Industry ── */}
                        {step === 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                                        Company name <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                        placeholder="e.g. Tesla, Zomato, Acme Logistics…"
                                        style={{
                                            width: '100%', boxSizing: 'border-box', padding: '12px 14px',
                                            borderRadius: 10, background: '#ffffff',
                                            border: '1.5px solid #e5e7eb', color: '#111827',
                                            fontSize: 14, fontFamily: 'inherit', outline: 'none',
                                        }}
                                        onFocus={e => (e.target.style.borderColor = '#6366f1')}
                                        onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                                        Company website <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                                    </label>
                                    <input
                                        type="url"
                                        value={companyWebsite}
                                        onChange={e => setCompanyWebsite(e.target.value)}
                                        placeholder="e.g. https://www.tesla.com"
                                        style={{
                                            width: '100%', boxSizing: 'border-box', padding: '12px 14px',
                                            borderRadius: 10, background: '#ffffff',
                                            border: '1.5px solid #e5e7eb', color: '#111827',
                                            fontSize: 14, fontFamily: 'inherit', outline: 'none',
                                        }}
                                        onFocus={e => (e.target.style.borderColor = '#6366f1')}
                                        onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                                        What does it do? <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                                    </label>
                                    <textarea
                                        value={companyDescription}
                                        onChange={e => setCompanyDescription(e.target.value)}
                                        placeholder="One line — e.g. 'AI-powered last-mile delivery for D2C brands in India'"
                                        rows={2}
                                        style={{
                                            width: '100%', boxSizing: 'border-box', padding: '12px 14px',
                                            borderRadius: 10, background: '#ffffff', resize: 'vertical',
                                            border: '1.5px solid #e5e7eb', color: '#111827',
                                            fontSize: 14, fontFamily: 'inherit', outline: 'none', lineHeight: 1.5,
                                        }}
                                        onFocus={e => (e.target.style.borderColor = '#6366f1')}
                                        onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                                    />
                                </div>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Which industry is it in?</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                        {INDUSTRIES.map(ind => (
                                            <button key={ind} onClick={() => setIndustry(ind)} type="button" style={{
                                                padding: '12px 16px', borderRadius: 10, textAlign: 'left',
                                                background: industry === ind ? 'rgba(99,102,241,0.08)' : '#ffffff',
                                                border: industry === ind ? '1.5px solid #6366f1' : '1.5px solid #e5e7eb',
                                                color: industry === ind ? '#4f46e5' : '#374151',
                                                cursor: 'pointer', fontSize: 13, fontWeight: industry === ind ? 600 : 400,
                                                fontFamily: 'inherit', transition: 'all 0.15s',
                                                display: 'flex', alignItems: 'center', gap: 8,
                                            }}>
                                                {industry === ind && <Check size={12} color="#4f46e5" />}
                                                {ind}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── SECTION B: Team Size ── */}
                        {step === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>Team Size</p>
                                    <ChipSelect options={TEAM_OPTIONS} value={teamSize} onChange={setTeamSize} />
                                </div>
                            </div>
                        )}

                        {/* ── SECTION C: Goals ── */}
                        {step === 2 && (
                            <div>
                                <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>Select all that apply (multi-select)</p>
                                <MultiChipSelect options={GOALS} values={goals} onChange={setGoals} />
                                {goals.length > 0 && (
                                    <p style={{ fontSize: 11, color: '#818cf8', marginTop: 12 }}>
                                        {goals.length} goal{goals.length > 1 ? 's' : ''} selected
                                    </p>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                {submitError && (
                    <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12.5 }}>
                        {submitError}
                    </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button
                        onClick={() => step > 0 && setStep(s => s - 1)}
                        disabled={step === 0}
                        style={{
                            padding: '12px 18px', borderRadius: 10,
                            background: '#f9fafb', border: '1px solid #e5e7eb',
                            color: step === 0 ? '#e5e7eb' : '#374151',
                            cursor: step === 0 ? 'not-allowed' : 'pointer',
                            fontSize: 13, fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                        <ChevronLeft size={15} />
                    </button>

                    <motion.button
                        whileHover={{ scale: canAdvance ? 1.02 : 1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleNext}
                        disabled={!canAdvance || isSubmitting}
                        style={{
                            flex: 1, padding: '13px', borderRadius: 10, border: 'none',
                            background: canAdvance && !isSubmitting
                                ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                                : '#f3f4f6',
                            color: canAdvance && !isSubmitting ? '#fff' : '#9ca3af',
                            cursor: canAdvance && !isSubmitting ? 'pointer' : 'not-allowed',
                            fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            transition: 'all 0.2s',
                        }}>
                        {isSubmitting ? (
                            <>
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                    style={{ width: 14, height: 14, border: '2px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%' }} />
                                Building your AI dashboard...
                            </>
                        ) : isLast ? (
                            <><Zap size={15} /> Launch Q-Simutron</>
                        ) : (
                            <>Continue <ChevronRight size={15} /></>
                        )}
                    </motion.button>
                </div>
            </div>

            <p style={{ marginTop: 20, fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
                Your Business DNA is saved securely to Supabase. You can update it anytime from Settings.
            </p>
        </div>
    );
}
