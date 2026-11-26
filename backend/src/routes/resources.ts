/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Static Resource Routes
   Serves the platform's catalog data: data sources, models, suites, architecture.
   ═══════════════════════════════════════════════════════════════════════════ */

import { Router } from 'express';

export const resourcesRouter = Router();

// ─── Data Sources ─────────────────────────────────────────────────────────────

const DATA_SOURCES = [
    { name: 'Snowflake', type: 'Data Warehouse', records: '2.4M', status: 'Connected', health: 99, lastSync: '2 min ago', region: 'US-West' },
    { name: 'SAP S/4HANA', type: 'ERP System', records: '8.1M', status: 'Connected', health: 97, lastSync: '5 min ago', region: 'EU-Central' },
    { name: 'Azure Data Lake', type: 'Cloud Storage', records: '15.2M', status: 'Connected', health: 100, lastSync: '1 min ago', region: 'US-East' },
    { name: 'Salesforce CRM', type: 'CRM Platform', records: '1.2M', status: 'Connected', health: 95, lastSync: '10 min ago', region: 'US-West' },
    { name: 'OSI PI Historian', type: 'Time Series', records: '45.6M', status: 'Connected', health: 98, lastSync: '30 sec ago', region: 'US-Central' },
    { name: 'IBM Maximo', type: 'Asset Mgmt', records: '560K', status: 'Connected', health: 94, lastSync: '15 min ago', region: 'US-East' },
    { name: 'Google BigQuery', type: 'Analytics', records: '9.8M', status: 'Syncing', health: 88, lastSync: '1 hr ago', region: 'US-Multi' },
    { name: 'Delta Lake', type: 'Data Lakehouse', records: '32.1M', status: 'Connected', health: 100, lastSync: '1 min ago', region: 'US-West' },
    { name: 'Apache Kafka', type: 'Event Streaming', records: '∞', status: 'Connected', health: 99, lastSync: 'Real-time', region: 'Global' },
    { name: 'AWS Redshift', type: 'Data Warehouse', records: '5.7M', status: 'Connected', health: 96, lastSync: '8 min ago', region: 'US-East' },
    { name: 'MongoDB Atlas', type: 'Document Store', records: '3.9M', status: 'Connected', health: 97, lastSync: '3 min ago', region: 'US-East' },
    { name: 'Weaviate', type: 'Vector Database', records: '1.8M', status: 'Connected', health: 100, lastSync: '< 1 min', region: 'US-West' },
];

// ─── ML Models ────────────────────────────────────────────────────────────────

const MODELS = [
    { name: 'Reliability Prediction v3.2', type: 'Classification', accuracy: '94.7%', lastTrained: '2025-01-15', status: 'Production', framework: 'XGBoost + LSTM', version: 'v3.2.1', predictions: '2.3M' },
    { name: 'Demand Forecasting v2.1', type: 'Time Series', accuracy: '91.3%', lastTrained: '2025-01-20', status: 'Production', framework: 'TFT + Prophet', version: 'v2.1.0', predictions: '890K' },
    { name: 'Anomaly Detection v4.0', type: 'Unsupervised', accuracy: '97.2%', lastTrained: '2025-02-01', status: 'Production', framework: 'Isolation Forest + AE', version: 'v4.0.3', predictions: '5.1M' },
    { name: 'NLP Document Classifier', type: 'NLP', accuracy: '89.5%', lastTrained: '2024-12-10', status: 'Staging', framework: 'RoBERTa', version: 'v1.4.0', predictions: '120K' },
    { name: 'Supply Chain Optimizer', type: 'Optimization', accuracy: '88.9%', lastTrained: '2025-01-28', status: 'Production', framework: 'OR-Tools + QAOA', version: 'v2.0.1', predictions: '340K' },
    { name: 'Fraud Detection v5.1', type: 'Classification', accuracy: '99.1%', lastTrained: '2025-02-05', status: 'Production', framework: 'GNN (PyG)', version: 'v5.1.2', predictions: '12.6M' },
    { name: 'Churn Prediction v2.0', type: 'Classification', accuracy: '92.8%', lastTrained: '2025-02-10', status: 'Production', framework: 'LightGBM', version: 'v2.0.0', predictions: '1.5M' },
    { name: 'Quantum Portfolio Opt', type: 'Optimization', accuracy: '86.4%', lastTrained: '2025-02-12', status: 'Staging', framework: 'VQE (PennyLane)', version: 'v0.9.1', predictions: '25K' },
];

