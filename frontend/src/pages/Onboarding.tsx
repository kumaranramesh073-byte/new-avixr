/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON — Business DNA Onboarding (7 Sections)
   A → Industry  B → Scale  C → Goals  D → Risk
   E → Markets   F → Ops    G → AI Preferences
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Zap, Check } from 'lucide-react';
import { useAuthStore, type BusinessDNA } from '../store/authStore';

// ─── Section definitions ──────────────────────────────────────────────────────

const INDUSTRIES = ['SaaS', 'Retail', 'Manufacturing', 'Healthcare', 'Logistics', 'Finance', 'E-Commerce', 'Education', 'Government', 'Energy'];

const REVENUE_OPTIONS = ['< $100K', '$100K – $1M', '$1M – $10M', '$10M – $100M', '$100M+', 'Enterprise Scale'];

const TEAM_OPTIONS = ['1–10', '10–50', '50–500', '500–5000', '5000+'];

const GOALS = ['Revenue Growth', 'Expansion Strategy', 'Cost Reduction', 'Customer Retention', 'Hiring Optimization', 'Supply Chain', 'Market Prediction', 'Risk Reduction'];

const RISK_LEVELS = [
    { value: 'Conservative', desc: 'Prioritize stability and capital preservation' },
    { value: 'Balanced', desc: 'Moderate growth with managed risk exposure' },
    { value: 'Aggressive', desc: 'High-growth moves with calculated risk' },
    { value: 'Hyper Growth', desc: 'Maximum expansion, speed over caution' },
];

const MARKETS = ['India', 'United States', 'Europe', 'UAE / GCC', 'APAC', 'LATAM', 'UK', 'Southeast Asia'];

const CUSTOMER_TYPES = ['B2B', 'B2C', 'Hybrid'];

const AI_PRIORITIES = [
    { value: 'Profitability', icon: '💰' },
    { value: 'Fast Growth', icon: '🚀' },
    { value: 'Stability', icon: '🛡️' },
    { value: 'Innovation', icon: '⚡' },
    { value: 'Market Dominance', icon: '👑' },
];

const USER_ROLES = [
    { value: 'Founder' },
    { value: 'CEO' },
    { value: 'CFO' },
    { value: 'COO' },
    { value: 'CTO' },
    { value: 'Data Scientist' },
    { value: 'Data Analyst' },
    { value: 'VC' },
    { value: 'Investor' },
    { value: 'Government' },
    { value: 'Employee' },
];

// ─── Reusable sub-components ──────────────────────────────────────────────────

const ACCENT = '#6366f1';

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

function SliderInput({ label, value, onChange, min = 0, max = 100, unit = '' }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string }) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: '#9ca3af' }}>{label}</label>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5' }}>{value}{unit}</span>
            </div>
            <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: ACCENT, cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                <span>{min}{unit}</span><span>{max}{unit}</span>
            </div>
        </div>
    );
}

function TextInput({ label, value, onChange, placeholder, prefix }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; prefix?: string }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                {prefix && <span style={{ padding: '0 10px', fontSize: 13, color: '#6b7280', borderRight: '1px solid #e5e7eb' }}>{prefix}</span>}
                <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                    style={{ flex: 1, padding: '10px 12px', background: 'transparent', border: 'none', color: '#111827', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            </div>
        </div>
    );
}

// ─── Section definitions ──────────────────────────────────────────────────────

