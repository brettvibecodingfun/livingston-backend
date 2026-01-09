import { db } from '../db/client.js';

/**
 * Health check endpoint handler
 * Returns true if the request was handled, false otherwise
 */
export async function handleHealth(req: any, res: any): Promise<boolean> {
  // Health check endpoint
  if (req.url === '/health' || req.url === '/') {
    try {
      // Test database connection
      const result = await db.execute<{ now: Date }>(
        'SELECT NOW() as now'
      );
      
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
    } catch (error) {
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
    return true;
  }

  // Ping endpoint
  if (req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('pong');
    return true;
  }

  return false;
}