// ─── Industry Suites ──────────────────────────────────────────────────────────

const SUITES = [
    { name: 'Asset Performance Suite', color: '#1E40AF', icon: '⚙️', description: 'Optimize asset reliability and lifecycle management', apps: ['Reliability', 'Process Optimization', 'Energy Management', 'Asset Connect'] },
    { name: 'Supply Chain Suite', color: '#065F46', icon: '🔗', description: 'End-to-end supply chain visibility and resilience', apps: ['Inventory Optimization', 'Supply Network Risk', 'Production Schedule', 'Demand Forecasting'] },
    { name: 'Financial Services Suite', color: '#7C2D12', icon: '💰', description: 'AI-powered financial risk management and compliance', apps: ['Anti-Money Laundering', 'Smart Lending', 'Cash Management'] },
    { name: 'Defense & Intelligence Suite', color: '#374151', icon: '🛡️', description: 'Mission-critical AI for national security', apps: ['Readiness', 'Intelligence Analysis', 'Decision Advantage'] },
    { name: 'AI CRM Suite', color: '#4C1D95', icon: '👥', description: 'Intelligent customer relationship management', apps: ['Qsimutron CRM'] },
    { name: 'Sustainability Suite', color: '#064E3B', icon: '🌱', description: 'ESG monitoring, carbon tracking, and sustainability reporting', apps: ['Energy Management', 'ESG'] },
    { name: 'State & Local Government', color: '#1F2937', icon: '🏛️', description: 'AI applications for government operations', apps: ['Property Appraisal', 'Law Enforcement', 'GenAI for Government Programs'] },
];

// ─── Architecture Sections ────────────────────────────────────────────────────

const ARCH_SECTIONS = [
    { title: 'Data Integration', items: ['SAP Hana', 'Oracle', 'Salesforce', 'IBM Maximo', 'OSI PI', 'AWS IoT', 'Amazon Kinesis', 'Azure Data Lake'], color: '#1E40AF' },
    { title: 'Extensible Data Models', items: ['Cross-Industry Foundation', 'Reliability', 'Inventory', 'Supply Chain', 'Energy Management', 'CRM', 'Fraud'], color: '#065F46' },
    { title: 'Data Persistence', items: ['NoSQL', 'RDBMS', 'Key Value Store', 'Distributed File System', 'Cloud Object Storage', 'HDFS'], color: '#7C2D12' },
    { title: 'ML Framework', items: ['ML Pipeline', 'Qsimutron Ex Machina', 'AutoML', 'Feature Store', 'Experiment Tracking'], color: '#0369A1' },
    { title: 'Continuous Analytics', items: ['Batch', 'Map Reduce', 'Queue', 'Stream', 'CEP', 'Real-time'], color: '#BE185D' },
    { title: 'Platform Management', items: ['Access Control', 'Auto Scaling', 'Multitenancy', 'Time Series', 'Deployment', 'Monitoring'], color: '#374151' },
    { title: 'App Dev Tools', items: ['Jupyter', 'Eclipse', 'R Studio', 'VS Code', 'Git'], color: '#0F766E' },
    { title: 'UI Frameworks', items: ['React', 'TypeScript', 'Angular', 'Vue'], color: '#DC2626' },
];

// ─── Routes ───────────────────────────────────────────────────────────────────

resourcesRouter.get('/data-sources', (_req, res) => res.json(DATA_SOURCES));
resourcesRouter.get('/models', (_req, res) => res.json(MODELS));
resourcesRouter.get('/suites', (_req, res) => res.json(SUITES));
resourcesRouter.get('/architecture', (_req, res) => res.json(ARCH_SECTIONS));