const SECTIONS = [
    { id: 'A', title: 'Company & Industry', subtitle: 'Your role, the company we\'re analyzing, and its sector' },
    { id: 'B', title: 'Company Scale', subtitle: 'Revenue and team size parameters' },
    { id: 'C', title: 'Business Goals', subtitle: 'What should Q-Simutron optimize for?' },
    { id: 'D', title: 'Risk Appetite', subtitle: 'How aggressive is your strategy?' },
    { id: 'E', title: 'Market Parameters', subtitle: 'Geography and customer profile' },
    { id: 'F', title: 'Operational Inputs', subtitle: 'Financial baseline for calibration' },
    { id: 'G', title: 'AI Preferences', subtitle: 'How should the AI prioritize decisions?' },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function Onboarding() {
    const navigate = useNavigate();
    const { completeOnboarding, user } = useAuthStore();
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Section A
    const [companyName, setCompanyName] = useState('');
    const [companyWebsite, setCompanyWebsite] = useState('');
    const [companyDescription, setCompanyDescription] = useState('');
    const [industry, setIndustry] = useState('');
    // Section B
    const [annualRevenue, setAnnualRevenue] = useState('');
    const [teamSize, setTeamSize] = useState('');
    // Section C
    const [goals, setGoals] = useState<string[]>([]);
    // Section D
    const [riskAppetite, setRiskAppetite] = useState('');
    // Section E
    const [primaryMarkets, setPrimaryMarkets] = useState<string[]>([]);
    const [customerType, setCustomerType] = useState('');
    // Section F
    const [monthlySpend, setMonthlySpend] = useState('');
    const [monthlyRevenue, setMonthlyRevenue] = useState('');
    const [burnRate, setBurnRate] = useState(50);
    const [growthRate, setGrowthRate] = useState(20);
    // Section G
    const [aiPriority, setAiPriority] = useState('');
    // User Role
    const [userRole, setUserRole] = useState('');

    const canAdvance = [
        !!industry && !!companyName.trim() && !!userRole,
        !!annualRevenue && !!teamSize,
        goals.length > 0,
        !!riskAppetite,
        primaryMarkets.length > 0 && !!customerType,
        true, // operational inputs are optional
        !!aiPriority,
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
            companyName: companyName.trim(), companyWebsite: companyWebsite.trim(), companyDescription: companyDescription.trim(),
            industry, annualRevenue, teamSize, goals, riskAppetite,
            primaryMarkets, customerType, monthlySpend, monthlyRevenue,
            burnRate: String(burnRate), growthRate: String(growthRate), aiPriority, userRole,
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
                    {user?.displayName ? `${user.displayName} · ` : ''}7 sections · Takes ~3 minutes
                </p>
            </motion.div>

            {/* Progress */}
            <div style={{ width: '100%', maxWidth: 640, marginBottom: 28 }}>
                {/* Section nav pills */}
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
                                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '6px 0 0' }}>
                                        We run Bloomberg · BlackRock · Vanguard · Ecosystem agents against this specific company.
                                    </p>
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
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
                                        Your Role <span style={{ color: '#ef4444' }}>*</span>
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                        {USER_ROLES.map(r => (
                                            <button key={r.value} onClick={() => setUserRole(r.value)} type="button" style={{
                                                padding: '10px 12px', borderRadius: 10, textAlign: 'left',
                                                background: userRole === r.value ? 'rgba(99,102,241,0.08)' : '#ffffff',
                                                border: userRole === r.value ? '1.5px solid #6366f1' : '1.5px solid #e5e7eb',
                                                color: userRole === r.value ? '#4f46e5' : '#374151',
                                                cursor: 'pointer', fontSize: 13, fontWeight: userRole === r.value ? 600 : 400,
                                                fontFamily: 'inherit', transition: 'all 0.15s',
                                                display: 'flex', alignItems: 'center', gap: 8,
                                            }}>
                                                    <span style={{ fontSize: 14 }}>{r.value}</span>
                                                {userRole === r.value && <Check size={11} color="#4f46e5" style={{ marginLeft: 'auto' }} />}
                                            </button>
                                        ))}
                                    </div>
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

                        {/* ── SECTION B: Scale ── */}
                        {step === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>Annual Revenue</p>
                                    <ChipSelect options={REVENUE_OPTIONS} value={annualRevenue} onChange={setAnnualRevenue} />
                                </div>
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

                        {/* ── SECTION D: Risk Appetite ── */}
                        {step === 3 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
                                    This calibrates AI recommendations, simulation behaviour, and expansion predictions.
                                </p>
                                {RISK_LEVELS.map(r => (
                                    <button key={r.value} onClick={() => setRiskAppetite(r.value)} type="button" style={{
                                        padding: '14px 16px', borderRadius: 10, textAlign: 'left',
                                        background: riskAppetite === r.value ? 'rgba(99,102,241,0.18)' : '#f9fafb',
                                        border: riskAppetite === r.value ? '1.5px solid rgba(99,102,241,0.6)' : '1.5px solid #e5e7eb',
                                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: riskAppetite === r.value ? '#4f46e5' : '#1f2937' }}>{r.value}</span>
                                            {riskAppetite === r.value && <Check size={14} color="#818cf8" />}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{r.desc}</div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ── SECTION E: Markets ── */}
                        {step === 4 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>Primary Markets (multi-select)</p>
                                    <MultiChipSelect options={MARKETS} values={primaryMarkets} onChange={setPrimaryMarkets} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>Customer Type</p>
                                    <ChipSelect options={CUSTOMER_TYPES} value={customerType} onChange={setCustomerType} />
                                </div>
                            </div>
                        )}

                        {/* ── SECTION F: Operational Inputs ── */}
                        {step === 5 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <TextInput label="Avg. Monthly Revenue" value={monthlyRevenue} onChange={setMonthlyRevenue} placeholder="e.g. 50000" prefix="$" />
                                    <TextInput label="Avg. Monthly Spend" value={monthlySpend} onChange={setMonthlySpend} placeholder="e.g. 30000" prefix="$" />
                                </div>
                                <SliderInput label="Monthly Burn Rate" value={burnRate} onChange={setBurnRate} min={0} max={100} unit="%" />
                                <SliderInput label="Growth Rate (MoM)" value={growthRate} onChange={setGrowthRate} min={-20} max={100} unit="%" />
                                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
                                    Optional — AI uses these for financial simulation calibration.
                                </p>
                            </div>
                        )}

                        {/* ── SECTION G: AI Priority ── */}
                        {step === 6 && (
                            <div>
                                <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>What should the AI prioritize in all recommendations?</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 10 }}>
                                    {AI_PRIORITIES.map(p => (
                                        <button key={p.value} onClick={() => setAiPriority(p.value)} type="button" style={{
                                            padding: '14px 20px', borderRadius: 10,
                                            background: aiPriority === p.value ? 'rgba(99,102,241,0.18)' : '#f9fafb',
                                            border: aiPriority === p.value ? '1.5px solid rgba(99,102,241,0.6)' : '1.5px solid #e5e7eb',
                                            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                                            display: 'flex', alignItems: 'center', gap: 14,
                                        }}>
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: aiPriority === p.value ? '#4f46e5' : '#1f2937' }}>{p.value}</div>
                                            </div>
                                            {aiPriority === p.value && <Check size={14} color="#818cf8" style={{ marginLeft: 'auto' }} />}
                                        </button>
                                    ))}
                                </div>
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
                        whileHover={{ scale: canAdvance || step === 5 ? 1.02 : 1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleNext}
                        disabled={(!canAdvance && step !== 5) || isSubmitting}
                        style={{
                            flex: 1, padding: '13px', borderRadius: 10, border: 'none',
                            background: (canAdvance || step === 5) && !isSubmitting
                                ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                                : '#f3f4f6',
                            color: (canAdvance || step === 5) && !isSubmitting ? '#fff' : '#9ca3af',
                            cursor: (canAdvance || step === 5) && !isSubmitting ? 'pointer' : 'not-allowed',
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
                Your Business DNA is stored locally. You can update it anytime from Settings.
            </p>
        </div>
    );
}
