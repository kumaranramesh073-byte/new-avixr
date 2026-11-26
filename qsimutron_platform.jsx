import { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from "recharts";

// ─── API ───────────────────────────────────────────────────────────────────────
async function callClaude(system, user, maxTokens = 1200) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }]
    })
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "";
}

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const C3Logo = ({ size = 26, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="2" y="2" width="28" height="4" rx="1" fill={color}/>
    <rect x="2" y="8" width="28" height="4" rx="1" fill={color}/>
    <rect x="2" y="14" width="4" height="16" rx="1" fill={color}/>
    <rect x="8" y="14" width="4" height="4" rx="1" fill={color}/>
    <rect x="8" y="22" width="4" height="8" rx="1" fill={color}/>
    <rect x="14" y="14" width="16" height="4" rx="1" fill={color}/>
    <rect x="14" y="22" width="16" height="4" rx="1" fill={color}/>
    <rect x="14" y="26" width="16" height="4" rx="1" fill={color}/>
  </svg>
);

const Icon = ({ d, size = 18, strokeWidth = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
);

const HomeIcon = () => <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10"/>;
const DataIcon = () => <Icon d="M4 6h16M4 10h16M4 14h10M4 18h7"/>;
const ModelsIcon = () => <Icon d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>;
const ManageIcon = () => <Icon d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>;
const ThemeIcon = () => <Icon d="M12 22C17.523 22 22 17.523 22 12S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 2v20M2 12h20"/>;
const HelpIcon = () => <Icon d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/>;
const SearchIcon = () => <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" strokeWidth={2}/>;
const AgentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M8 12c-2 0-4 1.5-4 3.5V18h16v-2.5c0-2-2-3.5-4-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="19" cy="7" r="2" stroke="#2563FF" strokeWidth="1.8"/>
    <circle cx="5" cy="7" r="2" stroke="#2563FF" strokeWidth="1.8"/>
  </svg>
);
const ChevronDown = () => <Icon d="M6 9l6 6 6-6" size={14}/>;
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#16A34A"/>
    <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const SpinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{animation:"spin 1s linear infinite"}}>
    <circle cx="12" cy="12" r="9" stroke="#D1D5DB" strokeWidth="2"/>
    <path d="M12 3a9 9 0 019 9" stroke="#2563FF" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const PendingDot = () => <div style={{width:16,height:16,borderRadius:"50%",border:"2px solid #D1D5DB",flexShrink:0}}/>;
const CopyIcon = () => <Icon d="M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2M8 4a2 2 0 012-2h4a2 2 0 012 2M8 4h8" size={15}/>;
const ThumbUp = () => <Icon d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" size={15}/>;
const ThumbDown = () => <Icon d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10zM17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17" size={15}/>;
const DownloadIcon = () => <Icon d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" size={15}/>;
const MapPinIcon = () => <Icon d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z" size={14}/>;
const PlatformIcon = () => <Icon d="M3 3h7v7H3V3zM14 3h7v7h-7V3zM14 14h7v7h-7v-7zM3 14h7v7H3v-7z"/>;

// ─── INDUSTRY SUITES DATA ─────────────────────────────────────────────────────
const SUITES = [
  {
    name: "Asset Performance Suite", color: "#1E40AF",
    apps: ["Reliability", "Process Optimization", "Energy Management", "Asset Connect"]
  },
  {
    name: "Supply Chain Suite", color: "#065F46",
    apps: ["Inventory Optimization", "Supply Network Risk", "Production Schedule", "Sourcing Optimization", "Demand Forecasting", "Supply Chain Orchestration"]
  },
  {
    name: "Financial Services Suite", color: "#7C2D12",
    apps: ["Anti-Money Laundering", "Smart Lending", "Cash Management"]
  },
  {
    name: "Defense & Intelligence Suite", color: "#374151",
    apps: ["Readiness", "Intelligence Analysis", "Decision Advantage", "Contested Logistics"]
  },
  {
    name: "AI CRM Suite", color: "#4C1D95",
    apps: ["C3 AI CRM"]
  },
  {
    name: "Sustainability Suite", color: "#064E3B",
    apps: ["Energy Management", "ESG"]
  },
  {
    name: "State & Local Government", color: "#1F2937",
    apps: ["Property Appraisal", "Law Enforcement", "GenAI for Government Programs", "GenAI for Constituent Services"]
  }
];

// ─── ARCH DATA ────────────────────────────────────────────────────────────────
const ARCH_SECTIONS = [
  { title: "Data Integration", items: ["SAP Hana","Oracle","Salesforce","IBM Maximo","OSI PI","GE","AWS IoT","Amazon Kinesis","Azure Data Lake","Weather","Commodity Data"] },
  { title: "Extensible Data Models", items: ["Cross-Industry Foundation","Reliability","Inventory","Supply Chain","Energy Management","CRM","Fraud","Aerospace","Manufacturing","Financial Services","Defense","Utilities","Healthcare","Oil and Gas"] },
  { title: "Data Persistence", items: ["NoSQL","RDBMS","Key Value Store","Distributed File System","Cloud Object Storage","File Systems","HDFS"] },
  { title: "Connectors & Extensions", items: ["Canonical","Source","Expressions","Transform","IoT"] },
  { title: "ML Framework", items: ["ML Pipeline","C3 AI Ex Machina"] },
  { title: "Continuous Analytics", items: ["Batch","Map Reduce","Queue","Stream"] },
  { title: "Platform Management", items: ["Access Control","Auto Scaling","Multitenancy","Time Series","Analytics","Deployment","Profiling","Users","APIs","Encryption","Roles","Scheduler","Auditing","Logging","Authentication","Monitoring","Systems Management"] },
  { title: "App Dev Tools", items: ["Jupyter","Eclipse","R Studio"] },
  { title: "UI & Viz Tools", items: ["Alteryx","Domo","Qlik","MicroStrategy","Tableau"] },
  { title: "UI Frameworks", items: ["React","JS","Angular"] }
];

