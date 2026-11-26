/* ═══════════════════════════════════════════════════════════════════════════
   Q-Simutron Platform — Server Entry Point
   Express + WebSocket server with CORS, JSON, and morgan logging.
   ═══════════════════════════════════════════════════════════════════════════ */

import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config.js';
import { sessionsRouter } from './routes/sessions.js';
import { simulateRouter } from './routes/simulate.js';
import { modulesRouter } from './routes/modules.js';
import { resourcesRouter } from './routes/resources.js';
import { agentsRouter } from './routes/agents.js';
import { researchRouter } from './routes/research.js';
import { monitoringRouter } from './routes/monitoring.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createWebSocketServer } from './ws.js';
import { requireAuth } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();

app.use(cors({
    origin: (origin, callback) => {
        // Allow same-origin / server-to-server (no Origin header) and curl
        if (!origin) return callback(null, true);
        const allowed =
            config.corsOrigins.includes('*') ||
            config.corsOrigins.includes(origin) ||
            /\.vercel\.app$/.test(new URL(origin).hostname); // any Vercel preview/prod URL
        return allowed ? callback(null, true) : callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        model: config.model,
    });
});

// ─── Static Files ────────────────────────────────────────────────────────────
// Present only in full-stack (single-host) deploys. On a backend-only host
// (e.g. Render API service with the frontend on Vercel) this folder won't exist.

const staticPath = path.join(__dirname, '../../frontend/dist');
const hasFrontend = fs.existsSync(path.join(staticPath, 'index.html'));
if (hasFrontend) app.use(express.static(staticPath));

// ─── API Routes ──────────────────────────────────────────────────────────────

app.use('/api/sessions', requireAuth, simulateRouter);
app.use('/api/sessions', requireAuth, sessionsRouter);
app.use('/api/modules', requireAuth, modulesRouter);
app.use('/api/agents', requireAuth, agentsRouter);
app.use('/api', requireAuth, resourcesRouter);
app.use('/api/research', requireAuth, researchRouter);
app.use('/api/monitoring', requireAuth, monitoringRouter);

// ─── SPA Fallback ────────────────────────────────────────────────────────────

app.get('*', (_req, res) => {
    if (_req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    if (hasFrontend) {
        return res.sendFile(path.join(staticPath, 'index.html'));
    }
    // Backend-only deploy: the SPA lives on Vercel, this host just serves the API.
    return res.json({ service: 'q-simutron-backend', status: 'ok', api: '/api' });
});

// ─── Error Handler ───────────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Server] Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// ─── HTTP + WebSocket Server ─────────────────────────────────────────────────

const server = http.createServer(app);
createWebSocketServer(server);

server.listen(config.port, '0.0.0.0', () => {
    console.log(`\n╔════════════════════════════════════════════════╗`);
    console.log(`║  🚀 Q-Simutron Platform — Backend         ║`);
    console.log(`║     http://localhost:${config.port}                      ║`);
    console.log(`║     WebSocket: ws://localhost:${config.port}/ws          ║`);
    console.log(`║     CORS Origin: ${config.corsOrigin.padEnd(28)} ║`);
    console.log(`╚════════════════════════════════════════════════╝\n`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received, shutting down...');
    server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
    console.log('[Server] SIGINT received, shutting down...');
    server.close(() => process.exit(0));
});
