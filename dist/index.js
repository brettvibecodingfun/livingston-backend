import { createServer } from 'node:http';
import dotenv from 'dotenv';
import { db, pool } from './db/client.js';
// Load environment variables
dotenv.config();
const PORT = process.env.PORT || 3000;
/**
 * Simple health check endpoint
 */
const server = createServer(async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    // Health check endpoint
    if (req.url === '/health' || req.url === '/') {
        try {
            // Test database connection
            const result = await db.execute('SELECT NOW() as now');
            const dbStatus = result.rows.length > 0 ? 'connected' : 'disconnected';
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'ok',
                timestamp: new Date().toISOString(),
                service: 'livingston-backend',
                version: '1.0.0',
                database: {
                    status: dbStatus,
                    timestamp: result.rows[0]?.now,
                },
                uptime: process.uptime(),
            }, null, 2));
        }
        catch (error) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'error',
                timestamp: new Date().toISOString(),
                service: 'livingston-backend',
                database: {
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            }, null, 2));
        }
        return;
    }
    // Ping endpoint
    if (req.url === '/ping') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('pong');
        return;
    }
    // 404 for all other routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        error: 'Not Found',
        message: 'Available endpoints: /health, /ping',
    }, null, 2));
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    server.close(async () => {
        await pool.end();
        console.log('✅ Server closed');
        process.exit(0);
    });
});
process.on('SIGINT', async () => {
    console.log('\n🛑 SIGINT received, shutting down gracefully...');
    server.close(async () => {
        await pool.end();
        console.log('✅ Server closed');
        process.exit(0);
    });
});
// Start server
server.listen(PORT, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏀 Livingston Backend - NBA Stats ETL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`🏓 Ping: http://localhost:${PORT}/ping`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
//# sourceMappingURL=index.js.map