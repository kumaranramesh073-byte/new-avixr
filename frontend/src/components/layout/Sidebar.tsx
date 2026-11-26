import { useLocation, useNavigate } from 'react-router-dom';
import {
    Home, Cpu, Brain, GitFork, TrendingUp, Shield,
    Globe, Users, BarChart2, Heart, FileText, Plug,
    UsersRound, Settings, HelpCircle, LogOut, RefreshCw,
    ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import {
    Sidebar as ShadcnSidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface NavItem {
    path: string;
    icon: React.ElementType;
    label: string;
    badge?: string;
}

const CORE_MODULES: NavItem[] = [
    { path: '/morning', icon: Home, label: 'Home' },
    { path: '/oct', icon: Cpu, label: 'OCT Simulator', badge: 'LIVE' },
    { path: '/advisor', icon: Brain, label: 'AI Advisor' },
    { path: '/twin', icon: GitFork, label: 'Digital Twin' },
    { path: '/forecast', icon: TrendingUp, label: 'Forecasting' },
    { path: '/risk', icon: Shield, label: 'Risk Center' },
    { path: '/market', icon: Globe, label: 'Market Intel' },
    { path: '/competitors', icon: Users, label: 'Competitors' },
    { path: '/finance', icon: BarChart2, label: 'Financial Engine' },
    { path: '/sentiment', icon: Heart, label: 'Customer Sentiment' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/integrations', icon: Plug, label: 'Integrations' },
    { path: '/team', icon: UsersRound, label: 'Team Workspace' },
];

const BOTTOM_ITEMS: NavItem[] = [
    { path: '/settings', icon: Settings, label: 'Settings' },
    { path: '/help', icon: HelpCircle, label: 'Help' },
];

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, resetOnboarding } = useAuthStore();

    const isActive = (path: string) => {
        if (path === '/morning') return location.pathname === '/morning' || location.pathname === '/';
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const initials = user?.displayName
        ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : (user?.email?.[0] ?? 'U').toUpperCase();

    return (
        <ShadcnSidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            onClick={() => navigate('/morning')}
                            className="cursor-pointer"
                        >
                            <img src="/favicon.png" alt="Q-SIMUTRON" className="size-8 rounded-lg object-contain" />
                            <div className="flex flex-col gap-0.5 leading-none">
                                <span className="font-bold text-sm tracking-tight">Q-SIMUTRON</span>
                                <span className="text-[10px] text-muted-foreground font-semibold tracking-wide">Stop Guessing. Start Simulating.</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Core Modules</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {CORE_MODULES.map(item => {
                                const Icon = item.icon;
                                const active = isActive(item.path);
                                return (
                                    <SidebarMenuItem key={item.path}>
                                        <SidebarMenuButton
                                            tooltip={item.label}
                                            isActive={active}
                                            onClick={() => navigate(item.path)}
                                            className="cursor-pointer"
                                        >
                                            <Icon />
                                            <span>{item.label}</span>
                                        </SidebarMenuButton>
                                        {item.badge && (
                                            <SidebarMenuBadge className="text-[9px] font-bold bg-neon-violet/20 text-neon-violet-bright ring-1 ring-neon-violet/30">
                                                {item.badge}
                                            </SidebarMenuBadge>
                                        )}
                                        {active && <ChevronRight className="ml-auto size-3 opacity-40" />}
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator />

                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {BOTTOM_ITEMS.map(item => {
                                const Icon = item.icon;
                                return (
                                    <SidebarMenuItem key={item.path}>
                                        <SidebarMenuButton
                                            tooltip={item.label}
                                            isActive={isActive(item.path)}
                                            onClick={() => navigate(item.path)}
                                            className="cursor-pointer"
                                        >
                                            <Icon />
                                            <span>{item.label}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarFallback className="rounded-lg bg-gradient-to-br from-neon-violet to-[#7C3AED] text-white text-xs font-bold shadow-[0_0_14px_rgba(139,92,246,0.45)]">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{user?.displayName || 'User'}</span>
                                        <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                                    </div>
                                    <ChevronRight className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-56 rounded-lg"
                                side="top"
                                align="end"
                                sideOffset={4}
                            >
                                <div className="px-2 py-1.5">
                                    <p className="text-sm font-semibold">{user?.displayName || 'User'}</p>
                                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={resetOnboarding} className="cursor-pointer">
                                    <RefreshCw className="mr-2 size-4" />
                                    Reset Business DNA
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={async () => { await logout(); }}
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                    <LogOut className="mr-2 size-4" />
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </ShadcnSidebar>
    );
}
