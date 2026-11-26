/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Resource Routes
   Data sources read live from Supabase `data_source_configs` for the user's
   organization (no fake "Connected" / "2.4M records" claims).
   ═══════════════════════════════════════════════════════════════════════════ */

import { Router, type Request, type Response } from 'express';
import { supabaseAdmin } from '../middleware/auth.js';

export const resourcesRouter = Router();

// Supported connector catalog (default Disconnected until configured in data_source_configs)
const CONNECTOR_CATALOG = [
    { name: 'Snowflake', type: 'Data Warehouse', region: 'Unconfigured' },
    { name: 'SAP S/4HANA', type: 'ERP System', region: 'Unconfigured' },
    { name: 'Azure Data Lake', type: 'Cloud Storage', region: 'Unconfigured' },
    { name: 'Salesforce CRM', type: 'CRM Platform', region: 'Unconfigured' },
    { name: 'OSI PI Historian', type: 'Time Series', region: 'Unconfigured' },
    { name: 'IBM Maximo', type: 'Asset Mgmt', region: 'Unconfigured' },
    { name: 'Google BigQuery', type: 'Analytics', region: 'Unconfigured' },
    { name: 'Delta Lake', type: 'Data Lakehouse', region: 'Unconfigured' },
    { name: 'Apache Kafka', type: 'Event Streaming', region: 'Unconfigured' },
    { name: 'AWS Redshift', type: 'Data Warehouse', region: 'Unconfigured' },
    { name: 'MongoDB Atlas', type: 'Document Store', region: 'Unconfigured' },
    { name: 'Weaviate', type: 'Vector Database', region: 'Unconfigured' },
];

const MODELS = [
    { name: 'Reliability Prediction v3.2', type: 'Classification', accuracy: 'N/A', lastTrained: 'Catalog', status: 'Staging', framework: 'XGBoost + LSTM', version: 'v3.2.1', predictions: '0' },
    { name: 'Demand Forecasting v2.1', type: 'Time Series', accuracy: 'N/A', lastTrained: 'Catalog', status: 'Staging', framework: 'TFT + Prophet', version: 'v2.1.0', predictions: '0' },
    { name: 'Anomaly Detection v4.0', type: 'Unsupervised', accuracy: 'N/A', lastTrained: 'Catalog', status: 'Staging', framework: 'Isolation Forest + AE', version: 'v4.0.3', predictions: '0' },
];

const SUITES = [
    { name: 'Asset Performance Suite', color: '#1E40AF', icon: '⚙️', description: 'Optimize asset reliability and lifecycle management', apps: ['Reliability', 'Process Optimization', 'Energy Management', 'Asset Connect'] },
    { name: 'Supply Chain Suite', color: '#065F46', icon: '🔗', description: 'End-to-end supply chain visibility and resilience', apps: ['Inventory Optimization', 'Supply Network Risk', 'Production Schedule', 'Demand Forecasting'] },
    { name: 'Financial Services Suite', color: '#7C2D12', icon: '💰', description: 'AI-powered financial risk management and compliance', apps: ['Anti-Money Laundering', 'Smart Lending', 'Cash Management'] },
    { name: 'Defense & Intelligence Suite', color: '#374151', icon: '🛡️', description: 'Mission-critical AI for national security', apps: ['Readiness', 'Intelligence Analysis', 'Decision Advantage'] },
    { name: 'AI CRM Suite', color: '#4C1D95', icon: '👥', description: 'Intelligent customer relationship management', apps: ['Qsimutron CRM'] },
    { name: 'Sustainability Suite', color: '#064E3B', icon: '🌱', description: 'ESG monitoring, carbon tracking, and sustainability reporting', apps: ['Energy Management', 'ESG'] },
    { name: 'State & Local Government', color: '#1F2937', icon: '🏛️', description: 'AI applications for government operations', apps: ['Property Appraisal', 'Law Enforcement', 'GenAI for Government Programs'] },
];

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

resourcesRouter.get('/data-sources', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('data_source_configs')
            .select('id, name, source_type, status, record_count, last_sync_at, error_message, metadata')
            .eq('organization_id', req.organizationId!)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (data && data.length > 0) {
            return res.json(data.map(row => ({
                id: row.id,
                name: row.name,
                type: row.source_type,
                records: String(row.record_count ?? 0),
                status: row.error_message ? 'Error' : (row.status === 'connected' ? 'Connected' : 'Disconnected'),
                health: row.error_message ? 0 : (row.status === 'connected' ? 100 : 0),
                lastSync: row.last_sync_at ? new Date(row.last_sync_at).toISOString() : 'Never',
                region: (row.metadata as Record<string, unknown>)?.region || 'Custom',
                configured: true,
            })));
        }

        // Honest unconfigured catalog — zero fake "Connected" or fake record counts
        return res.json(CONNECTOR_CATALOG.map(c => ({
            name: c.name,
            type: c.type,
            records: '0',
            status: 'Disconnected',
            health: 0,
            lastSync: 'Not configured',
            region: c.region,
            configured: false,
        })));
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

resourcesRouter.get('/models', (_req, res) => res.json(MODELS));
resourcesRouter.get('/suites', (_req, res) => res.json(SUITES));
resourcesRouter.get('/architecture', (_req, res) => res.json(ARCH_SECTIONS));
