import { create } from 'zustand';

interface Connector {
    id: string;
    name: string;
    icon: string;
    status: 'Live' | 'Not connected';
    category: string;
    color: string;
}

interface Action {
    id: string;
    title: string;
    meta: string;
    priority: 'critical' | 'high' | 'medium';
    progress: number;
    status: 'queued' | 'running' | 'done';
}

interface DashboardState {
    connectors: Connector[];
    metrics: {
        activeConnectors: number;
        criticalAlerts: number;
        autonomousActions: number;
    };
    alerts: Array<{ id: string; title: string; meta: string; tag: string; type: 'critical' | 'warning' | 'healthy' | 'info' }>;
    actions: Action[];
    
    toggleConnector: (id: string) => void;
    runAction: (id: string) => void;
    runAllActions: () => void;
    updateMetrics: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
    connectors: [
        { id: 'gmail', name: 'Gmail', icon: '📬', status: 'Live', category: 'Productivity', color: '#e8f5e9' },
        { id: 'drive', name: 'Google Drive', icon: '📁', status: 'Live', category: 'Productivity', color: '#e3f2fd' },
        { id: 'slack', name: 'Slack', icon: '💬', status: 'Live', category: 'Productivity', color: '#ede9fe' },
        { id: 'cal', name: 'Google Cal', icon: '📅', status: 'Not connected', category: 'Productivity', color: '#fef3c7' },
        { id: 'notion', name: 'Notion', icon: '📝', status: 'Not connected', category: 'Productivity', color: '#f5f5f4' },
        { id: 'salesforce', name: 'Salesforce', icon: '☁️', status: 'Live', category: 'CRM', color: '#e0f2fe' },
        { id: 'jira', name: 'Jira', icon: '🔷', status: 'Live', category: 'Management', color: '#ede9fe' },
        { id: 'asana', name: 'Asana', icon: '🅰', status: 'Live', category: 'Management', color: '#fce4ec' },
        { id: 'snowflake', name: 'Snowflake', icon: '❄️', status: 'Live', category: 'Analytics', color: '#e0f2fe' },
        { id: 'github', name: 'GitHub', icon: '🐙', status: 'Live', category: 'Dev', color: '#f4f4f5' },
    ],
    metrics: {
        activeConnectors: 14,
        criticalAlerts: 3,
        autonomousActions: 7,
    },
    alerts: [
        { id: '1', title: 'Turbine #7 failure risk — 94% probability', meta: 'Reliability agent · 2 min ago', tag: 'Critical', type: 'critical' },
        { id: '2', title: 'Supply chain delay — Region 2 components', meta: 'Snowflake inventory · 8 min ago', tag: 'Warning', type: 'warning' },
        { id: '3', title: '18 customer accounts showing churn signals', meta: 'Salesforce CRM · 14 min ago', tag: 'High Risk', type: 'warning' },
        { id: '4', title: 'Fraud detection — all regions nominal', meta: 'Process agent · 1 min ago', tag: 'Healthy', type: 'healthy' },
    ],
    actions: [
        { id: 'ai-1', title: 'Emergency turbine inspection order', meta: 'Reliability · Auto-assignable', priority: 'critical', progress: 40, status: 'queued' },
        { id: 'ai-2', title: 'Reroute supply chain — Region 2', meta: 'Inventory · Multi-agent', priority: 'critical', progress: 0, status: 'queued' },
        { id: 'ai-3', title: 'Churn-risk outreach campaign', meta: 'Salesforce · Research', priority: 'high', progress: 0, status: 'queued' },
    ],

    toggleConnector: (id) => set((state) => {
        const connectors = state.connectors.map(c => 
            c.id === id ? { ...c, status: c.status === 'Live' ? 'Not connected' : 'Live' as any } : c
        );
        const activeConnectors = connectors.filter(c => c.status === 'Live').length + 5; // Offset to match original 14
        return { connectors, metrics: { ...state.metrics, activeConnectors } };
    }),

    runAction: (id) => {
        const interval = setInterval(() => {
            set((state) => {
                const actions = state.actions.map(a => {
                    if (a.id === id) {
                        const newProgress = Math.min(100, a.progress + 10);
                        return { 
                            ...a, 
                            progress: newProgress, 
                            status: newProgress === 100 ? 'done' : 'running' as any 
                        };
                    }
                    return a;
                });
                
                if (actions.find(a => a.id === id)?.progress === 100) {
                    clearInterval(interval);
                    return { actions, metrics: { ...state.metrics, autonomousActions: state.metrics.autonomousActions + 1 } };
                }
                return { actions };
            });
        }, 800);
    },

    runAllActions: () => {
        get().actions.forEach(a => {
            if (a.status !== 'done') get().runAction(a.id);
        });
    },

    updateMetrics: () => set((state) => ({
        metrics: {
            ...state.metrics,
            criticalAlerts: Math.max(0, state.metrics.criticalAlerts + (Math.random() > 0.8 ? 1 : Math.random() < 0.2 ? -1 : 0))
        }
    }))
}));
