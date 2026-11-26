/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Zustand Session Store
   ═══════════════════════════════════════════════════════════════════════════ */

import { create } from 'zustand';
import type {
    Session,
    ExecutionPlan,
    StepResult,
    AgentMode,
    Environment,
} from '../types';

interface SessionStore {
    sessions: Session[];
    activeSessionId: number | null;
    agentMode: AgentMode;
    environment: Environment;
    isLoading: boolean;
    globalSearch: string;

    setGlobalSearch: (query: string) => void;
    setAgentMode: (mode: AgentMode) => void;
    setEnvironment: (env: Environment) => void;
    setActiveSessionId: (id: number | null) => void;
    setIsLoading: (loading: boolean) => void;

    createSession: (query: string) => number;
    setPlan: (sessionId: number, plan: ExecutionPlan) => void;
    setSessionStatus: (sessionId: number, status: Session['status']) => void;
    startExecution: (sessionId: number) => void;
    setCurrentStep: (sessionId: number, step: number) => void;
    addStepResult: (sessionId: number, result: StepResult, progress: number) => void;
    setBackendId: (sessionId: number, backendId: string) => void;
    setSimulationResults: (sessionId: number, simulation: any, decisionScore: any) => void;
    completeSession: (sessionId: number) => void;
    getActiveSession: () => Session | undefined;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
    sessions: [],
    activeSessionId: null,
    agentMode: 'All Agents',
    environment: 'default',
    isLoading: false,
    globalSearch: '',

    setGlobalSearch: (query) => set({ globalSearch: query }),
    setAgentMode: (mode) => set({ agentMode: mode }),
    setEnvironment: (env) => set({ environment: env }),
    setActiveSessionId: (id) => set({ activeSessionId: id }),
    setIsLoading: (loading) => set({ isLoading: loading }),

    createSession: (query: string) => {
        const sid = Date.now();
        const newSession: Session = {
            id: sid,
            query,
            plan: null,
            executedSteps: [],
            status: 'planning',
            currentStep: -1,
            progress: 0,
        };
        set((state) => ({
            sessions: [newSession, ...state.sessions],
            activeSessionId: sid,
        }));
        return sid;
    },

    setPlan: (sessionId, plan) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId ? { ...s, plan, status: 'ready' as const } : s
            ),
        })),

    setSessionStatus: (sessionId, status) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId ? { ...s, status } : s
            ),
        })),

    startExecution: (sessionId) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId
                    ? { ...s, status: 'executing' as const, currentStep: 0, progress: 5 }
                    : s
            ),
        })),

    setCurrentStep: (sessionId, step) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId ? { ...s, currentStep: step } : s
            ),
        })),

    addStepResult: (sessionId, result, progress) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId
                    ? {
                        ...s,
                        executedSteps: [...s.executedSteps, result],
                        currentStep: s.currentStep + 1,
                        progress,
                    }
                    : s
            ),
        })),

    setBackendId: (sessionId, backendId) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId ? { ...s, backendId } : s
            ),
        })),

    setSimulationResults: (sessionId, simulation, decisionScore) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId ? { ...s, simulation, decisionScore } : s
            ),
        })),

    completeSession: (sessionId) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId
                    ? { ...s, status: 'done' as const, progress: 100 }
                    : s
            ),
        })),

    getActiveSession: () => {
        const state = get();
        return state.sessions.find((s) => s.id === state.activeSessionId);
    },
}));