const DATA_SOURCES = [
  { name: "Snowflake", type: "Data Warehouse", records: "2.4M", status: "Connected" },
  { name: "SAP S/4HANA", type: "ERP System", records: "8.1M", status: "Connected" },
  { name: "Azure Data Lake", type: "Cloud Storage", records: "15.2M", status: "Connected" },
  { name: "Salesforce CRM", type: "CRM Platform", records: "1.2M", status: "Connected" },
  { name: "OSI PI Historian", type: "Time Series", records: "45.6M", status: "Connected" },
  { name: "IBM Maximo", type: "Asset Mgmt", records: "560K", status: "Connected" },
  { name: "Google BigQuery", type: "Analytics", records: "9.8M", status: "Syncing" },
  { name: "Delta Lake", type: "Data Lakehouse", records: "32.1M", status: "Connected" },
];

const MODELS = [
  { name: "Reliability Prediction v3.2", type: "Classification", accuracy: "94.7%", lastTrained: "2025-01-15", status: "Production" },
  { name: "Demand Forecasting v2.1", type: "Time Series", accuracy: "91.3%", lastTrained: "2025-01-20", status: "Production" },
  { name: "Anomaly Detection v4.0", type: "Unsupervised", accuracy: "97.2%", lastTrained: "2025-02-01", status: "Production" },
  { name: "NLP Document Classifier", type: "NLP", accuracy: "89.5%", lastTrained: "2024-12-10", status: "Staging" },
  { name: "Supply Chain Optimizer", type: "Optimization", accuracy: "88.9%", lastTrained: "2025-01-28", status: "Production" },
  { name: "Fraud Detection v5.1", type: "Classification", accuracy: "99.1%", lastTrained: "2025-02-05", status: "Production" },
];

// ─── SUGGESTION QUERIES ───────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Which turbine is at the highest risk of failure and what should I do about it?",
  "What are the top supply chain bottlenecks this quarter?",
  "Identify anomalies in energy consumption across all facilities",
  "Which customers are most likely to churn in the next 30 days?",
  "Optimize inventory levels for the Q2 production schedule",
];

// ─── SIMULATED MAP ────────────────────────────────────────────────────────────
function MapViz({ locations }) {
  const RISK_COLOR = { high: "#EF4444", medium: "#F59E0B", low: "#22C55E" };
  // Simple SVG map projection (US-centric)
  const toLX = (lng) => ((lng + 130) / 70) * 520 + 30;
  const toLY = (lat) => (1 - (lat - 24) / 30) * 200 + 20;
  return (
    <div style={{ background: "#F0F4F8", borderRadius: 8, overflow: "hidden", position: "relative" }}>
      <svg viewBox="0 0 580 260" style={{ width: "100%", display: "block" }}>
        {/* simple US outline approximation */}
        <rect x="0" y="0" width="580" height="260" fill="#E8EEF4"/>
        <path d="M30,80 L120,60 L220,55 L330,50 L450,55 L540,70 L545,120 L540,160 L500,190 L450,200 L380,210 L300,215 L200,210 L120,200 L60,180 L30,150 Z" fill="#C8D6E5" stroke="#B0C4D4" strokeWidth="1"/>
        <text x="180" y="150" fontSize="10" fill="#8899AA" fontWeight="600">United States</text>
        {/* Location pins */}
        {locations.map((loc, i) => {
          const x = Math.max(40, Math.min(540, toLX(loc.lng)));
          const y = Math.max(20, Math.min(240, toLY(loc.lat)));
          const c = RISK_COLOR[loc.risk] || "#2563FF";
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={12} fill={c} opacity={0.2}/>
              <circle cx={x} cy={y} r={6} fill={c}/>
              <text x={x + 9} y={y + 4} fontSize="9" fill="#374151" fontWeight="600">{loc.name}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, padding: "8px 12px", background: "#fff", fontSize: 11, color: "#6B7280" }}>
        {["high","medium","low"].map(r => (
          <span key={r} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: RISK_COLOR[r], display: "inline-block" }}/>
            {r.charAt(0).toUpperCase() + r.slice(1)} Risk
          </span>
        ))}
        <span style={{ marginLeft: "auto" }}>© Mapbox</span>
      </div>
    </div>
  );
}

