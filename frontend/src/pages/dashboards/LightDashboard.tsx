import React, { useState, useEffect } from 'react';
import '../../styles/light-dashboard.css';

// --- Types ---

interface Action {
  id: string;
  title: string;
  meta: string;
  priority: string;
  steps: string[];
  status: 'idle' | 'running' | 'done';
  isOpen: boolean;
  activeStep: number;
}

interface Connector {
  id: string;
  name: string;
  category: string;
  icon: string | React.ReactNode;
  connected: boolean;
  bg: string;
}

interface Metric {
  label: string;
  val: string | number;
  chg: string;
  color: string;
  icon: React.ReactNode;
}

interface ViewConfig {
  title: string;
  metrics: Metric[];
  actions: Action[];
}

// --- Data ---

const INITIAL_CONNECTORS: Connector[] = [
  { id: 'gmail', name: 'Gmail', category: 'Productivity', icon: '📬', connected: true, bg: '#e8f5e9' },
  { id: 'gdrive', name: 'Google Drive', category: 'Productivity', icon: '📁', connected: true, bg: '#e3f2fd' },
  { id: 'slack', name: 'Slack', category: 'Productivity', icon: '💬', connected: true, bg: '#ede9fe' },
  { id: 'gcal', name: 'Google Cal', category: 'Productivity', icon: '📅', connected: true, bg: '#fef3c7' },
  { id: 'notion', name: 'Notion', category: 'Productivity', icon: '📝', connected: true, bg: '#f5f5f4' },
  { id: 'm365', name: 'Microsoft 365', category: 'Productivity', icon: '🏢', connected: true, bg: '#e0f2fe' },
  { id: 'jira', name: 'Jira', category: 'Project Management', icon: '🔷', connected: true, bg: '#ede9fe' },
  { id: 'asana', name: 'Asana', category: 'Project Management', icon: '🅰', connected: true, bg: '#fce4ec' },
  { id: 'linear', name: 'Linear', category: 'Project Management', icon: '⚡', connected: true, bg: '#fef9c3' },
  { id: 'monday', name: 'Monday.com', category: 'Project Management', icon: '🗂️', connected: true, bg: '#fff7ed' },
  { id: 'clickup', name: 'ClickUp', category: 'Project Management', icon: '🔵', connected: true, bg: '#eff6ff' },
  { id: 'salesforce', name: 'Salesforce', category: 'CRM & Sales', icon: '☁️', connected: true, bg: '#e0f2fe' },
  { id: 'hubspot', name: 'HubSpot', category: 'CRM & Sales', icon: '🟠', connected: true, bg: '#fff7ed' },
  { id: 'dynamics', name: 'Dynamics 365', category: 'CRM & Sales', icon: '💼', connected: true, bg: '#ede9fe' },
  { id: 'intercom', name: 'Intercom', category: 'CRM & Sales', icon: '💬', connected: false, bg: '#e8f5e9' },
  { id: 'snowflake', name: 'Snowflake', category: 'Data & Analytics', icon: '❄️', connected: true, bg: '#e0f2fe' },
  { id: 'github', name: 'GitHub', category: 'Developer & DevOps', icon: '🐙', connected: true, bg: '#f4f4f5' },
];

