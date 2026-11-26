import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getAuthHeaders } from '../lib/authHeaders';

export type UserRole = 'admin' | 'superadmin' | 'user';

export interface AuthUser {
    email: string;
    displayName: string;
    uid: string;
    role: UserRole;
    organizationId?: string;
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
    completeOnboarding: (dna: BusinessDNA) => Promise<void>;
    resetOnboarding: () => Promise<void>;
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3100/api';

function userFromSupabase(
    sbUser: { id: string; email?: string; user_metadata?: Record<string, string> },
    serverRole?: UserRole,
    organizationId?: string
): AuthUser {
    const email = sbUser.email ?? '';
    const meta = sbUser.user_metadata ?? {};
    return {
        uid: sbUser.id,
        email,
        displayName: meta.full_name || meta.name || email.split('@')[0],
        // NEVER derive admin role from email text — only from verified backend/DB user_profiles.role
        role: serverRole ?? 'user',
        organizationId,
        company: meta.company,
    };
}

async function fetchBackendProfile(): Promise<{
    role: UserRole;
    organizationId?: string;
    dna: BusinessDNA | null;
    onboardingComplete: boolean;
} | null> {
    try {
        const res = await fetch(`${API_BASE}/auth/me`, { headers: await getAuthHeaders() });
        if (!res.ok) return null;
        const data = await res.json();
        return {
            role: data.role === 'superadmin' || data.role === 'admin' ? data.role : 'user',
            organizationId: data.organizationId,
            dna: data.dna ?? null,
            onboardingComplete: !!data.onboardingComplete,
        };
    } catch {
        return null;
    }
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    onboardingComplete: false,
    businessDNA: null,

    initialize: () => {
        supabase.auth.getSession().then(async ({ data }) => {
            const sbUser = data.session?.user;
            if (!sbUser) {
                set({ user: null, businessDNA: null, onboardingComplete: false, isLoading: false });
                return;
            }

            const profile = await fetchBackendProfile();
            const dna = profile?.dna ?? null;
            const complete = !!profile?.onboardingComplete;

            set({
                user: userFromSupabase(sbUser, profile?.role, profile?.organizationId),
                businessDNA: dna,
                onboardingComplete: complete,
                isLoading: false,
            });
        });

        supabase.auth.onAuthStateChange(async (_event, session) => {
            const sbUser = session?.user;
            if (!sbUser) {
                set({ user: null, businessDNA: null, onboardingComplete: false });
                return;
            }

            const profile = await fetchBackendProfile();
            set(state => ({
                user: userFromSupabase(sbUser, profile?.role ?? state.user?.role, profile?.organizationId ?? state.user?.organizationId),
                businessDNA: profile ? profile.dna : state.businessDNA,
                onboardingComplete: profile ? profile.onboardingComplete : state.onboardingComplete,
            }));
        });
    },

    login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        if (!data.user) throw new Error('No user returned');
        const profile = await fetchBackendProfile();
        set({
            user: userFromSupabase(data.user, profile?.role, profile?.organizationId),
            businessDNA: profile?.dna ?? null,
            onboardingComplete: !!profile?.onboardingComplete,
        });
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
        if (data.user) {
            const profile = await fetchBackendProfile();
            set({
                user: userFromSupabase(data.user, profile?.role, profile?.organizationId),
                businessDNA: profile?.dna ?? null,
                onboardingComplete: !!profile?.onboardingComplete,
            });
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
        set({ user: null, businessDNA: null, onboardingComplete: false });
    },

    completeOnboarding: async (dna) => {
        const res = await fetch(`${API_BASE}/dna`, {
            method: 'PUT',
            headers: await getAuthHeaders(),
            body: JSON.stringify(dna),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
            throw new Error(err.error || 'Failed to save Business DNA');
        }
        const saved = await res.json();
        const persistedDna: BusinessDNA = saved.dna ?? dna;
        set({ onboardingComplete: true, businessDNA: persistedDna });
    },

    resetOnboarding: async () => {
        const res = await fetch(`${API_BASE}/dna`, {
            method: 'DELETE',
            headers: await getAuthHeaders(),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
            throw new Error(err.error || 'Failed to reset Business DNA');
        }
        set({ onboardingComplete: false, businessDNA: null });
    },
}));
