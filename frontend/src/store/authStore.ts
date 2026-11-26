import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'user';

export interface AuthUser {
    email: string;
    displayName: string;
    uid: string;
    role: UserRole;
    company?: string;
}

export interface BusinessDNA {
    companyName: string;
    companyWebsite: string;
    companyDescription: string;
    industry: string;
    annualRevenue: string;
    teamSize: string;
    goals: string[];
    riskAppetite: string;
    primaryMarkets: string[];
    customerType: string;
    monthlySpend: string;
    monthlyRevenue: string;
    burnRate: string;
    growthRate: string;
    aiPriority: string;
    userRole: string;
}

interface AuthState {
    user: AuthUser | null;
    isLoading: boolean;
    onboardingComplete: boolean;
    businessDNA: BusinessDNA | null;
    initialize: () => void;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name?: string, company?: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    completeOnboarding: (dna: BusinessDNA) => void;
    resetOnboarding: () => void;
}

const DNA_KEY = 'qsimutron_dna';

function resolveRole(email: string): UserRole {
    const lower = email.toLowerCase();
    return lower.includes('admin') || lower.includes('ceo') || lower.includes('cto') ? 'admin' : 'user';
}

function userFromSupabase(sbUser: { id: string; email?: string; user_metadata?: Record<string, string> }): AuthUser {
    const email = sbUser.email ?? '';
    const meta = sbUser.user_metadata ?? {};
    return {
        uid: sbUser.id,
        email,
        displayName: meta.full_name || meta.name || email.split('@')[0],
        role: resolveRole(email),
        company: meta.company,
    };
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    onboardingComplete: false,
    businessDNA: null,

    initialize: () => {
        // Load DNA from localStorage
        let dna: BusinessDNA | null = null;
        let onboardingComplete = false;
        try {
            const raw = localStorage.getItem(DNA_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                dna = parsed.dna ?? null;
                onboardingComplete = !!parsed.complete;
            }
        } catch { /* ignore */ }

        // Restore session from Supabase (reads from localStorage automatically)
        supabase.auth.getSession().then(({ data }) => {
            const sbUser = data.session?.user;
            set({
                user: sbUser ? userFromSupabase(sbUser) : null,
                businessDNA: dna,
                onboardingComplete,
                isLoading: false,
            });
        });

        // Keep in sync with Supabase session changes (tab focus, token refresh, sign-out)
        supabase.auth.onAuthStateChange((_event, session) => {
            const sbUser = session?.user;
            set(state => ({
                user: sbUser ? userFromSupabase(sbUser) : null,
                // Clear DNA only on explicit sign-out (not just token refresh)
                businessDNA: sbUser ? state.businessDNA : null,
                onboardingComplete: sbUser ? state.onboardingComplete : false,
            }));
        });
    },

    login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        if (!data.user) throw new Error('No user returned');
        set({ user: userFromSupabase(data.user) });
    },

    signup: async (email, password, name, company) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name ?? '',
                    company: company ?? '',
                },
            },
        });
        if (error) throw new Error(error.message);
        // Supabase may return a user even before email confirmation
        if (data.user) {
            set({ user: userFromSupabase(data.user) });
        }
    },

    signInWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth`
            }
        });
        if (error) throw new Error(error.message);
    },

    logout: async () => {
        await supabase.auth.signOut();
        localStorage.removeItem(DNA_KEY);
        set({ user: null, businessDNA: null, onboardingComplete: false });
    },

    completeOnboarding: (dna) => {
        localStorage.setItem(DNA_KEY, JSON.stringify({ complete: true, dna }));
        set({ onboardingComplete: true, businessDNA: dna });
    },

    resetOnboarding: () => {
        localStorage.removeItem(DNA_KEY);
        set({ onboardingComplete: false, businessDNA: null });
    },
}));