const VIEW_CONFIGS: Record<string, ViewConfig> = {
  home: {
    title: 'Overview',
    metrics: [
      { label: 'Active Connectors', val: 14, chg: '↑ +3 this week', color: 'var(--blue)', icon: <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg> },
      { label: 'Critical Alerts', val: 3, chg: '↓ 2 unresolved', color: 'var(--red)', icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
      { label: 'Autonomous Actions', val: 7, chg: '↑ 4 completed today', color: 'var(--green)', icon: <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
    ],
    actions: [
      { id: 'ai-1', title: 'Emergency turbine inspection order', meta: 'Reliability · Auto-assignable · ~2 min', priority: 'p-crit', steps: ['Identify turbine', 'Check schedule', 'Create work order', 'Notify engineer', 'Order parts'], status: 'idle', isOpen: false, activeStep: -1 },
      { id: 'ai-2', title: 'Reroute supply chain — Region 2', meta: 'Inventory · Multi-agent · ~5 min', priority: 'p-crit', steps: ['Analyze delay', 'Find suppliers', 'Gen POs', 'Notify team', 'Update SF'], status: 'idle', isOpen: false, activeStep: -1 },
      { id: 'ai-3', title: 'Churn-risk outreach campaign', meta: 'Salesforce · Research · ~4 min', priority: 'p-high', steps: ['Pull accounts', 'Research history', 'Draft email', 'Log in SF'], status: 'idle', isOpen: false, activeStep: -1 },
      { id: 'ai-4', title: 'Weekly ops summary report', meta: 'Multi-agent · Research · ~8 min', priority: 'p-high', steps: ['Aggregate data', 'Compile KPIs', 'Gen report', 'Post Slack'], status: 'idle', isOpen: false, activeStep: -1 },
      { id: 'ai-5', title: 'Inventory rebalance — Q2 schedule', meta: 'Inventory · Forecast · ~6 min', priority: 'p-med', steps: ['Analyze Q2 schedule', 'Forecast demand', 'Rebalance ERP', 'Update Notion'], status: 'idle', isOpen: false, activeStep: -1 },
      { id: 'ai-6', title: 'Resume screening — engineering roles', meta: 'Resume · Research · ~3 min', priority: 'p-med', steps: ['Pull resumes', 'Score criteria', 'Shortlist top', 'Create Asana'], status: 'idle', isOpen: false, activeStep: -1 },
    ],
  },
  reliability: {
    title: 'Reliability Center',
    metrics: [
      { label: 'MTBF (Avg)', val: '412h', chg: '↑ +12% improvement', color: 'var(--green)', icon: <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
      { label: 'Active Risks', val: 5, chg: '↓ 1 mitigated', color: 'var(--amber)', icon: <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg> },
      { label: 'Uptime Score', val: '99.94%', chg: '→ stable', color: 'var(--blue)', icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg> },
    ],
    actions: [
      { id: 'rel-1', title: 'Compressor #4 vibration analysis', meta: 'Vibration · Auto-collect · ~1 min', priority: 'p-high', steps: ['Collect sensor logs', 'Run FFT analysis', 'Identify peaks', 'Generate report'], status: 'idle', isOpen: false, activeStep: -1 },
      { id: 'rel-2', title: 'Predictive maintenance dispatch', meta: 'ServiceNow · Auto · ~2 min', priority: 'p-med', steps: ['Identify asset', 'Check parts', 'Assign tech', 'Confirm'], status: 'idle', isOpen: false, activeStep: -1 },
    ],
  },
  process: {
    title: 'Process Intelligence',
    metrics: [
      { label: 'Throughput', val: '8.4k', chg: '↑ +4% throughput', color: 'var(--green)', icon: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
      { label: 'Cycle Time', val: '14.2m', chg: '↓ -2m faster', color: 'var(--blue)', icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
      { label: 'Quality Score', val: '99.1%', chg: '↑ +0.3% yield', color: 'var(--green)', icon: <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> },
    ],
    actions: [
      { id: 'prc-1', title: 'Batch optimization — Line 4', meta: 'SAP · Auto-config · ~5 min', priority: 'p-high', steps: ['Read batch logs', 'Calculate optimum', 'Update SAP', 'Confirm line start'], status: 'idle', isOpen: false, activeStep: -1 },
    ],
  },
  inventory: {
    title: 'Inventory Ops',
    metrics: [
      { label: 'Stock Value', val: '$4.2M', chg: '↑ +8% reorder', color: 'var(--blue)', icon: <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
      { label: 'Turnover Rate', val: '3.4x', chg: '↑ +0.2x speed', color: 'var(--green)', icon: <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> },
      { label: 'Low Stock SKU', val: 18, chg: '↑ 5 critical', color: 'var(--red)', icon: <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    ],
    actions: [
      { id: 'inv-1', title: 'Emergency Restock — Electronics', meta: 'ERP · Purchase · ~3 min', priority: 'p-crit', steps: ['Scan inventory', 'Request vendor quote', 'Approve PO', 'Track shipment'], status: 'idle', isOpen: false, activeStep: -1 },
    ],
  },
  forecast: {
    title: 'Demand Forecast',
    metrics: [
      { label: 'Forecast Accuracy', val: '94.2%', chg: '↑ +2.1% accuracy', color: 'var(--green)', icon: <svg viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></svg> },
      { label: 'Projected Sales', val: '$1.8M', chg: '↑ +15% Q3 est', color: 'var(--blue)', icon: <svg viewBox="0 0 24 24"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg> },
      { label: 'Market Volatility', val: 'Low', chg: '↓ -12% stable', color: 'var(--green)', icon: <svg viewBox="0 0 24 24"><path d="M23 6l-9.5 9.5-5-5L1 18"/></svg> },
    ],
    actions: [
      { id: 'frc-1', title: 'Q4 Budget Realignment', meta: 'Finance · Strategy · ~10 min', priority: 'p-med', steps: ['Pull Q3 actuals', 'Run Q4 simul', 'Allocate funds', 'Notify stakeholders'], status: 'idle', isOpen: false, activeStep: -1 },
    ],
  },
  resume: {
    title: 'Talent Acquisition',
    metrics: [
      { label: 'Active Roles', val: 12, chg: '→ no change', color: 'var(--blue)', icon: <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
      { label: 'Resumes Screened', val: 412, chg: '↑ +84 today', color: 'var(--green)', icon: <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
      { label: 'Offer Acceptance', val: '88%', chg: '↑ +5% rate', color: 'var(--green)', icon: <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> },
    ],
    actions: [
      { id: 'res-1', title: 'Bulk Screen — AI Engineers', meta: 'Resume · Auto-score · ~2 min', priority: 'p-high', steps: ['Read PDFs', 'Extract skills', 'Match keywords', 'Score & Rank'], status: 'idle', isOpen: false, activeStep: -1 },
    ],
  },
  research: {
    title: 'Market Research',
    metrics: [
      { label: 'Insight Tokens', val: '1.2M', chg: '↑ +200k fetched', color: 'var(--blue)', icon: <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
      { label: 'Top Trends', val: 8, chg: '↑ 3 new trends', color: 'var(--amber)', icon: <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
      { label: 'Sources Tracked', val: 142, chg: '↑ +12 sources', color: 'var(--green)', icon: <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
    ],
    actions: [
      { id: 'rsr-1', title: 'Competitor Asset Audit', meta: 'Web · Research · ~6 min', priority: 'p-med', steps: ['Identify comps', 'Audit PR logs', 'Analyze filings', 'Synthesize'], status: 'idle', isOpen: false, activeStep: -1 },
    ],
  },
};

const LightDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState('home');
  const [connectors, setConnectors] = useState<Connector[]>(INITIAL_CONNECTORS);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewState, setViewState] = useState(VIEW_CONFIGS);
  const [lastUpdated, setLastUpdated] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionsCompletedCount, setActionsCompletedCount] = useState(0);

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  const config = viewState[activeView] || viewState.home;
  const connectedCount = connectors.filter(c => c.connected).length;

  const toggleConnector = (id: string) => {
    setConnectors(prev => prev.map(c => (c.id === id ? { ...c, connected: !c.connected } : c)));
  };

  const toggleAction = (id: string) => {
    setViewState(prev => ({
      ...prev,
      [activeView]: {
        ...prev[activeView],
        actions: prev[activeView].actions.map(a => (a.id === id ? { ...a, isOpen: !a.isOpen } : a)),
      },
    }));
  };

  const runAction = (id: string) => {
    setViewState(prev => ({
      ...prev,
      [activeView]: {
        ...prev[activeView],
        actions: prev[activeView].actions.map(a => (a.id === id ? { ...a, status: 'running', isOpen: true, activeStep: 0 } : a)),
      },
    }));
    
    let step = 0;
    const action = config.actions.find(a => a.id === id);
    if (!action) return;

    const interval = setInterval(() => {
      setViewState(prev => ({
        ...prev,
        [activeView]: {
          ...prev[activeView],
          actions: prev[activeView].actions.map(a => {
            if (a.id === id) {
              if (step < a.steps.length) {
                return { ...a, activeStep: step + 1 };
              } else {
                clearInterval(interval);
                setActionsCompletedCount(c => c + 1);
                return { ...a, status: 'done' };
              }
            }
            return a;
          }),
        },
      }));
      step++;
    }, 650);
  };

  const runAllActions = () => {
    let delay = 0;
    config.actions.forEach(a => {
      if (a.status === 'idle') {
        setTimeout(() => runAction(a.id), delay);
        delay += 900;
      }
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1200);
  };

  const categories = Array.from(new Set(connectors.map(c => c.category)));

  return (
    <div className="shell">
      <nav className="sidebar">
        <div className="logo-wrap">
          <img className="logo-img" src="/logo.jpeg" alt="Logo" />
          <span className="logo-label" style={{background:'var(--brand-grad)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>QSim</span>
        </div>
        <button className={`nav-item ${activeView === 'home' ? 'active' : ''}`} onClick={() => setActiveView('home')}><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span className="nav-lbl">Home</span></button>
        <div className="nav-section-dot"></div>
        <button className={`nav-item ${activeView === 'reliability' ? 'active' : ''}`} onClick={() => setActiveView('reliability')}><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span className="nav-lbl">Relblty</span></button>
        <button className={`nav-item ${activeView === 'process' ? 'active' : ''}`} onClick={() => setActiveView('process')}><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg><span className="nav-lbl">Process</span></button>
        <button className={`nav-item ${activeView === 'inventory' ? 'active' : ''}`} onClick={() => setActiveView('inventory')}><svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg><span className="nav-lbl">Invntry</span></button>
        <button className={`nav-item ${activeView === 'forecast' ? 'active' : ''}`} onClick={() => setActiveView('forecast')}><svg viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg><span className="nav-lbl">Frcst</span></button>
        <button className={`nav-item ${activeView === 'resume' ? 'active' : ''}`} onClick={() => setActiveView('resume')}><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span className="nav-lbl">Resume</span></button>
        <button className={`nav-item ${activeView === 'research' ? 'active' : ''}`} onClick={() => setActiveView('research')}><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span className="nav-lbl">Rsrch</span></button>
        <div className="nav-spacer"></div>
        <button className="nav-item"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span className="nav-lbl">Help</span></button>
      </nav>

      <div className="main">
        <header className="topbar">
          <div className="brand">
            <img className="brand-logo" src="/logo.jpeg" alt="Logo" />
            <div className="brand-text"><div className="brand-name">Q Simutron</div><div className="brand-sub">{config.title} Command</div></div>
          </div>
          <div className="topbar-right">
            <button className="t-btn"><svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></button>
            <div className="env-chip"><span className="env-dot"></span>Simulation Demo</div>
            <button className="avatar">QS</button>
          </div>
        </header>

        <main className="content">
          <div style={{ marginBottom: 10, padding: '6px 12px', borderRadius: 6, background: '#fefce8', border: '1px solid #fde047', color: '#854d0e', fontSize: 11.5, fontWeight: 600 }}>
            SIMULATION / DEMO DATA — Metrics and connector states below are illustrative sample fixtures, not live production readings.
          </div>
          <div className="page-hd"><h1 className="page-title">{config.title}</h1><span className="page-time">Updated {lastUpdated}</span></div>

          <div className="metrics">
            {config.metrics.map((m, i) => (
              <div key={i} className="metric-card">
                <div className={`metric-icon`} style={{background: `${m.color}15`, color: m.color}}>{m.icon}</div>
                <div className="metric-body">
                  <div className="metric-val" style={{color: i > 0 && i < 2 ? 'var(--red)' : m.color}}>
                    {typeof m.val === 'number' && i === 2 ? (Number(m.val) + actionsCompletedCount) : m.val}
                  </div>
                  <div className="metric-lbl">{m.label}</div>
                  <div className={`metric-chg ${m.chg.includes('↑') ? 'chg-up' : m.chg.includes('↓') ? 'chg-down' : ''}`}>{m.chg}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="three-col">
            <section className="panel" style={{flex: activeView === 'home' ? 1.1 : 1}}>
              <div className="panel-head">
                <div><div className="panel-title">Data Connectors</div><div className="panel-sub">Active ecosystem</div></div>
                <span className="pill pill-blue">{connectedCount} live</span>
              </div>
              <div className="panel-body">
                <div className="search-row"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="search" placeholder="Search ecosystem…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                {categories.map(cat => (
                  <div key={cat}>
                    <div className="cat-lbl">{cat} <span>{connectors.filter(c => c.category === cat).length} available</span></div>
                    <div className="conn-grid">
                      {connectors.filter(c => c.category === cat && c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(conn => (
                        <div key={conn.id} className={`conn-card ${conn.connected ? 'connected' : ''}`} onClick={() => toggleConnector(conn.id)}>
                          <div className="conn-icon" style={{background: conn.bg}}>{conn.icon}</div>
                          <div className="conn-info"><div className="conn-name">{conn.name}</div><div className={`conn-status ${conn.connected ? 'live' : ''}`}>{conn.connected ? 'Live' : 'Connect'}</div></div>
                          <button className={`conn-btn ${conn.connected ? 'conn-on' : ''}`} onClick={(e) => { e.stopPropagation(); toggleConnector(conn.id); }}>{conn.connected ? '✓' : 'Connect'}</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div><div className="panel-title">Status & Insights</div><div className="panel-sub">Real-time intelligence</div></div>
                <button className="pill pill-amber" onClick={handleRefresh}>{isRefreshing ? '↻ Loading…' : '↻ Refresh'}</button>
              </div>
              <div className="panel-body">
                <div className="mini-grid">
                  <div className="mini-card"><div className="mini-val" style={{color:'var(--red)'}}>3</div><div className="mini-lbl">Critical</div></div>
                  <div className="mini-card"><div className="mini-val" style={{color:'var(--green)'}}>91%</div><div className="mini-lbl">Health</div></div>
                </div>
                <div className="cat-lbl">Live Insights</div>
                <div className="s-row"><div className="s-icon si-r"><svg className="c-r" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><div><div className="s-title">Turbine #7 failure risk — 94%</div><div className="s-meta">Reliability agent</div><span className="tag t-r">Critical</span></div></div>
                <div className="s-row"><div className="s-icon si-a"><svg className="c-a" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg></div><div><div className="s-title">Supply chain delay — Region 2</div><div className="s-meta">Inventory agent</div><span className="tag t-a">Warning</span></div></div>
                <div className="divider"></div>
                <div className="cat-lbl">Agentic Optimization</div>
                <div className="rec-block">
                  <div className="rec-head">Immediate Action Required</div>
                  <div className="rec-text">Turbine #7 maintenance must be scheduled. Estimated cost avoidance: $340K.</div>
                </div>
              </div>
            </section>

            <section className="panel" style={{flex: 1.1}}>
              <div className="panel-head">
                <div><div className="panel-title">Priority Queue</div><div className="panel-sub">Autonomous agents</div></div>
                <span className="pill pill-green">{config.actions.filter(a => a.status === 'idle').length} pending</span>
              </div>
              <div className="panel-body">
                <div className="cat-lbl">Action Center</div>
                {config.actions.map(action => (
                  <div key={action.id} className={`action-item ${action.isOpen ? 'open' : ''}`}>
                    <div className="action-head" onClick={() => toggleAction(action.id)}>
                      <div className={`pri-bar ${action.priority}`}></div>
                      <div className="a-info"><div className="a-title">{action.title}</div><div className="a-meta">{action.meta}</div></div>
                      <div className="a-ctrl">
                        <button className={`run-btn ${action.status === 'running' ? 'running' : ''} ${action.status === 'done' ? 'done-btn' : ''}`} onClick={(e) => { e.stopPropagation(); runAction(action.id); }}>
                          {action.status === 'idle' && 'Run'}{action.status === 'running' && 'Running...'}{action.status === 'done' && '✓ Done'}
                        </button>
                        <svg className="expand-ico" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
                    </div>
                    <div className="action-detail">
                      <ul className="step-list">
                        {action.steps.map((step, idx) => (
                          <li key={idx} className={`${idx < action.activeStep ? 'done' : ''} ${idx === action.activeStep ? 'active-step' : ''}`}><span className="step-dot"></span>{step}</li>
                        ))}
                      </ul>
                      <div className="auto-badge">⚡ Full Autonomy Enabled</div>
                    </div>
                  </div>
                ))}
                <div className="divider"></div>
                <button className="run-all" onClick={runAllActions}>Run all {config.title} workflows</button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LightDashboard;
