import { useState } from 'react';
import { Bell, ChevronDown, Key, Plus, ShieldCheck, Trash2, User, Users, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionStore } from '../../store/sessionStore';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { ENVIRONMENTS } from '../../data/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const PAGE_TITLES: Record<string, string> = {
    '/morning': 'Morning Briefing',
    '/oct': 'OCT Simulator',
    '/advisor': 'AI Advisor',
    '/twin': 'Digital Twin',
    '/forecast': 'Forecasting Engine',
    '/risk': 'Risk Center',
    '/market': 'Market Intelligence',
    '/competitors': 'Competitor Analysis',
    '/finance': 'Financial Engine',
    '/sentiment': 'Customer Sentiment',
    '/reports': 'Executive Reports',
    '/integrations': 'Integrations',
    '/team': 'Team Workspace',
    '/settings': 'Settings',
    '/help': 'Help',
    '/data': 'Data',
    '/models': 'Models',
    '/manage': 'Manage',
    '/arch': 'Architecture',
    '/theme': 'Theme',
};

const ENV_COLORS: Record<string, string> = {
    production: 'bg-green-500',
    staging: 'bg-yellow-500',
    development: 'bg-blue-500',
};

export default function TopBar() {
    const { environment, setEnvironment } = useSessionStore();
    const location = useLocation();
    const navigate = useNavigate();
    const addToast = useToastStore((state) => state.addToast);
    const { user, logout } = useAuthStore();
    const [activeModal, setActiveModal] = useState<'profile' | 'api' | 'team' | null>(null);

    const pageTitle = PAGE_TITLES[location.pathname] ?? 'Q-SIMUTRON';

    const ModalOverlay = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass-strong glass-edge relative w-full max-w-lg rounded-2xl p-8"
            >
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>
                <h3 className="text-xl font-bold mb-6">{title}</h3>
                {children}
            </motion.div>
        </div>
    );

    return (
        <>
            <header className="qs-topbar relative z-30 flex h-12 shrink-0 items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 h-4" />
                <h1 className="text-sm font-semibold tracking-tight text-foreground">{pageTitle}</h1>

                <div className="ml-auto flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs font-medium">
                                <span className={`size-1.5 rounded-full ${ENV_COLORS[environment] ?? 'bg-blue-500'}`} />
                                {environment}
                                <ChevronDown size={11} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-36">
                            {ENVIRONMENTS.map((e) => (
                                <DropdownMenuItem
                                    key={e}
                                    onClick={() => setEnvironment(e)}
                                    className="gap-2 cursor-pointer"
                                >
                                    <span className={`size-1.5 rounded-full ${ENV_COLORS[e] ?? 'bg-blue-500'}`} />
                                    <span className="capitalize">{e}</span>
                                    {environment === e && <span className="ml-auto text-[10px] text-muted-foreground">active</span>}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'} className="gap-1 text-xs h-7 px-2">
                        {user?.role === 'admin' ? <ShieldCheck size={11} /> : <User size={11} />}
                        {user?.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>

                    <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="Notifications">
                        <Bell size={15} strokeWidth={1.5} />
                        <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-neon-pink shadow-[0_0_8px_rgba(244,114,182,0.8)]" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90" aria-label="User menu">
                                <User size={14} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <div className="px-3 py-2">
                                <p className="text-sm font-semibold">{user?.displayName || 'Enterprise Admin'}</p>
                                <p className="text-xs text-muted-foreground">{user?.email || 'admin@qsimutron.ai'}</p>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer" onClick={() => setActiveModal('profile')}>
                                <User size={14} className="mr-2" /> Profile Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => setActiveModal('api')}>
                                <Key size={14} className="mr-2" /> API Keys
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => setActiveModal('team')}>
                                <Users size={14} className="mr-2" /> Team Management
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer text-destructive focus:text-destructive"
                                onClick={async () => {
                                    await logout();
                                    navigate('/auth');
                                    addToast('Signed out of Q-Simutron platform', 'info');
                                }}
                            >
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <AnimatePresence>
                {activeModal === 'profile' && (
                    <ModalOverlay title="Profile Settings" onClose={() => setActiveModal(null)}>
                        <div className="flex flex-col gap-5">
                            <div className="flex items-center gap-4 rounded-xl bg-muted p-4">
                                <div className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                                    {(user?.displayName || 'U')[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-base">{user?.displayName || 'User'}</p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        {user?.role === 'admin' ? <ShieldCheck size={12} /> : <User size={12} />}
                                        {user?.role === 'admin' ? 'Platform Admin' : 'Standard User'}
                                    </p>
                                </div>
                            </div>
                            <Button onClick={() => setActiveModal(null)}>Save Changes</Button>
                        </div>
                    </ModalOverlay>
                )}

                {activeModal === 'api' && (
                    <ModalOverlay title="Enterprise API Keys" onClose={() => setActiveModal(null)}>
                        <p className="text-sm text-muted-foreground mb-6">Manage keys for programmatic access to Q-Simutron Inference and Data APIs.</p>
                        <div className="flex flex-col gap-3 mb-6">
                            {[
                                { name: 'Prod Inference Key', lastUsed: '2 mins ago', key: 'pk_live_••••••••••••4f2a' },
                                { name: 'Development Key', lastUsed: '14 Jan 2025', key: 'pk_test_••••••••••••9e1b' },
                            ].map((k, i) => (
                                <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <p className="font-semibold text-sm">{k.name}</p>
                                        <p className="font-mono text-xs text-muted-foreground mt-1">{k.key}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Delete">
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button className="w-full gap-2">
                            <Plus size={16} /> Generate New Key
                        </Button>
                    </ModalOverlay>
                )}

                {activeModal === 'team' && (
                    <ModalOverlay title="Team Management" onClose={() => setActiveModal(null)}>
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-bold text-muted-foreground">Platform Members (4)</p>
                                <Button variant="ghost" size="sm" className="text-primary text-xs">Invite Member</Button>
                            </div>
                            <div className="flex flex-col gap-3">
                                {[
                                    { name: 'Sarah Chen', role: 'Data Scientist', access: 'Editor' },
                                    { name: 'Michael Ross', role: 'ML Engineer', access: 'Editor' },
                                    { name: 'Elena Rodriguez', role: 'Security Ops', access: 'Viewer' },
                                ].map((m, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                                                {m.name.split(' ').map((n: string) => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">{m.name}</p>
                                                <p className="text-xs text-muted-foreground">{m.role}</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="text-xs">{m.access}</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 rounded-xl border border-neon-violet/25 bg-neon-violet/10 p-4">
                            <ShieldCheck size={20} className="text-neon-violet-bright shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-neon-violet-bright">RBAC Enabled</p>
                                <p className="text-xs text-foreground/70">Permissions are globally synced via Azure AD.</p>
                            </div>
                        </div>
                    </ModalOverlay>
                )}
            </AnimatePresence>
        </>
    );
}