// ─── CHART CARD CONTENT ───────────────────────────────────────────────────────
function ChartContent({ content }) {
  const [view, setView] = useState("chart");
  if (!content?.data) return null;
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
          {content.bars?.[0]?.name || "Metrics"} by {content.xKey || "Category"}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {["chart","grid"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "4px 12px", fontSize: 12, fontWeight: 500, borderRadius: 4, cursor: "pointer",
              background: view === v ? "#2563FF" : "transparent",
              color: view === v ? "#fff" : "#6B7280",
              border: `1px solid ${view === v ? "#2563FF" : "#E5E7EB"}`,
            }}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
          ))}
          <button style={{ padding: "4px 8px", background: "transparent", border: "1px solid #E5E7EB", borderRadius: 4, cursor: "pointer", color: "#6B7280" }}>
            <DownloadIcon/>
          </button>
        </div>
      </div>
      {view === "chart" ? (
        <ResponsiveContainer width="100%" height={200}>
          {content.chartType === "line" ? (
            <LineChart data={content.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
              <XAxis dataKey={content.xKey} tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}/>
              {(content.bars || []).map(b => (
                <Line key={b.key} type="monotone" dataKey={b.key} stroke={b.color} strokeWidth={2} dot={{ r: 3 }} name={b.name}/>
              ))}
            </LineChart>
          ) : (
            <BarChart data={content.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
              <XAxis dataKey={content.xKey} tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}/>
              {(content.bars || []).map(b => (
                <Bar key={b.key} dataKey={b.key} fill={b.color} name={b.name} radius={[3, 3, 0, 0]}/>
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#374151" }}>{content.xKey}</th>
                {(content.bars || []).map(b => <th key={b.key} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#374151" }}>{b.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {content.data.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F9FAFB" }}>
                  <td style={{ padding: "8px 12px", color: "#374151" }}>{row[content.xKey]}</td>
                  {(content.bars || []).map(b => <td key={b.key} style={{ padding: "8px 12px", textAlign: "right", color: "#111827" }}>{typeof row[b.key] === 'number' ? row[b.key].toFixed(2) : row[b.key]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ─── TABLE CONTENT ────────────────────────────────────────────────────────────
function TableContent({ content }) {
  if (!content?.columns) return null;
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button style={{ padding: "4px 8px", background: "transparent", border: "1px solid #E5E7EB", borderRadius: 4, cursor: "pointer", color: "#6B7280" }}>
          <DownloadIcon/>
        </button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
            {content.columns.map((c, i) => (
              <th key={i} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {content.rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: "1px solid #F9FAFB" }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: "8px 12px", color: "#111827", whiteSpace: "nowrap" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {content.rows.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "8px 12px", fontSize: 12, color: "#6B7280", gap: 8 }}>
          <span>1 – {content.rows.length} of {content.rows.length} items</span>
          <span style={{ display: "flex", gap: 4 }}>
            {["⊲","‹","1","›","⊳"].map((s,i) => (
              <button key={i} style={{ padding: "2px 6px", border: "1px solid #E5E7EB", borderRadius: 3, background: s === "1" ? "#2563FF" : "transparent", color: s === "1" ? "#fff" : "#6B7280", cursor: "pointer", fontSize: 11 }}>{s}</button>
            ))}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── STEP RESULT CARD ─────────────────────────────────────────────────────────
function StepCard({ step, idx, isCurrent, isQueued }) {
  const [expanded, setExpanded] = useState(true);
  const status = step.status;

  const stepIndicator = isQueued ? <PendingDot/> : isCurrent ? <SpinIcon/> : status === "done" ? <CheckIcon/> : <PendingDot/>;

  if (isQueued) {
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", opacity: 0.5 }}>
        <div style={{ marginTop: 2 }}>{stepIndicator}</div>
        <span style={{ fontSize: 14, color: "#374151" }}>{step.title}</span>
      </div>
    );
  }

  const content = step.content;

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Step header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isCurrent ? <SpinIcon/> : <CheckIcon/>}
          <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{step.title}</span>
          {step.dataSource && (
            <span style={{ fontSize: 11, color: "#6B7280", background: "#F3F4F6", padding: "2px 8px", borderRadius: 10 }}>
              {step.dataSource}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {status === "done" && (
            <>
              <button onClick={() => setExpanded(!expanded)} style={{
                display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                background: "transparent", border: "1px solid #E5E7EB", borderRadius: 4,
                cursor: "pointer", fontSize: 12, color: "#16A34A", fontWeight: 500
              }}>
                <CheckIcon/> Finished generating
                <span style={{ transform: expanded ? "rotate(180deg)" : "none", display: "inline-block" }}>▾</span>
              </button>
              <button style={{ padding: "4px 8px", background: "transparent", border: "1px solid #E5E7EB", borderRadius: 4, cursor: "pointer", color: "#6B7280" }}><CopyIcon/></button>
              <button style={{ padding: "4px 8px", background: "transparent", border: "1px solid #E5E7EB", borderRadius: 4, cursor: "pointer", color: "#6B7280" }}><ThumbUp/></button>
              <button style={{ padding: "4px 8px", background: "transparent", border: "1px solid #E5E7EB", borderRadius: 4, cursor: "pointer", color: "#6B7280" }}><ThumbDown/></button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {expanded && status === "done" && content && (
        <div style={{ marginLeft: 24 }}>
          {/* Summary text */}
          {content.summary && (
            <p style={{ fontSize: 13, color: "#374151", marginBottom: 14, lineHeight: 1.6 }}>
              {typeof content.summary === "string" && content.summary.includes("\n")
                ? content.summary.split("\n").filter(Boolean).map((p, i) => <span key={i}>{p}<br/></span>)
                : content.summary}
            </p>
          )}

          {/* Visualization */}
          <div style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: 16, background: "#fff" }}>
            {step.type === "chart" && <ChartContent content={content}/>}
            {step.type === "map" && <MapViz locations={content.locations || []}/>}
            {step.type === "table" && <TableContent content={content}/>}
            {step.type === "text" && (
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
                {content.summary?.split("\n\n").map((para, i) => para.trim() ? <p key={i} style={{ marginBottom: 12 }}>{para}</p> : null)}
              </div>
            )}
          </div>

          {/* Sources */}
          {step.dataSource && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#6B7280" }}>Sources:</span>
              <button style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 12,
                border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151",
                cursor: "pointer"
              }}>1. {step.dataSource}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function C3EnterpriseAI() {
  const [page, setPage] = useState("home");
  const [query, setQuery] = useState("");
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [environment, setEnvironment] = useState("default");
  const [showEnvDrop, setShowEnvDrop] = useState(false);
  const [agentMode, setAgentMode] = useState("all agents");
  const [showAgentDrop, setShowAgentDrop] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // ── Submit Query ──
  const handleSubmit = async (queryText) => {
    const q = (queryText || query).trim();
    if (!q) return;
    setQuery("");
    setIsLoading(true);

    const sid = Date.now();
    const newSession = {
      id: sid, query: q, plan: null, executedSteps: [],
      status: "planning", currentStep: -1, progress: 0
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(sid);
    setPage("session");

    try {
      const raw = await callClaude(
        `You are an enterprise AI orchestration planning agent for the C3.ai platform.
Given a user query about enterprise operations, create a concise multi-step execution plan.
Return ONLY valid JSON, no markdown, no backticks:
{"steps":[{"id":1,"title":"Short action title","description":"What this retrieves/analyzes","type":"chart","dataSource":"Source system"}]}
Rules:
- Exactly 3–5 steps
- type must be one of: chart, table, map, text
- Use chart for KPIs/metrics, table for structured records, map for geospatial, text for analysis/recommendations
- dataSource: realistic enterprise system (Snowflake, SAP S4HANA, Azure Data Lake, Salesforce, OSI PI, IBM Maximo, etc.)
- Steps must be logically sequential`,
        q, 800
      );
      let plan;
      try {
        plan = JSON.parse(raw.replace(/```json|```/g, "").trim());
      } catch {
        plan = { steps: [{ id: 1, title: "Analyze & Synthesize", description: q, type: "text", dataSource: "Enterprise Knowledge Base" }] };
      }
      setSessions(prev => prev.map(s => s.id === sid ? { ...s, plan, status: "ready" } : s));
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  // ── Execute Plan ──
  const executePlan = useCallback(async (sid) => {
    const session = sessions.find(s => s.id === sid);
    if (!session?.plan?.steps) return;
    const steps = session.plan.steps;
    setSessions(prev => prev.map(s => s.id === sid ? { ...s, status: "executing", currentStep: 0, progress: 5 } : s));

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setSessions(prev => prev.map(s => s.id === sid ? { ...s, currentStep: i } : s));

      let content;
      try {
        const q = session.query;
        if (step.type === "chart") {
          const r = await callClaude(
            `Return ONLY valid JSON (no markdown) for an enterprise metrics bar chart:
{"summary":"1-sentence finding from data.","chartType":"bar","data":[{"name":"Label","value":number}],"xKey":"name","bars":[{"key":"value","color":"#2563FF","name":"Metric Name"}]}
- 4–6 realistic data points
- Values should be realistic for enterprise metrics (scores 0-1, counts, percentages, etc.)
- Summary should reference the specific metric name (e.g. "TURBINE-1 has the highest risk score of 0.95")`,
            `Query: "${q}"\nStep: "${step.title}" – ${step.description}`, 600
          );
          try { content = JSON.parse(r.replace(/```json|```/g, "").trim()); }
          catch { content = { summary: "Data retrieved.", chartType: "bar", data: [{ name: "A", value: 0.9 }, { name: "B", value: 0.5 }, { name: "C", value: 0.3 }], xKey: "name", bars: [{ key: "value", color: "#2563FF", name: "Score" }] }; }
        } else if (step.type === "table") {
          const r = await callClaude(
            `Return ONLY valid JSON (no markdown) for an enterprise data table:
{"summary":"1-sentence finding.","columns":["Col1","Col2","Col3","Col4"],"rows":[["v1","v2","v3","v4"]]}
- 4–6 columns with realistic enterprise field names
- 4–6 rows of realistic data
- Include status/category columns and date fields where appropriate`,
            `Query: "${q}"\nStep: "${step.title}" – ${step.description}`, 700
          );
          try { content = JSON.parse(r.replace(/```json|```/g, "").trim()); }
          catch { content = { summary: "Records retrieved.", columns: ["ID", "Name", "Status", "Value", "Date"], rows: [["001", "Item A", "Active", "95%", "2025-01-21"]] }; }
        } else if (step.type === "map") {
          const r = await callClaude(
            `Return ONLY valid JSON (no markdown) for geospatial location data:
{"summary":"1-sentence finding about the locations.","locations":[{"name":"Location Name","lat":40.7,"lng":-96.7,"info":"Brief info","risk":"high"}]}
- 3–5 locations with realistic US or global coordinates
- risk: "high", "medium", or "low"
- Names should be realistic site/asset identifiers`,
            `Query: "${q}"\nStep: "${step.title}" – ${step.description}`, 500
          );
          try { content = JSON.parse(r.replace(/```json|```/g, "").trim()); }
          catch { content = { summary: "Locations identified.", locations: [{ name: "Site-1", lat: 40.8, lng: -96.7, info: "High priority", risk: "high" }] }; }
        } else {
          const r = await callClaude(
            `You are an enterprise AI analyst for C3.ai. Provide concise, actionable professional analysis.
Write 2–3 focused paragraphs (no bullet lists, no markdown headers).
Reference specific data findings and provide clear recommendations.`,
            `Original query: "${q}"\nStep being analyzed: "${step.title}" – ${step.description}`, 600
          );
          content = { summary: r };
        }
      } catch (e) {
        content = { summary: "Step completed. Data processed successfully." };
      }

      const progressVal = Math.round(((i + 1) / steps.length) * 100);
      setSessions(prev => prev.map(s => {
        if (s.id !== sid) return s;
        return {
          ...s,
          executedSteps: [...s.executedSteps, { ...step, content, status: "done" }],
          currentStep: i + 1,
          progress: progressVal
        };
      }));
      await new Promise(r => setTimeout(r, 300));
    }

    setSessions(prev => prev.map(s => s.id === sid ? { ...s, status: "done", currentStep: steps.length, progress: 100 } : s));
  }, [sessions]);

  // ── Render Sidebar ──
  const SidebarItem = ({ icon, label, id }) => (
    <button
      onClick={() => setPage(id)}
      style={{
        width: 48, display: "flex", flexDirection: "column", alignItems: "center",
        gap: 4, padding: "10px 0", background: page === id ? "#F3F4F6" : "transparent",
        border: "none", cursor: "pointer", color: page === id ? "#111827" : "#6B7280",
        borderRadius: 8, margin: "2px 4px"
      }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
    </button>
  );

  const inSession = page === "session" && activeSession;

  return (
    <div style={{
      fontFamily: "'IBM Plex Sans', 'Helvetica Neue', sans-serif",
      display: "flex", height: "100vh", background: "#fff",
      overflow: "hidden", position: "relative"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{transform:translateX(-20px);opacity:0} to{transform:translateX(0);opacity:1} }
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:3px}
        button:focus{outline:none}
        input:focus{outline:none}
      `}</style>

      {/* ── LEFT SIDEBAR ── */}
      <div style={{
        width: 56, flexShrink: 0, background: "#fff", borderRight: "1px solid #F3F4F6",
        display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, zIndex: 10
      }}>
        <div style={{ padding: "12px 0 16px", cursor: "pointer" }} onClick={() => { setPage("home"); }}>
          <C3Logo size={24} color="#111827"/>
        </div>
        <div style={{ width: "100%", flex: 1 }}>
          <SidebarItem icon={<HomeIcon/>} label="Home" id="home"/>
          <SidebarItem icon={<DataIcon/>} label="Data" id="data"/>
          <SidebarItem icon={<ModelsIcon/>} label="Models" id="models"/>
          <SidebarItem icon={<ManageIcon/>} label="Manage" id="manage"/>
          {inSession && <SidebarItem icon={<PlatformIcon/>} label="Arch" id="arch"/>}
        </div>
        <div style={{ paddingBottom: 16 }}>
          <SidebarItem icon={<ThemeIcon/>} label="Theme" id="theme"/>
          <SidebarItem icon={<HelpIcon/>} label="Help" id="help"/>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{
          height: 48, display: "flex", alignItems: "center", justifyContent: "flex-end",
          padding: "0 16px", borderBottom: "1px solid #F3F4F6", background: "#fff", flexShrink: 0
        }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowEnvDrop(!showEnvDrop)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
                border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff",
                cursor: "pointer", fontSize: 13, color: "#374151", fontWeight: 500
              }}
            >
              {environment} <ChevronDown/>
            </button>
            {showEnvDrop && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#fff",
                border: "1px solid #E5E7EB", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,.08)",
                zIndex: 100, minWidth: 160, overflow: "hidden"
              }}>
                {["default", "production", "staging", "development"].map(e => (
                  <button key={e} onClick={() => { setEnvironment(e); setShowEnvDrop(false); }} style={{
                    width: "100%", padding: "9px 14px", textAlign: "left", background: environment === e ? "#F0F9FF" : "transparent",
                    border: "none", cursor: "pointer", fontSize: 13, color: "#374151", display: "block"
                  }}>{e}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── HOME PAGE ── */}
        {page === "home" && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: 40
          }}>
            <div style={{ textAlign: "center", marginBottom: 32, animation: "fadeIn .5s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
                <C3Logo size={44} color="#111827"/>
                <h1 style={{ fontSize: 44, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", margin: 0 }}>
                  C3 Generative AI
                </h1>
              </div>
            </div>
            {/* Search Bar */}
            <div style={{ width: "100%", maxWidth: 520, position: "relative" }}>
              <div style={{ display: "flex", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "visible", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
                {/* Agent selector */}
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowAgentDrop(!showAgentDrop)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "0 12px",
                      height: 48, background: "transparent", border: "none", borderRight: "1px solid #E5E7EB",
                      cursor: "pointer", color: "#2563FF", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap"
                    }}
                  >
                    <AgentIcon/> <ChevronDown/>
                  </button>
                  {showAgentDrop && (
                    <div style={{
                      position: "absolute", left: 0, top: "calc(100% + 4px)", background: "#fff",
                      border: "1px solid #E5E7EB", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,.08)",
                      zIndex: 100, minWidth: 200
                    }}>
                      {["All Agents","ML Insight Agent","Information Retrieval Agent","Dashboard Agent","Optimizer Agent"].map(a => (
                        <button key={a} onClick={() => { setAgentMode(a); setShowAgentDrop(false); }} style={{
                          width: "100%", padding: "9px 14px", textAlign: "left",
                          background: agentMode === a ? "#F0F9FF" : "transparent",
                          border: "none", cursor: "pointer", fontSize: 13, color: "#374151", display: "block"
                        }}>{a}</button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="Search across your documents..."
                  style={{
                    flex: 1, border: "none", padding: "0 14px", fontSize: 14,
                    color: "#111827", background: "transparent", height: 48
                  }}
                />
                <button
                  onClick={() => handleSubmit()}
                  style={{
                    padding: "0 16px", background: "transparent", border: "none",
                    cursor: "pointer", color: "#6B7280", borderLeft: "1px solid #E5E7EB"
                  }}
                >
                  <SearchIcon/>
                </button>
              </div>
              {/* Suggestions */}
              {query.length > 2 && (
                <div style={{
                  position: "absolute", left: 0, right: 0, top: "calc(100% + 4px)",
                  background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8,
                  boxShadow: "0 4px 16px rgba(0,0,0,.08)", zIndex: 100
                }}>
                  {SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 3).map((s, i) => (
                    <button key={i} onClick={() => handleSubmit(s)} style={{
                      width: "100%", padding: "10px 16px", textAlign: "left",
                      background: "transparent", border: "none", cursor: "pointer",
                      fontSize: 13, color: "#374151", fontWeight: 500, display: "block",
                      borderBottom: i < 2 ? "1px solid #F9FAFB" : "none"
                    }}>{s}</button>
                  ))}
                </div>
              )}
            </div>
            {/* Recent queries */}
            {sessions.length > 0 && (
              <div style={{ width: "100%", maxWidth: 520, marginTop: 32 }}>
                <p style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Recent Searches</p>
                {sessions.slice(0, 3).map(s => (
                  <button key={s.id} onClick={() => { setActiveSessionId(s.id); setPage("session"); }} style={{
                    width: "100%", textAlign: "left", padding: "10px 14px",
                    background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 8,
                    cursor: "pointer", fontSize: 13, color: "#374151", marginBottom: 8,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                  }}>{s.query}</button>
                ))}
              </div>
            )}
            {/* Sample queries */}
            <div style={{ width: "100%", maxWidth: 520, marginTop: 24 }}>
              <p style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Try asking</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SUGGESTIONS.slice(0, 3).map((s, i) => (
                  <button key={i} onClick={() => handleSubmit(s)} style={{
                    padding: "7px 14px", border: "1px solid #E5E7EB", borderRadius: 20,
                    background: "#fff", cursor: "pointer", fontSize: 12, color: "#374151",
                    fontWeight: 500, textAlign: "left"
                  }}>{s.length > 52 ? s.slice(0, 52) + "…" : s}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SESSION PAGE ── */}
        {page === "session" && activeSession && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Recent Searches Panel */}
            <div style={{
              width: 64, borderRight: "1px solid #F3F4F6", display: "flex",
              flexDirection: "column", padding: "12px 0", background: "#FAFAFA", flexShrink: 0
            }}>
              <div style={{ transform: "rotate(-90deg)", transformOrigin: "center", whiteSpace: "nowrap", fontSize: 11, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.08em", marginTop: 80 }}>
                Recent Searches
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, padding: "0 8px", marginTop: 40 }}>
                {sessions.map(s => (
                  <button key={s.id} onClick={() => setActiveSessionId(s.id)} title={s.query} style={{
                    width: 44, height: 44, borderRadius: 8,
                    background: s.id === activeSessionId ? "#E0EAFF" : "#F3F4F6",
                    border: s.id === activeSessionId ? "1px solid #BFDBFE" : "1px solid transparent",
                    cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center",
                    justifyContent: "center", color: s.id === activeSessionId ? "#2563FF" : "#6B7280",
                    fontSize: 9, textAlign: "center", padding: 4
                  }}>
                    {s.query.slice(0, 8)}…
                  </button>
                ))}
              </div>
            </div>

            {/* Main session content */}
            <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
              {/* Progress bar */}
              {activeSession.status === "executing" && (
                <div style={{ position: "sticky", top: 0, zIndex: 5, height: 3, background: "#E5E7EB" }}>
                  <div style={{
                    height: "100%", background: "#2563FF",
                    width: `${activeSession.progress || 10}%`,
                    transition: "width 0.5s ease",
                    borderRadius: 2
                  }}/>
                </div>
              )}
              {activeSession.status === "done" && (
                <div style={{ height: 3, background: "#2563FF", width: "100%" }}/>
              )}

              <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 40px" }}>
                {/* Agent mode indicator */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px",
                    background: "#F0F9FF", border: "1px solid #BFDBFE", borderRadius: 20
                  }}>
                    <AgentIcon/>
                    <span style={{ fontSize: 12, color: "#1D4ED8", fontWeight: 500 }}>{agentMode}</span>
                    <ChevronDown/>
                  </div>
                </div>

                {/* Query heading */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 28 }}>
                  <div style={{ width: 20, height: 20, marginTop: 2, flexShrink: 0, color: "#6B7280" }}>
                    <Icon d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" size={18}/>
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                    {activeSession.query}
                  </h2>
                </div>

                {/* PLANNING STATE */}
                {(activeSession.status === "planning" || isLoading) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 16, background: "#F9FAFB", borderRadius: 10 }}>
                    <SpinIcon/>
                    <span style={{ fontSize: 13, color: "#374151" }}>Planning multi-step execution strategy...</span>
                  </div>
                )}

                {/* PLAN READY */}
                {activeSession.status === "ready" && activeSession.plan && (
                  <div style={{
                    border: "1px solid #E5E7EB", borderRadius: 10, padding: 24,
                    background: "#fff", animation: "fadeIn .3s ease"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Plan</span>
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%", border: "1.5px solid #9CA3AF",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "help", title: "AI-generated execution plan"
                      }}>
                        <span style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 700 }}>i</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
                      I'm creating a plan to answer your question since it requires multiple steps.
                    </p>
                    {activeSession.plan.steps.map((step, i) => (
                      <div key={step.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                        <PendingDot/>
                        <div>
                          <span style={{ fontSize: 13.5, color: "#111827", fontWeight: 500 }}>{step.title}</span>
                          <span style={{ fontSize: 12, color: "#6B7280", marginLeft: 8 }}>– {step.description}</span>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                      <button
                        onClick={() => executePlan(activeSession.id)}
                        style={{
                          padding: "9px 24px", background: "#2563FF", color: "#fff",
                          border: "none", borderRadius: 8, cursor: "pointer",
                          fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em"
                        }}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* EXECUTING / DONE */}
                {(activeSession.status === "executing" || activeSession.status === "done") && activeSession.plan && (
                  <div style={{ animation: "fadeIn .3s ease" }}>
                    {/* Executed steps */}
                    {activeSession.executedSteps.map((step, i) => (
                      <div key={step.id} style={{ animation: "slideIn .3s ease" }}>
                        <StepCard step={step} idx={i} isCurrent={false} isQueued={false}/>
                      </div>
                    ))}

                    {/* Current executing step */}
                    {activeSession.status === "executing" && activeSession.currentStep < activeSession.plan.steps.length && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                        <SpinIcon/>
                        <span style={{ fontSize: 13.5, color: "#374151", fontWeight: 500 }}>
                          {activeSession.plan.steps[activeSession.currentStep]?.title}...
                        </span>
                      </div>
                    )}

                    {/* Queued steps */}
                    {activeSession.plan.steps.slice(activeSession.currentStep + 1).map((step, i) => (
                      <div key={step.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 0", opacity: 0.4 }}>
                        <PendingDot/>
                        <span style={{ fontSize: 13, color: "#374151" }}>{step.title}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Follow-up input */}
                {activeSession.status === "done" && (
                  <div style={{ marginTop: 32, display: "flex", gap: 10 }}>
                    <input
                      placeholder="Ask a follow-up question..."
                      onKeyDown={e => e.key === "Enter" && handleSubmit(e.target.value)}
                      style={{
                        flex: 1, padding: "10px 16px", border: "1px solid #E5E7EB",
                        borderRadius: 8, fontSize: 13.5, color: "#111827", background: "#F9FAFB"
                      }}
                    />
                    <button onClick={() => setPage("home")} style={{
                      padding: "10px 16px", background: "#F3F4F6", border: "1px solid #E5E7EB",
                      borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#374151", fontWeight: 500
                    }}>New Query</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── DATA PAGE ── */}
        {page === "data" && (
          <div style={{ flex: 1, overflow: "auto", padding: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Data Sources</h2>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 28 }}>Connected enterprise data integrations and their synchronization status</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {DATA_SOURCES.map((ds, i) => (
                <div key={i} style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 18, background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>{ds.name}</h3>
                      <span style={{ fontSize: 11, color: "#6B7280" }}>{ds.type}</span>
                    </div>
                    <span style={{
                      fontSize: 11, padding: "3px 10px", borderRadius: 10, fontWeight: 500,
                      background: ds.status === "Connected" ? "#DCFCE7" : "#FEF9C3",
                      color: ds.status === "Connected" ? "#15803D" : "#854D0E"
                    }}>{ds.status}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>Records</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{ds.records}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MODELS PAGE ── */}
        {page === "models" && (
          <div style={{ flex: 1, overflow: "auto", padding: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 4 }}>ML Models</h2>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 28 }}>Production and staging machine learning models in your enterprise</p>
            <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                    {["Model Name","Type","Accuracy","Last Trained","Status"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODELS.map((m, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F9FAFB" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 500, color: "#111827" }}>{m.name}</td>
                      <td style={{ padding: "12px 16px", color: "#6B7280" }}>{m.type}</td>
                      <td style={{ padding: "12px 16px", color: "#111827", fontWeight: 600 }}>{m.accuracy}</td>
                      <td style={{ padding: "12px 16px", color: "#6B7280" }}>{m.lastTrained}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          fontSize: 11, padding: "3px 10px", borderRadius: 10, fontWeight: 500,
                          background: m.status === "Production" ? "#DBEAFE" : "#F3F4F6",
                          color: m.status === "Production" ? "#1D4ED8" : "#6B7280"
                        }}>{m.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MANAGE PAGE ── */}
        {page === "manage" && (
          <div style={{ flex: 1, overflow: "auto", padding: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Enterprise Application Suites</h2>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 28 }}>Industry-specific AI application packages for your enterprise</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {SUITES.map((suite, si) => (
                <div key={si}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#374151", margin: 0 }}>{suite.name}</h3>
                    <span style={{ fontSize: 13, color: "#9CA3AF" }}>→</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    {suite.apps.map((app, ai) => (
                      <div key={ai} style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
                        border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff",
                        cursor: "pointer", minWidth: 200
                      }}>
                        <div style={{ width: 32, height: 32, background: suite.color, borderRadius: 4, flexShrink: 0, opacity: 0.15 }}/>
                        <div style={{ width: 32, height: 32, position: "absolute", marginLeft: 0 }}>
                          <C3Logo size={18} color={suite.color}/>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 500 }}>C3 AI</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{app}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {si < SUITES.length - 1 && <div style={{ borderBottom: "1px solid #F3F4F6", marginTop: 20 }}/>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ARCHITECTURE PAGE ── */}
        {page === "arch" && (
          <div style={{ flex: 1, overflow: "auto", padding: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 4 }}>C3 AI Integrated Development Studio</h2>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>Full-stack enterprise AI platform architecture</p>
            {/* Studio tabs */}
            <div style={{ display: "flex", gap: 0, marginBottom: 24, border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
              {["C3 AI Data Studio","C3 AI Applications Studio","C3 AI ML Studio","C3 AI DevOps Studio"].map((s, i) => (
                <div key={i} style={{
                  flex: 1, padding: "10px 12px", textAlign: "center",
                  borderRight: i < 3 ? "1px solid #E5E7EB" : "none",
                  background: "#F9FAFB", fontSize: 12, fontWeight: 600, color: "#374151",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                }}>
                  <C3Logo size={14} color="#374151"/>{s}
                </div>
              ))}
            </div>
            {/* Architecture grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {ARCH_SECTIONS.map((sec, si) => (
                <div key={si} style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: 14, background: si % 3 === 0 ? "#F9FAFB" : "#fff" }}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{sec.title}</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {sec.items.map((item, ii) => (
                      <span key={ii} style={{
                        fontSize: 11, padding: "3px 8px", background: "#F3F4F6",
                        borderRadius: 4, color: "#374151", fontWeight: 500
                      }}>{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Agent Orchestration Architecture */}
            <div style={{ marginTop: 32, border: "1px solid #E5E7EB", borderRadius: 10, padding: 24, background: "#fff" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Autonomously Orchestrate Impact</h3>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>with Specialized AI Agents</p>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                {/* User */}
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1F2937", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 18 }}>👤</span>
                </div>
                <div style={{ width: 2, height: 20, background: "#E5E7EB" }}/>
                {/* AI Response */}
                <div style={{ padding: "6px 20px", background: "#2563FF", color: "#fff", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>AI Response</div>
                <div style={{ width: 2, height: 20, background: "#E5E7EB" }}/>
                {/* Orchestration Agent */}
                <div style={{ padding: "8px 20px", border: "1.5px solid #374151", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#111827" }}>
                  Planning and Orchestration AI Agent
                </div>
                <div style={{ width: 2, height: 16, background: "#E5E7EB" }}/>
                {/* Sub-agents */}
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
                  {["ML Insight\nAI Agent","Information Retrieval\nAI Agent","Dashboard\nAI Agent","Optimizer\nAI Agent"].map((a, i) => (
                    <div key={i} style={{
                      padding: "8px 16px", border: "1.5px solid #9CA3AF", borderRadius: 8,
                      fontSize: 11.5, fontWeight: 500, color: "#374151", textAlign: "center",
                      whiteSpace: "pre-line", minWidth: 110
                    }}>{a}</div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
                  {["Azure","Snowflake","C3.ai","Delta Lake","BigQuery","Gurobi"].map((src, i) => (
                    <span key={i} style={{
                      fontSize: 11, padding: "3px 10px", border: "1px solid #E5E7EB",
                      borderRadius: 6, color: "#374151", fontWeight: 500, background: "#F9FAFB"
                    }}>{src}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── HELP / THEME pages ── */}
        {(page === "help" || page === "theme") && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}>
            <div style={{ textAlign: "center" }}>
              <C3Logo size={36} color="#D1D5DB"/>
              <p style={{ fontSize: 14, marginTop: 12 }}>{page === "help" ? "Help & Documentation" : "Theme Settings"}</p>
              <p style={{ fontSize: 12, color: "#CBD5E1" }}>Coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
