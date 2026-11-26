import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

function Field({
    label, type = 'text', value, onChange, placeholder, required = true, hint,
}: {
    label: string; type?: string; value: string;
    onChange: (v: string) => void; placeholder?: string; required?: boolean; hint?: string;
}) {
    const [show, setShow] = useState(false);
    const isPassword = type === 'password';
    return (
        <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label}{required && <span style={{ color: '#6366f1', marginLeft: 3 }}>*</span>}
            </label>
            <div style={{ position: 'relative' }}>
                <input
                    type={isPassword ? (show ? 'text' : 'password') : type}
                    required={required}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    style={{
                        width: '100%', padding: isPassword ? '10px 40px 10px 14px' : '10px 14px',
                        borderRadius: 8, background: '#f9fafb', border: '1.5px solid #e5e7eb',
                        color: '#111827', fontSize: 14, outline: 'none',
                        boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#6366f1')}
                    onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                />
                {isPassword && (
                    <button type="button" onClick={() => setShow(s => !s)} style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0,
                    }}>
                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                )}
            </div>
            {hint && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>{hint}</p>}
        </div>
    );
}

const btn = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: '100%', padding: '12px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: '#ffffff', cursor: 'pointer', fontSize: 14, fontWeight: 700,
    fontFamily: 'inherit', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8, transition: 'opacity 0.2s',
    boxShadow: '0 2px 12px rgba(99,102,241,0.35)', ...extra,
});

export default function Auth() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login, signup, signInWithGoogle } = useAuthStore();
    const addToast = useToastStore(s => s.addToast);

    const [mode, setMode] = useState<'login' | 'signup'>(
        searchParams.get('mode') === 'signup' ? 'signup' : 'login'
    );
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // login
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // signup step 1
    const [name, setName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // signup step 2
    const [company, setCompany] = useState('');

    useEffect(() => {
        if (searchParams.get('mode') === 'signup') setMode('signup');
    }, [searchParams]);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            addToast(err.message || 'Google sign-in failed', 'error');
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) { addToast('Please fill in all fields', 'warning'); return; }
        setLoading(true);
        try {
            await login(email, password);
            addToast('Welcome back!', 'success');
        } catch (err: any) {
            addToast(err.message || 'Login failed', 'error');
        } finally { setLoading(false); }
    };

    const handleStep1 = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !signupEmail || !signupPassword || !confirmPassword) {
            addToast('Please fill in all fields', 'warning'); return;
        }
        if (signupPassword.length < 6) {
            addToast('Password must be at least 6 characters', 'warning'); return;
        }
        if (signupPassword !== confirmPassword) {
            addToast('Passwords do not match', 'warning'); return;
        }
        setStep(2);
    };

    const handleStep2 = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signup(signupEmail, signupPassword, name, company || undefined);
            addToast("Account created! Let's set up your Business DNA.", 'success');
        } catch (err: any) {
            addToast(err.message || 'Signup failed', 'error');
            setStep(1);
        } finally { setLoading(false); }
    };

    const switchMode = (m: 'login' | 'signup') => { setMode(m); setStep(1); };

    return (
        <div style={{
            minHeight: '100vh', width: '100vw', background: '#f8fafc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
            <button onClick={() => navigate('/')} style={{
                position: 'fixed', top: 20, left: 20,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8,
                background: '#f3f4f6', border: '1px solid #e5e7eb',
                color: '#6b7280', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
            }}>
                <ArrowLeft size={13} /> Back
            </button>

            <AnimatePresence mode="wait">
                <motion.div key={mode + step}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    style={{ width: '100%', maxWidth: 440 }}
                >
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 28 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <img src="/favicon.png" alt="Q-SIMUTRON" style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'contain' }} />
                            <span style={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Q-SIMUTRON</span>
                        </div>
                        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
                            {mode === 'login' ? 'Welcome back' : step === 1 ? 'Create your account' : 'Almost there'}
                        </h2>
                        <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                            {mode === 'login' ? 'Sign in to your simulation dashboard'
                                : step === 1 ? 'Start your free business simulation'
                                    : 'One last thing — what\'s your company name?'}
                        </p>
                    </div>

                    <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>

                        {/* ── LOGIN ── */}
                        {mode === 'login' && (
                            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
                                <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
                                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                                    style={btn({ marginTop: 6, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' })}>
                                    {loading ? 'Signing in…' : <><LogIn size={16} /> Sign In</>}
                                </motion.button>
                            </form>
                        )}

                        {/* ── SIGNUP STEP 1 ── */}
                        {mode === 'signup' && step === 1 && (
                            <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <Field label="Full Name" value={name} onChange={setName} placeholder="Jane Smith" />
                                <Field label="Email" type="email" value={signupEmail} onChange={setSignupEmail} placeholder="you@company.com" />
                                <Field label="Password" type="password" value={signupPassword} onChange={setSignupPassword} placeholder="Min. 6 characters" hint="At least 6 characters" />
                                <Field label="Confirm Password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat password" />
                                <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                                    style={btn({ marginTop: 6 })}>
                                    Continue <ArrowRight size={15} />
                                </motion.button>
                            </form>
                        )}

                        {/* ── SIGNUP STEP 2 ── */}
                        {mode === 'signup' && step === 2 && (
                            <form onSubmit={handleStep2} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <Field label="Company Name" value={company} onChange={setCompany} placeholder="Acme Inc." required={false} hint="Optional — used to personalise your AI analysis" />
                                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                                    <button type="button" onClick={() => setStep(1)} style={{
                                        flexShrink: 0, padding: '12px 14px', borderRadius: 10,
                                        background: '#f9fafb', border: '1px solid #e5e7eb',
                                        color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit',
                                        display: 'flex', alignItems: 'center',
                                    }}>
                                        <ArrowLeft size={15} />
                                    </button>
                                    <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                                        style={btn({ flex: 1, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' })}>
                                        {loading ? 'Creating account…' : <><UserPlus size={16} /> Create Account</>}
                                    </motion.button>
                                </div>
                            </form>
                        )}

                        {/* ── OAUTH DIVIDER & BUTTON ── */}
                        {step === 1 && (
                            <div style={{ marginTop: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em' }}>OR CONTINUE WITH</span>
                                    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                                </div>
                                <button type="button" onClick={handleGoogleSignIn} disabled={loading} style={{
                                    width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #e5e7eb',
                                    background: '#ffffff', color: '#374151', cursor: loading ? 'not-allowed' : 'pointer',
                                    fontSize: 14, fontWeight: 600, fontFamily: 'inherit', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s',
                                    opacity: loading ? 0.7 : 1
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    Sign in with Google
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Step dots for signup */}
                    {mode === 'signup' && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
                            {[1, 2].map(s => (
                                <div key={s} style={{
                                    width: s === step ? 20 : 6, height: 6, borderRadius: 3,
                                    background: s === step ? '#6366f1' : '#e5e7eb',
                                    transition: 'all 0.3s',
                                }} />
                            ))}
                        </div>
                    )}

                    {/* Toggle */}
                    <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#9ca3af' }}>
                        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                        <button onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')} style={{
                            background: 'none', border: 'none', color: '#6366f1',
                            fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                        }}>
                            {mode === 'login' ? 'Sign Up Free' : 'Sign In'}
                        </button>
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
