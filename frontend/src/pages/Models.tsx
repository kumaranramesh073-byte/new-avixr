import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target, TrendingUp, ShieldAlert, FlaskConical, MoreHorizontal,
    ExternalLink, X, Plus, Info, GitBranch, Share2,
    ArrowRight, Activity, Zap, CheckCircle2, AlertTriangle, Settings2,
    Database, RefreshCw, Trash2, Edit3
} from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { MODELS as INITIAL_MODELS } from '../data/constants';
import type { MLModel } from '../types';

export default function Models() {
    const [models, setModels] = useState<MLModel[]>(INITIAL_MODELS);
    const [showDeployModal, setShowDeployModal] = useState(false);
    const [showLineageModal, setShowLineageModal] = useState(false);
    const [showDriftModal, setShowDriftModal] = useState(false);
    const [activeRow, setActiveRow] = useState<number | null>(null);
    const addToast = useToastStore((state) => state.addToast);

    const handleDeploy = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newModel: MLModel = {
            name: formData.get('name') as string,
            type: formData.get('type') as string,
            accuracy: '98.2%',
            lastTrained: '2025-02-26',
            status: 'Staging',
            framework: formData.get('framework') as string,
            version: 'v1.0.0',
            predictions: '0'
        };
        setModels([newModel, ...models]);
        setShowDeployModal(false);
        addToast('Model deployed successfully!', 'success');
    };

    return (
        <div style={{ flex: 1, overflow: 'auto', padding: 40 }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--qs-gray-900)', marginBottom: 6, letterSpacing: '-0.02em' }}>
                        Machine Learning Models
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--qs-gray-500)' }}>
                        Unified registry for predictive analytics, optimization, and generative models.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 16px', fontSize: 13, borderRadius: 6, gap: 8 }}
                        onClick={() => setShowLineageModal(true)}
                    >
                        <GitBranch size={14} /> Model Lineage
                    </button>
                    <button
                        className="btn btn-primary"
                        style={{ padding: '6px 16px', fontSize: 13, borderRadius: 6, gap: 8 }}
                        onClick={() => setShowDeployModal(true)}
                    >
                        <Plus size={14} /> Deploy New Model
                    </button>
                </div>
            </div>

            {/* Registry Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                style={{ overflow: 'visible' }}
            >
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ paddingLeft: 24 }}>MODEL NAME</th>
                            <th>TYPE</th>
                            <th>ACCURACY</th>
                            <th>FRAMEWORK</th>
                            <th>LAST TRAINED</th>
                            <th>PREDICTIONS</th>
                            <th>STATUS</th>
                            <th style={{ width: 48 }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {models.map((m, i) => (
                            <tr key={m.name}>
                                <td style={{ paddingLeft: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 6,
                                            background: m.status === 'Production' ? 'var(--qs-blue-light)' : 'var(--qs-gray-100)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: m.status === 'Production' ? 'var(--qs-blue)' : 'var(--qs-gray-400)'
                                        }}>
                                            {m.type === 'Classification' ? <Target size={18} /> :
                                                m.type === 'Time Series' ? <TrendingUp size={18} /> :
                                                    m.type === 'Optimization' ? <Zap size={18} /> :
                                                        <ShieldAlert size={18} />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{m.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--qs-gray-400)' }}>{m.version}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ color: 'var(--qs-gray-600)' }}>{m.type}</td>
                                <td>
                                    <span style={{ fontWeight: 700, color: 'var(--qs-gray-900)' }}>{m.accuracy}</span>
                                </td>
                                <td style={{ fontSize: 12, color: 'var(--qs-gray-500)' }}>{m.framework}</td>
                                <td style={{ color: 'var(--qs-gray-500)' }}>{m.lastTrained}</td>
                                <td style={{ fontWeight: 500 }}>{m.predictions}</td>
                                <td>
                                    <span className={`badge ${m.status === 'Production' ? 'badge-info' : 'badge-default'}`}>
                                        {m.status}
                                    </span>
                                </td>
                                <td style={{ position: 'relative' }}>
                                    <button
                                        className="btn-ghost"
                                        style={{ border: 'none' }}
                                        aria-label="More options"
                                        onClick={() => setActiveRow(activeRow === i ? null : i)}
                                    >
                                        <MoreHorizontal size={18} />
                                    </button>

                                    <AnimatePresence>
                                        {activeRow === i && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                className="card"
                                                style={{
                                                    position: 'absolute', right: 40, top: 0, width: 180,
                                                    zIndex: 100, padding: 6, boxShadow: 'var(--shadow-lg)'
                                                }}
                                            >
                                                <button className="dropdown-item" onClick={() => { addToast(`Retraining initiated for ${m.name}`, 'info'); setActiveRow(null); }}>
                                                    <RefreshCw size={14} style={{ marginRight: 8 }} /> Retrain Model
                                                </button>
                                                <button className="dropdown-item" onClick={() => { addToast('Metrics refreshed', 'success'); setActiveRow(null); }}>
                                                    <Activity size={14} style={{ marginRight: 8 }} /> View Metrics
                                                </button>
                                                <button className="dropdown-item" onClick={() => { addToast(`Configuring ${m.name}`, 'info'); setActiveRow(null); }}>
                                                    <Edit3 size={14} style={{ marginRight: 8 }} /> Configure
                                                </button>
                                                <div style={{ borderTop: '1px solid var(--qs-gray-100)' }}>
                                                    <button className="dropdown-item" style={{ color: 'var(--qs-red)' }} onClick={() => { addToast(`Model ${m.name} archived`, 'warning'); setActiveRow(null); }}>
                                                        <Trash2 size={14} style={{ marginRight: 8 }} /> Delete
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>

            {/* Model Monitoring Section */}
            <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div className="card card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Model Drift Monitor</h3>
                        <button
                            className="btn-ghost"
                            style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={() => setShowDriftModal(true)}
                        >
                            View Analysis <ExternalLink size={12} />
                        </button>
                    </div>
                    <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                        {[30, 45, 25, 60, 80, 55, 40, 70, 90, 85, 95, 88].map((h, i) => (
                            <div key={i} style={{ flex: 1, position: 'relative' }}>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ delay: i * 0.05, duration: 1 }}
                                    style={{
                                        background: i === 10 ? 'var(--qs-red)' : 'var(--qs-blue)',
                                        opacity: i === 10 ? 1 : 0.6,
                                        borderRadius: '2px 2px 0 0'
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--qs-gray-400)', marginTop: 12 }}>
                        Statistical drift detected in <span style={{ color: 'var(--qs-red)', fontWeight: 600 }}>Fraud Detection v5.1</span> features. Re-training recommended.
                    </p>
                </div>

                <div className="card card-body">
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Inference Performance</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[
                            { label: 'p99 Latency', value: '42ms', change: '-5%', trend: 'good' },
                            { label: 'Throughput', value: '1,240 req/s', change: '+12%', trend: 'good' },
                            { label: 'Error Rate', value: '0.04%', change: '+0.01%', trend: 'bad' },
                        ].map((metric, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--qs-gray-600)' }}>{metric.label}</span>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--qs-gray-900)' }}>{metric.value}</div>
                                    <div style={{ fontSize: 11, color: metric.trend === 'good' ? 'var(--qs-green)' : 'var(--qs-red)' }}>
                                        {metric.change} vs. last 24h
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {/* Deploy Modal */}
                {showDeployModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="card"
                            style={{ width: '100%', maxWidth: 500, padding: 32, position: 'relative' }}
                        >
                            <button
                                onClick={() => setShowDeployModal(false)}
                                style={{ position: 'absolute', right: 20, top: 20, background: 'none', border: 'none', color: 'var(--qs-gray-400)', cursor: 'pointer' }}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Deploy Enterprise Model</h3>
                            <p style={{ fontSize: 14, color: 'var(--qs-gray-500)', marginBottom: 24 }}>Push a new ML model to the production Qsimutron Inference Engine.</p>

                            <form onSubmit={handleDeploy} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--qs-gray-600)' }}>MODEL NAME</label>
                                    <input name="name" required placeholder="e.g. Yield Optimizer v4" className="input-modern" style={{ width: '100%', padding: '10px 12px' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--qs-gray-600)' }}>TYPE</label>
                                        <select
                                            name="type"
                                            className="input-modern"
                                            style={{ width: '100%', padding: '10px 12px' }}
                                            aria-label="Model Type"
                                        >
                                            <option>Classification</option>
                                            <option>Time Series</option>
                                            <option>Optimization</option>
                                            <option>Generative</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--qs-gray-600)' }}>FRAMEWORK</label>
                                        <select
                                            name="framework"
                                            className="input-modern"
                                            style={{ width: '100%', padding: '10px 12px' }}
                                            aria-label="Framework"
                                        >
                                            <option>Scikit-learn</option>
                                            <option>PyTorch</option>
                                            <option>TensorFlow</option>
                                            <option>XGBoost</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ background: 'var(--qs-blue-light)', padding: 16, borderRadius: 12, border: '1px solid var(--qs-blue-border)' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <Info size={16} color="var(--qs-blue)" style={{ flexShrink: 0, marginTop: 2 }} />
                                        <p style={{ fontSize: 12, color: 'var(--qs-blue)', margin: 0 }}>
                                            Models will be automatically wrapped in Qsimutron Type System and exposed via Unified Analytics API.
                                        </p>
                                    </div>
                                </div>
                                <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                                    <button type="button" onClick={() => setShowDeployModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Deploy to Production</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Lineage Modal */}
                {showLineageModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="card"
                            style={{ width: '90%', maxWidth: 1000, padding: 0, overflow: 'hidden' }}
                        >
                            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--qs-gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Model Lineage & Provenance</h3>
                                    <p style={{ fontSize: 13, color: 'var(--qs-gray-500)', margin: 0 }}>Tracing data origin through Qsimutron Data Fabric to production inference.</p>
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12, gap: 6 }}><Share2 size={14} /> Export</button>
                                    <button onClick={() => setShowLineageModal(false)} className="btn-ghost" aria-label="Close" title="Close"><X size={24} /></button>
                                </div>
                            </div>

                            <div style={{ padding: 40, background: 'var(--qs-gray-50)', position: 'relative', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                                {/* Fake Lineage Diagram */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                    <div style={{ padding: 16, background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow-md)', border: '2px solid var(--qs-blue)', width: 140, textAlign: 'center' }}>
                                        <Database size={24} color="var(--qs-blue)" style={{ marginBottom: 8 }} />
                                        <div style={{ fontSize: 13, fontWeight: 700 }}>Snowflake</div>
                                        <div style={{ fontSize: 11, color: 'var(--qs-gray-400)' }}>Data Source</div>
                                    </div>
                                    <div style={{ padding: 16, background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow-md)', border: '2px solid var(--qs-green)', width: 140, textAlign: 'center' }}>
                                        <Zap size={24} color="var(--qs-green)" style={{ marginBottom: 8 }} />
                                        <div style={{ fontSize: 13, fontWeight: 700 }}>Azure Kafka</div>
                                        <div style={{ fontSize: 11, color: 'var(--qs-gray-400)' }}>Stream Source</div>
                                    </div>
                                </div>

                                <ArrowRight size={24} color="var(--qs-gray-300)" />

                                <div style={{ padding: 24, background: 'var(--qs-blue-light)', borderRadius: 16, border: '2px solid var(--qs-blue)', width: 220, textAlign: 'center' }}>
                                    <FlaskConical size={32} color="var(--qs-blue)" style={{ marginBottom: 12 }} />
                                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--qs-blue-hover)' }}>Qsimutron Data Fabric</div>
                                    <div style={{ fontSize: 12, color: 'var(--qs-blue)', opacity: 0.8 }}>Unified Semantic Layer</div>
                                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
                                        <div className="badge badge-info" style={{ fontSize: 9 }}>Transform</div>
                                        <div className="badge badge-info" style={{ fontSize: 9 }}>Cleanse</div>
                                    </div>
                                </div>

                                <ArrowRight size={24} color="var(--qs-gray-300)" />

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                                    <div style={{ padding: 20, background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow-lg)', border: '2px solid var(--qs-gray-900)', width: 240 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <Target size={24} />
                                            <span className="badge badge-success">v3.2</span>
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 700 }}>Reliability Model</div>
                                        <div style={{ fontSize: 11, color: 'var(--qs-green-dark)', fontWeight: 600, marginTop: 4 }}>Deployed: 15 Jan 2025</div>
                                        <div style={{ marginTop: 12, height: 4, width: '100%', background: 'var(--qs-gray-100)', borderRadius: 2 }}>
                                            <div style={{ height: '100%', width: '94%', background: 'var(--qs-green)', borderRadius: 2 }} />
                                        </div>
                                        <div style={{ fontSize: 10, textAlign: 'right', marginTop: 4, color: 'var(--qs-gray-400)' }}>94.7% F1 Score</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '20px 32px', borderTop: '1px solid var(--qs-gray-100)', display: 'flex', justifyContent: 'flex-end', background: 'var(--qs-gray-50)' }}>
                                <button onClick={() => setShowLineageModal(false)} className="btn btn-primary">Close Lineage View</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Drift Modal */}
                {showDriftModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="card"
                            style={{ width: '100%', maxWidth: 650, padding: 32 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--qs-red)', marginBottom: 8 }}>
                                        <AlertTriangle size={24} />
                                        <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Drift Analysis: Fraud Detection v5.1</h3>
                                    </div>
                                    <p style={{ fontSize: 14, color: 'var(--qs-gray-500)', margin: 0 }}>Performance drop detected. Comparison: Training Distribution vs. Live Inference.</p>
                                </div>
                                <button onClick={() => setShowDriftModal(false)} style={{ background: 'none', border: 'none', color: 'var(--qs-gray-400)', cursor: 'pointer' }} aria-label="Close">
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                                <div style={{ padding: 20, background: 'var(--qs-gray-50)', borderRadius: 12 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--qs-gray-400)', textTransform: 'uppercase', marginBottom: 12 }}>Feature Drift Scores (PSI)</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {[
                                            { f: 'transaction_amt', s: 0.42, status: 'critical' },
                                            { f: 'user_location_id', s: 0.15, status: 'moderate' },
                                            { f: 'merchant_category', s: 0.08, status: 'good' },
                                        ].map((item, id) => (
                                            <div key={id}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                                    <span style={{ fontWeight: 600 }}>{item.f}</span>
                                                    <span style={{ color: item.status === 'critical' ? 'var(--qs-red)' : 'var(--qs-gray-500)' }}>{item.s} PSI</span>
                                                </div>
                                                <div style={{ height: 4, width: '100%', background: 'var(--qs-gray-200)', borderRadius: 2 }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${item.s * 200}%`,
                                                        background: item.status === 'critical' ? 'var(--qs-red)' : 'var(--qs-blue)',
                                                        borderRadius: 2
                                                    }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ border: '1px solid var(--qs-gray-100)', borderRadius: 12, padding: 20 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--qs-gray-400)', textTransform: 'uppercase', marginBottom: 12 }}>Recommended Actions</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--qs-gray-700)' }}>
                                            <RefreshCw size={14} color="var(--qs-blue)" /> Trigger Incremental Retraining
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--qs-gray-700)' }}>
                                            <Settings2 size={14} color="var(--qs-gray-400)" /> Update Pre-processing Pipeline
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--qs-gray-700)' }}>
                                            <CheckCircle2 size={14} color="var(--qs-green)" /> Promote Staging Candidate
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => setShowDriftModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Dismiss</button>
                                <button className="btn btn-primary" style={{ flex: 1, gap: 8 }}><TrendingUp size={16} /> Retrain Now</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
