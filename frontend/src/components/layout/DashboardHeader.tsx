import React from 'react';
import { ChevronRight } from 'lucide-react';
import SearchBar from '../shared/SearchBar';

interface DashboardHeaderProps {
    title: React.ReactNode;
    breadcrumbs: string[];
    meta: { label: string; value: string; color?: string }[];
    onSearch: (query: string) => void;
    placeholder?: string;
}

export default function DashboardHeader({
    title,
    breadcrumbs,
    meta,
    onSearch,
    placeholder = "Ask Agent..."
}: DashboardHeaderProps) {
    return (
        <div className="agent-dash-header-detailed" style={{ padding: '24px 28px 20px', background: 'transparent', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--qs-gray-500)', marginBottom: 12 }}>
                <span>Dashboards</span>
                {breadcrumbs.map((crumb, i) => (
                    <React.Fragment key={i}>
                        <ChevronRight size={12} />
                        <span style={i === breadcrumbs.length - 1 ? { color: 'var(--qs-blue)', fontWeight: 600 } : {}}>{crumb}</span>
                    </React.Fragment>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
                        {title}
                    </h1>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13 }}>
                        {meta.map((item, i) => (
                            <span key={i} style={{ color: 'var(--qs-gray-500)' }}>
                                {item.label}: <strong style={{ color: item.color || 'var(--qs-gray-900)' }}>{item.value}</strong>
                            </span>
                        ))}
                    </div>
                </div>
                <div style={{ width: 400 }}>
                    <SearchBar onSubmit={onSearch} placeholder={placeholder} />
                </div>
            </div>
        </div>
    );
}
