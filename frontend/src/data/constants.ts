/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Static Data Constants
   ═══════════════════════════════════════════════════════════════════════════ */

import type { DataSource, MLModel, IndustrySuite, ArchSection } from '../types';

// ─── Industry Suites ──────────────────────────────────────────────────────

export const SUITES: IndustrySuite[] = [
    {
        name: 'Asset Performance Suite',
        color: '#B45309',
        icon: 'Activity',
        description: 'Optimize asset reliability, performance, and lifecycle management',
        apps: ['Reliability', 'Process Optimization', 'Energy Management', 'Asset Connect'],
    },
    {
        name: 'Supply Chain Suite',
        color: '#1D4ED8',
        icon: 'Box',
        description: 'End-to-end supply chain visibility, optimization, and resilience',
        apps: [
            'Inventory Optimization',
            'Supply Network Risk',
            'Production Schedule',
            'Sourcing Optimization',
            'Demand Forecasting',
            'Supply Chain Orchestration',
        ],
    },
    {
        name: 'Financial Services Suite',
        color: '#7C2D12',
        icon: 'DollarSign',
        description: 'AI-powered financial risk management and compliance',
        apps: ['Anti-Money Laundering', 'Smart Lending', 'Cash Management'],
    },
    {
        name: 'Defense & Intelligence Suite',
        color: '#374151',
        icon: 'Shield',
        description: 'Mission-critical AI for national security and defense',
        apps: ['Readiness', 'Intelligence Analysis', 'Decision Advantage', 'Contested Logistics'],
    },
    {
        name: 'AI CRM Suite',
        color: '#4C1D95',
        icon: 'Users',
        description: 'Intelligent customer relationship management powered by AI',
        apps: ['Qsimutron CRM'],
    },
    {
        name: 'Sustainability Suite',
        color: '#064E3B',
        icon: 'Leaf',
        description: 'ESG monitoring, carbon tracking, and sustainability reporting',
        apps: ['Energy Management', 'ESG'],
    },
    {
        name: 'State & Local Government',
        color: '#1F2937',
        icon: 'Building',
        description: 'AI applications for government operations and citizen services',
        apps: [
            'Property Appraisal',
            'Law Enforcement',
            'GenAI for Government Programs',
            'GenAI for Constituent Services',
        ],
    },
];

// ─── Architecture Sections ────────────────────────────────────────────────

export const ARCH_SECTIONS: ArchSection[] = [
    {
        title: 'Data Integration',
        items: [
            'SAP Hana', 'Oracle', 'Salesforce', 'IBM Maximo', 'OSI PI', 'GE',
            'AWS IoT', 'Amazon Kinesis', 'Azure Data Lake', 'Weather', 'Commodity Data',
        ],
        color: '#1E40AF',
    },
    {
        title: 'Extensible Data Models',
        items: [
            'Cross-Industry Foundation', 'Reliability', 'Inventory', 'Supply Chain',
            'Energy Management', 'CRM', 'Fraud', 'Aerospace', 'Manufacturing',
            'Financial Services', 'Defense', 'Utilities', 'Healthcare', 'Oil and Gas',
        ],
        color: '#065F46',
    },
    {
        title: 'Data Persistence',
        items: [
            'NoSQL', 'RDBMS', 'Key Value Store', 'Distributed File System',
            'Cloud Object Storage', 'File Systems', 'HDFS',
        ],
        color: '#7C2D12',
    },
    {
        title: 'Connectors & Extensions',
        items: ['Canonical', 'Source', 'Expressions', 'Transform', 'IoT'],
        color: '#4C1D95',
    },
    {
        title: 'ML Framework',
        items: ['ML Pipeline', 'Qsimutron Ex Machina', 'AutoML', 'Feature Store', 'Experiment Tracking'],
        color: '#0369A1',
    },
    {
        title: 'Continuous Analytics',
        items: ['Batch', 'Map Reduce', 'Queue', 'Stream', 'CEP', 'Real-time'],
        color: '#BE185D',
    },
    {
        title: 'Platform Management',
        items: [
            'Access Control', 'Auto Scaling', 'Multitenancy', 'Time Series', 'Analytics',
            'Deployment', 'Profiling', 'Users', 'APIs', 'Encryption', 'Roles',
            'Scheduler', 'Auditing', 'Logging', 'Authentication', 'Monitoring',
            'Systems Management',
        ],
        color: '#374151',
    },
    {
        title: 'App Dev Tools',
        items: ['Jupyter', 'Eclipse', 'R Studio', 'VS Code', 'Git'],
        color: '#0F766E',
    },
    {
        title: 'UI & Viz Tools',
        items: ['Alteryx', 'Domo', 'Qlik', 'MicroStrategy', 'Tableau', 'Grafana'],
        color: '#6D28D9',
    },
    {
        title: 'UI Frameworks',
        items: ['React', 'TypeScript', 'Angular', 'Vue'],
        color: '#DC2626',
    },
];

// ─── Data Sources ─────────────────────────────────────────────────────────

