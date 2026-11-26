import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Activity, RefreshCw, Filter, Search, X, Check, AlertCircle, Info, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { DATA_SOURCES as INITIAL_SOURCES } from '../data/constants';
import type { DataSource } from '../types';
import { useToastStore } from '../store/toastStore';

export default function Data() {
    const [sources, setSources] = useState<DataSource[]>(INITIAL_SOURCES);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'All' | 'Connected' | 'Syncing' | 'Error'>('All');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
    const [showFilterDrop, setShowFilterDrop] = useState(false);

    const addToast = useToastStore((state) => state.addToast);

    // Filtered data
    const filteredSources = useMemo(() => {
        return sources.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.type.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterStatus === 'All' || s.status === filterStatus;
            return matchesSearch && matchesFilter;
        });
    }, [sources, searchQuery, filterStatus]);

    const handleAddSource = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newSource: DataSource = {
            name: formData.get('name') as string,
            type: formData.get('type') as string,
            records: '0',
            status: 'Connected',
            health: 100,
            lastSync: 'Just now',
            region: formData.get('region') as string,
        };
        setSources([newSource, ...sources]);
        setShowAddModal(false);
        addToast('Data source integrated successfully', 'success');
    };

    const handleDeleteSource = (sourceName: string) => {
        setSources(sources.filter(s => s.name !== sourceName));
        setSelectedSource(null);
        addToast(`Source "${sourceName}" archived`, 'info');
    };

    return (
        <div style={{ flex: 1, overflow: 'auto', padding: 40 }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--qs-gray-900)', marginBottom: 6, letterSpacing: '-0.02em' }}>
                        Data Integrations
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--qs-gray-500)' }}>
                        Monitor and manage connected enterprise data platforms and real-time streams.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--qs-gray-400)' }} />
                        <input
                            placeholder="Search sources..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: '6px 12px 6px 32px',
                                fontSize: 13,
                                border: '1px solid var(--qs-gray-200)',
                                borderRadius: 6,
                                width: 200,
                                background: '#fff'
                            }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: 13, gap: 6 }}
                            onClick={() => setShowFilterDrop(!showFilterDrop)}
                        >
                            <Filter size={14} /> {filterStatus === 'All' ? 'Filter' : filterStatus}
                        </button>

                        <AnimatePresence>
                            {showFilterDrop && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="card"
                                    style={{
                                        position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                                        width: 160, zIndex: 100, padding: 4,
                                        boxShadow: 'var(--shadow-lg)'
                                    }}
                                >
                                    {['All', 'Connected', 'Syncing', 'Error'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => { setFilterStatus(status as any); setShowFilterDrop(false); }}
                                            style={{
                                                width: '100%', textAlign: 'left', padding: '8px 12px',
                                                border: 'none', background: filterStatus === status ? 'var(--qs-blue-light)' : 'transparent',
                                                borderRadius: 4, fontSize: 13, cursor: 'pointer',
                                                color: filterStatus === status ? 'var(--qs-blue)' : 'var(--qs-gray-700)'
                                            }}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ padding: '6px 16px', fontSize: 13, borderRadius: 6 }}
                        onClick={() => setShowAddModal(true)}
                    >
                        <Plus size={14} /> Add Source
                    </button>
                </div>
            </div>

            {/* Stats overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                {[
                    { label: 'Connected Sources', value: sources.filter(s => s.status === 'Connected').length.toString(), icon: <Database size={16} />, color: 'var(--qs-blue)' },
                    { label: 'Active Syncs', value: sources.filter(s => s.status === 'Syncing').length.toString(), icon: <RefreshCw size={16} />, color: 'var(--qs-green)' },
                    { label: 'Total Records', value: '112.4M', icon: <Activity size={16} />, color: 'var(--qs-gray-700)' },
                    { label: 'Average Uptime', value: '99.98%', icon: <Activity size={16} />, color: 'var(--qs-blue)' },
                ].map((stat, i) => (
                    <div key={i} className="card card-body" style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--qs-gray-400)', marginBottom: 8 }}>
                            <span style={{ color: stat.color }}>{stat.icon}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--qs-gray-900)' }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Grid of sources */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {filteredSources.map((ds) => (
                    <motion.div
                        key={ds.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card card-body"
                        whileHover={{ y: -4, boxShadow: 'var(--shadow-xl)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--qs-gray-900)', margin: 0 }}>{ds.name}</h3>
                                <span style={{ fontSize: 12, color: 'var(--qs-gray-400)' }}>{ds.type}</span>
                            </div>
                            <span className={`badge ${ds.status === 'Connected' ? 'badge-success' : ds.status === 'Syncing' ? 'badge-info' : 'badge-warning'}`}>
                                {ds.status}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <span style={{ fontSize: 12, color: 'var(--qs-gray-500)' }}>Sync Health</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: ds.health > 95 ? 'var(--qs-green-dark)' : 'var(--qs-yellow-dark)' }}>
                                    {ds.health}%
                                </span>
                            </div>
                            <div className="health-bar">
                                <div
                                    className="health-bar-fill"
                                    style={{
                                        width: `${ds.health}%`,
                                        background: ds.health > 95 ? 'var(--qs-green)' : 'var(--qs-yellow)'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                                <div>
                                    <div style={{ fontSize: 10, color: 'var(--qs-gray-400)', fontWeight: 600, textTransform: 'uppercase' }}>Records</div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--qs-gray-900)' }}>{ds.records}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 10, color: 'var(--qs-gray-400)', fontWeight: 600, textTransform: 'uppercase' }}>Last Sync</div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--qs-gray-900)' }}>{ds.lastSync}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--qs-gray-50)', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 11, color: 'var(--qs-gray-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                Region: <span style={{ color: 'var(--qs-gray-700)', fontWeight: 600 }}>{ds.region}</span>
                            </span>
                            <button
                                className="btn-ghost"
                                style={{ fontSize: 11, padding: '3px 8px' }}
                                onClick={() => setSelectedSource(ds)}
                            >
                                Manage
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Empty State */}
            {filteredSources.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--qs-gray-500)' }}>
                    <Database size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                    <p>No data sources match your search or filter.</p>
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {/* Add Source Modal */}
                {showAddModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="card"
                            style={{ width: '100%', maxWidth: 450, padding: 32, position: 'relative' }}
                        >
                            <button
                                onClick={() => setShowAddModal(false)}
                                style={{ position: 'absolute', right: 20, top: 20, background: 'none', border: 'none', color: 'var(--qs-gray-400)', cursor: 'pointer' }}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Add New Data Source</h3>
                            <p style={{ fontSize: 14, color: 'var(--qs-gray-500)', marginBottom: 24 }}>Connect a new enterprise platform to the Qsimutron network.</p>

                            <form onSubmit={handleAddSource} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--qs-gray-600)' }}>SOURCE NAME</label>
                                    <input name="name" required placeholder="e.g. Oracle Production" className="input-modern" style={{ width: '100%', padding: '10px 12px' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--qs-gray-600)' }}>TYPE</label>
                                        <select
                                            name="type"
                                            className="input-modern"
                                            style={{ width: '100%', padding: '10px 12px' }}
                                            aria-label="Source Type"
                                        >
                                            <option>SQL Database</option>
                                            <option>Warehouse</option>
                                            <option>Cloud Storage</option>
                                            <option>Streaming</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--qs-gray-600)' }}>REGION</label>
                                        <input name="region" required placeholder="US-East" className="input-modern" style={{ width: '100%', padding: '10px 12px' }} />
                                    </div>
                                </div>
                                <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                                    <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Connect Source</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Manage Source Modal */}
                {selectedSource && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="card"
                            style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                        >
                            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--qs-gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--qs-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--qs-blue)' }}>
                                        <Database size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selectedSource.name}</h3>
                                        <span style={{ fontSize: 12, color: 'var(--qs-gray-500)' }}>{selectedSource.type} • {selectedSource.region}</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedSource(null)} style={{ background: 'none', border: 'none', color: 'var(--qs-gray-400)', cursor: 'pointer' }} aria-label="Close">
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ flex: 1, padding: 32, overflow: 'auto' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                                    <div style={{ padding: 16, background: 'var(--qs-gray-50)', borderRadius: 12 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--qs-gray-400)', textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                                            <Check size={14} color="var(--qs-green)" /> {selectedSource.status}
                                        </div>
                                    </div>
                                    <div style={{ padding: 16, background: 'var(--qs-gray-50)', borderRadius: 12 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--qs-gray-400)', textTransform: 'uppercase', marginBottom: 4 }}>Health</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                                            <Activity size={14} color="var(--qs-blue)" /> {selectedSource.health}% Uptime
                                        </div>
                                    </div>
                                    <div style={{ padding: 16, background: 'var(--qs-gray-50)', borderRadius: 12 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--qs-gray-400)', textTransform: 'uppercase', marginBottom: 4 }}>Sync Frequency</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                                            <RefreshCw size={14} color="var(--qs-gray-500)" /> 5 Minutes
                                        </div>
                                    </div>
                                </div>

                                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Info size={16} color="var(--qs-blue)" /> Detailed Integration Analysis
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {[
                                        { label: 'Schema Consistency', val: '99.9%', status: 'optimal' },
                                        { label: 'Ingestion Latency', val: '124ms', status: 'optimal' },
                                        { label: 'Data Quality Score', val: 'High', status: 'optimal' },
                                        { label: 'API Rate Limits', val: '12% used', status: 'warning' },
                                    ].map((m, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--qs-gray-50)' }}>
                                            <span style={{ color: 'var(--qs-gray-600)', fontSize: 14 }}>{m.label}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontWeight: 600, fontSize: 14 }}>{m.val}</span>
                                                {m.status === 'optimal' ? <Check size={14} color="var(--qs-green)" /> : <AlertCircle size={14} color="var(--qs-yellow)" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: 32, padding: 20, background: 'var(--qs-blue-light)', borderRadius: 12, border: '1px solid var(--qs-blue-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'var(--qs-blue-hover)', marginBottom: 4 }}>Auto-Discovery Enabled</div>
                                            <p style={{ fontSize: 13, color: 'var(--qs-blue)', margin: 0, opacity: 0.8 }}>Qsimutron is automatically mapping 14 new objects from this source.</p>
                                        </div>
                                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>View Mapping</button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '20px 32px', borderTop: '1px solid var(--qs-gray-100)', display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--qs-gray-50)' }}>
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: '8px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--qs-red)' }}
                                    onClick={() => handleDeleteSource(selectedSource.name)}
                                >
                                    <Trash2 size={14} /> Archive Source
                                </button>
                                <button className="btn btn-secondary" style={{ padding: '8px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <ExternalLink size={14} /> Open Object Explorer
                                </button>
                                <button onClick={() => setSelectedSource(null)} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>Done</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
