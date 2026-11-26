/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — useSession Hook
   Provides agent plan execution logic with step-by-step processing.
   Uses the backend session API with polling for plan readiness and
   WebSocket for real-time step result streaming.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { createSession, getSession, executeSessionPlan } from '../api/client';

/**
 * Polls the backend until the session plan is ready
 */
async function waitForPlan(backendId: string, maxAttempts = 20): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, 1500));
        try {
            const session = await getSession(backendId);
            if (session.status === 'ready' && session.plan) {
                return session;
            }
            if (session.status === 'error') {
                throw new Error('Backend plan generation failed');
            }
        } catch (err) {
            console.error('[useSession] Poll error:', err);
        }
    }
    throw new Error('Plan generation timed out');
}

/**
 * Polls the backend for step results during execution
 */
async function pollExecution(
    backendId: string,
    frontendId: number,
    store: ReturnType<typeof useSessionStore.getState>,
    totalSteps: number,
): Promise<void> {
    const seenSteps = new Set<string>();
    let lastStatus = '';

    for (let attempt = 0; attempt < 120; attempt++) {
        await new Promise(r => setTimeout(r, 1500));
        try {
            const session = await getSession(backendId);
            const steps = session.steps as any[] ?? [];

            // Process new completed steps
            for (const step of steps) {
                if (step.status === 'done' && !seenSteps.has(step.id)) {
                    seenSteps.add(step.id);
                    const progress = Math.round((seenSteps.size / totalSteps) * 100);
                    store.addStepResult(frontendId, {
                        id: step.stepOrder,
                        title: step.title,
                        description: step.description || '',
                        type: step.type || 'text',
                        dataSource: step.dataSource || '',
                        content: step.content,
                        status: 'done' as const,
                    }, progress);
                }
            }

            // Check if done
            if (session.status === 'done' || session.status === 'error') {
                lastStatus = session.status as string;
                break;
            }
        } catch {
            /* ignore transient errors */
        }
    }

    if (lastStatus === 'error') {
        store.setSessionStatus(frontendId, 'error');
    } else {
        store.completeSession(frontendId);
    }
}


export function useSession() {
    const store = useSessionStore();

    const submitQuery = useCallback(
        async (queryText: string) => {
            const q = queryText.trim();
            if (!q) return;

            store.setIsLoading(true);
            const frontendId = store.createSession(q);

            try {
                // 1. Create backend session → triggers orchestrator plan generation
                const res = await createSession(q, store.agentMode);
                const backendId = res.sessionId;
                console.log(`[useSession] Session created: frontend=${frontendId}, backend=${backendId}`);

                // Store mapping for future reference
                sessionMappings.set(frontendId, backendId);
                store.setBackendId(frontendId, backendId);

                store.setIsLoading(false);

                // 2. Poll for plan readiness
                const readySession = await waitForPlan(backendId);
                const planSteps = readySession.plan?.steps || [];

                // 3. Map backend plan to frontend format and show it
                const mappedPlan = {
                    steps: planSteps.map((s: any, i: number) => ({
                        id: i,
                        title: s.title,
                        description: s.description,
                        type: s.type || 'text',
                        dataSource: s.dataSource || 'c3ai',
                        agent: s.agent,
                    })),
                };

                store.setPlan(frontendId, mappedPlan);
                store.startExecution(frontendId);

                // 4. Trigger backend execution
                await executeSessionPlan(backendId);

                // 5. Poll for step results
                await pollExecution(backendId, frontendId, useSessionStore.getState(), planSteps.length);

            } catch (e) {
                console.error('[useSession] Session failed:', e);
                store.setSessionStatus(frontendId, 'error');
                store.setIsLoading(false);
            }

            return frontendId;
        },
        [store]
    );

    const executePlan = useCallback(
        async (sessionId: number) => {
            const backendId = sessionMappings.get(sessionId);
            if (!backendId) {
                console.warn('[useSession] No backend mapping for frontend session:', sessionId);
                return;
            }

            const session = store.sessions.find(s => s.id === sessionId);
            if (!session?.plan?.steps) return;

            store.startExecution(sessionId);
            await executeSessionPlan(backendId);
            await pollExecution(backendId, sessionId, useSessionStore.getState(), session.plan.steps.length);
        },
        [store]
    );

    return {
        ...store,
        submitQuery,
        executePlan,
    };
}

// Simple map to track frontend ↔ backend session ID relationships
const sessionMappings = new Map<number, string>();