export const DATA_SOURCES: DataSource[] = [
    { name: 'Snowflake', type: 'Data Warehouse', records: '0', status: 'Disconnected', health: 0, lastSync: 'Not configured', region: 'Unconfigured' },
    { name: 'SAP S/4HANA', type: 'ERP System', records: '0', status: 'Disconnected', health: 0, lastSync: 'Not configured', region: 'Unconfigured' },
    { name: 'Azure Data Lake', type: 'Cloud Storage', records: '0', status: 'Disconnected', health: 0, lastSync: 'Not configured', region: 'Unconfigured' },
    { name: 'Salesforce CRM', type: 'CRM Platform', records: '0', status: 'Disconnected', health: 0, lastSync: 'Not configured', region: 'Unconfigured' },
    { name: 'OSI PI Historian', type: 'Time Series', records: '0', status: 'Disconnected', health: 0, lastSync: 'Not configured', region: 'Unconfigured' },
    { name: 'IBM Maximo', type: 'Asset Mgmt', records: '0', status: 'Disconnected', health: 0, lastSync: 'Not configured', region: 'Unconfigured' },
    { name: 'Google BigQuery', type: 'Analytics', records: '0', status: 'Disconnected', health: 0, lastSync: 'Not configured', region: 'Unconfigured' },
    { name: 'Delta Lake', type: 'Data Lakehouse', records: '0', status: 'Disconnected', health: 0, lastSync: 'Not configured', region: 'Unconfigured' },
    { name: 'Apache Kafka', type: 'Event Streaming', records: '0', status: 'Disconnected', health: 0, lastSync: 'Not configured', region: 'Unconfigured' },
    { name: 'AWS Redshift', type: 'Data Warehouse', records: '0', status: 'Disconnected', health: 0, lastSync: 'Not configured', region: 'Unconfigured' },
    { name: 'MongoDB Atlas', type: 'Document Store', records: '0', status: 'Disconnected', health: 0, lastSync: 'Not configured', region: 'Unconfigured' },
    { name: 'Weaviate', type: 'Vector Database', records: '0', status: 'Disconnected', health: 0, lastSync: 'Not configured', region: 'Unconfigured' },
];

// ─── ML Models ────────────────────────────────────────────────────────────

export const MODELS: MLModel[] = [
    { name: 'Reliability Prediction v3.2', type: 'Classification', accuracy: '94.7%', lastTrained: '2025-01-15', status: 'Production', framework: 'XGBoost + LSTM', version: 'v3.2.1', predictions: '2.3M' },
    { name: 'Demand Forecasting v2.1', type: 'Time Series', accuracy: '91.3%', lastTrained: '2025-01-20', status: 'Production', framework: 'TFT + Prophet', version: 'v2.1.0', predictions: '890K' },
    { name: 'Anomaly Detection v4.0', type: 'Unsupervised', accuracy: '97.2%', lastTrained: '2025-02-01', status: 'Production', framework: 'Isolation Forest + AE', version: 'v4.0.3', predictions: '5.1M' },
    { name: 'NLP Document Classifier', type: 'NLP', accuracy: '89.5%', lastTrained: '2024-12-10', status: 'Staging', framework: 'RoBERTa', version: 'v1.4.0', predictions: '120K' },
    { name: 'Supply Chain Optimizer', type: 'Optimization', accuracy: '88.9%', lastTrained: '2025-01-28', status: 'Production', framework: 'OR-Tools + QAOA', version: 'v2.0.1', predictions: '340K' },
    { name: 'Fraud Detection v5.1', type: 'Classification', accuracy: '99.1%', lastTrained: '2025-02-05', status: 'Production', framework: 'GNN (PyG)', version: 'v5.1.2', predictions: '12.6M' },
    { name: 'Churn Prediction v2.0', type: 'Classification', accuracy: '92.8%', lastTrained: '2025-02-10', status: 'Production', framework: 'LightGBM', version: 'v2.0.0', predictions: '1.5M' },
    { name: 'Quantum Portfolio Opt', type: 'Optimization', accuracy: '86.4%', lastTrained: '2025-02-12', status: 'Staging', framework: 'VQE (PennyLane)', version: 'v0.9.1', predictions: '25K' },
];

// ─── Suggestion Queries ───────────────────────────────────────────────────

export const SUGGESTIONS: string[] = [
    'Which turbine is at the highest risk of failure and what should I do about it?',
    'What are the top supply chain bottlenecks this quarter?',
    'Identify anomalies in energy consumption across all facilities',
    'Which customers are most likely to churn in the next 30 days?',
    'Optimize inventory levels for the Q2 production schedule',
    'Show me the fraud detection model performance across all regions',
    'What is the predicted demand for raw materials next quarter?',
    'Analyze equipment reliability trends over the past 6 months',
];

// ─── Agent Modes ──────────────────────────────────────────────────────────

export const AGENT_MODES = [
    'All Agents',
    'ML Insight Agent',
    'Information Retrieval Agent',
    'Dashboard Agent',
    'Optimizer Agent',
    'Action Execution Agent',
] as const;

// ─── Environment Options ──────────────────────────────────────────────────

export const ENVIRONMENTS = ['default', 'production', 'staging', 'development'] as const;

// ─── Studio Tabs ──────────────────────────────────────────────────────────

export const STUDIO_TABS = [
    'Qsimutron Data Studio',
    'Qsimutron Applications Studio',
    'Qsimutron ML Studio',
    'Qsimutron DevOps Studio',
] as const;

// ─── Agent Types for Architecture page ────────────────────────────────────

export const AGENT_TYPES = [
    'ML Insight\nAI Agent',
    'Information Retrieval\nAI Agent',
    'Dashboard\nAI Agent',
    'Optimizer\nAI Agent',
    'Action Execution\nAI Agent',
] as const;

export const DATA_PLATFORMS = [
    'Azure', 'Snowflake', 'Qsimutron', 'Delta Lake', 'BigQuery', 'Gurobi', 'Weaviate', 'Kafka',
] as const;
