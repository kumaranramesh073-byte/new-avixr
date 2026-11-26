import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Loader2 } from 'lucide-react';
import ToastContainer from './components/shared/ToastContainer';
import AmbientBackground from './components/shared/AmbientBackground';
import { SidebarProvider } from '@/components/ui/sidebar';

// Layout
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';

// Public pages (no auth required)
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import TestIframe from './pages/TestIframe';
import HomeCommandCenter from './components/dashboard/HomeCommandCenter';
import CommandCenterPreview from './components/dashboard/CommandCenterPreview';

// Onboarding (auth but no DNA)
import Onboarding from './pages/Onboarding';

// App pages
import MorningBriefing from './pages/MorningBriefing';
import Session from './pages/Session';
import Data from './pages/Data';
import Models from './pages/Models';
import Manage from './pages/Manage';
import Architecture from './pages/Architecture';
import Theme from './pages/Theme';
import Help from './pages/Help';

// Agent Dashboards
import LightDashboard from './pages/dashboards/LightDashboard';
import ReliabilityDashboard from './pages/dashboards/ReliabilityDashboard';
import ProcessOptDashboard from './pages/dashboards/ProcessOptDashboard';
import InventoryDashboard from './pages/dashboards/InventoryDashboard';
import DemandForecastDashboard from './pages/dashboards/DemandForecastDashboard';
import ResumeDashboard from './pages/dashboards/ResumeDashboard';
import DeepResearchDashboard from './pages/dashboards/DeepResearchDashboard';

// Real Modules
import Forecasting from './pages/modules/Forecasting';
import RiskCenter from './pages/modules/RiskCenter';
import MarketIntel from './pages/modules/MarketIntel';
import FinanceEngine from './pages/modules/FinanceEngine';
import CustomerSentiment from './pages/modules/CustomerSentiment';
import CompetitorAnalysis from './pages/modules/CompetitorAnalysis';
import DigitalTwin from './pages/modules/DigitalTwin';
import AIAdvisor from './pages/modules/AIAdvisor';
import ExecutiveReports from './pages/modules/ExecutiveReports';
import Settings from './pages/modules/Settings';

// Placeholder for new OCT modules
function Placeholder({ title }: { title: string }) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
            <div className="text-2xl font-bold tracking-tight text-muted-foreground/40">{title}</div>
            <div className="text-sm">Coming soon</div>
        </div>
    );
}

export default function App() {
    const { user, isLoading, initialize, onboardingComplete } = useAuthStore();
    const location = useLocation();

    useEffect(() => {
        initialize();
    }, [initialize]);

    // Render standalone routes bypassing auth and layouts
    if (location.pathname === '/test') {
        return <TestIframe />;
    }

    // The index page is the public landing page for everyone, signed in or not.
    // It renders straight away and picks up the sign-in state once it is known.
    if (location.pathname === '/') {
        return <Landing />;
    }

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Loader2 size={28} className="animate-spin text-primary" />
            </div>
        );
    }

    // ── Unauthenticated: landing + auth pages ─────────────────────────────────
    if (!user) {
        return (
            <>
                <ToastContainer />
                <Routes>
                    {/* Landing controls its own layout — no wrapper clipping */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={
                        <div className="h-screen w-screen overflow-auto bg-background">
                            <Auth />
                        </div>
                    } />
                    <Route path="/test" element={<TestIframe />} />
                    {/* Visual previews (no-auth) */}
                    <Route path="/preview-home" element={<CommandCenterPreview />} />
                    <Route path="/preview-think" element={
                        <HomeCommandCenter
                            dna={{
                                companyName: 'Avixr Technologies',
                                companyWebsite: 'https://avixr.com',
                                companyDescription: 'Enterprise decision intelligence and strategic simulation platform',
                                industry: 'Enterprise SaaS',
                                teamSize: '50–500',
                                goals: ['Market Expansion'],
                            }}
                            userName="Adrian" phase="running" onRun={() => {}} onResetDNA={() => {}}
                        />
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </>
        );
    }

    // ── Authenticated but onboarding not done ────────────────────────────────
    if (!onboardingComplete) {
        return (
            <div className="h-screen w-screen overflow-auto bg-transparent">
                <AmbientBackground />
                <ToastContainer />
                <Routes>
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="*" element={<Navigate to="/onboarding" replace />} />
                </Routes>
            </div>
        );
    }

    // ── Full app shell ────────────────────────────────────────────────────────
    return (
        <SidebarProvider style={{ height: '100svh', overflow: 'hidden' }}>
            <AmbientBackground />
            <ToastContainer />
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                <TopBar />
                <div style={{ flex: 1, overflowY: 'auto' }} className="bg-transparent">
                    <Routes>
                        {/* OCT Home */}
                        <Route path="/" element={<Navigate to="/morning" replace />} />
                        <Route path="/morning" element={<MorningBriefing />} />
                        <Route path="/oct" element={<MorningBriefing />} />

                        {/* New OCT modules */}
                        <Route path="/advisor" element={<AIAdvisor />} />
                        <Route path="/twin" element={<DigitalTwin />} />
                        <Route path="/forecast" element={<Forecasting />} />
                        <Route path="/risk" element={<RiskCenter />} />
                        <Route path="/market" element={<MarketIntel />} />
                        <Route path="/competitors" element={<CompetitorAnalysis />} />
                        <Route path="/finance" element={<FinanceEngine />} />
                        <Route path="/sentiment" element={<CustomerSentiment />} />
                        <Route path="/reports" element={<ExecutiveReports />} />
                        <Route path="/integrations" element={<Placeholder title="Integrations" />} />
                        <Route path="/team" element={<Placeholder title="Team Workspace" />} />
                        <Route path="/settings" element={<Settings />} />

                        {/* Legacy routes kept */}
                        <Route path="/light" element={<LightDashboard />} />
                        <Route path="/sessions/:id" element={<Session />} />
                        <Route path="/data" element={<Data />} />
                        <Route path="/models" element={<Models />} />
                        <Route path="/manage" element={<Manage />} />
                        <Route path="/arch" element={<Architecture />} />
                        <Route path="/theme" element={<Theme />} />
                        <Route path="/help" element={<Help />} />
                        <Route path="/agents/reliability" element={<ReliabilityDashboard />} />
                        <Route path="/agents/optimization" element={<ProcessOptDashboard />} />
                        <Route path="/agents/inventory" element={<InventoryDashboard />} />
                        <Route path="/agents/forecasting" element={<DemandForecastDashboard />} />
                        <Route path="/agents/resume" element={<ResumeDashboard />} />
                        <Route path="/agents/research" element={<DeepResearchDashboard />} />

                        <Route path="*" element={<Navigate to="/morning" replace />} />
                    </Routes>
                </div>
            </div>
        </SidebarProvider>
    );
}
