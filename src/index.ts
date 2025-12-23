import { createServer } from 'node:http';
import dotenv from 'dotenv';
import { db, pool } from './db/client.js';
import { bogleScores, type NewBogleScore } from './db/schema.js';
import { eq, desc, asc } from 'drizzle-orm';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

/**
 * Helper function to parse JSON from request body
 */
async function parseJsonBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Simple health check endpoint
 */
const server = createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
    return;
  }

  // Ping endpoint
  if (req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('pong');
    return;
  }

  // POST /api/bogle/scores - Submit a new score
  if (req.url === '/api/bogle/scores' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      
      // Validate required fields
      if (!body.username || typeof body.username !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'username is required and must be a string',
        }, null, 2));
        return;
      }

      if (typeof body.gameScore !== 'number' || body.gameScore < 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'gameScore is required and must be a non-negative number',
        }, null, 2));
        return;
      }

      if (!body.gameDate || typeof body.gameDate !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'gameDate is required and must be a string (YYYY-MM-DD)',
        }, null, 2));
        return;
      }

      if (!body.gameQuestion || typeof body.gameQuestion !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'gameQuestion is required and must be a string',
        }, null, 2));
        return;
      }

      // Validate timeTaken if provided
      if (body.timeTaken !== undefined && (typeof body.timeTaken !== 'number' || body.timeTaken < 0)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'timeTaken must be a non-negative number if provided',
        }, null, 2));
        return;
      }

      // Create new score record
      const newScore: NewBogleScore = {
        username: body.username,
        gameScore: Math.round(body.gameScore),
        gameDate: body.gameDate,
        gameQuestion: body.gameQuestion,
        timeTaken: body.timeTaken !== undefined ? Math.round(body.timeTaken) : null,
      };

      // Insert into database
      const [insertedScore] = await db.insert(bogleScores).values(newScore).returning();

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: insertedScore,
      }, null, 2));
    } catch (error: any) {
      // Handle unique constraint violation (duplicate submission)
      if (error.code === '23505' || error.message?.includes('unique')) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Conflict',
          message: 'A score for this username, date, and question already exists',
        }, null, 2));
        return;
      }

      console.error('Error inserting Bogle score:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, null, 2));
    }
    return;
  }

  // GET /api/bogle/scores?date=YYYY-MM-DD - Get all scores for a specific date
  if (req.url?.startsWith('/api/bogle/scores') && req.method === 'GET') {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const dateParam = url.searchParams.get('date');

      if (!dateParam) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'date query parameter is required (format: YYYY-MM-DD)',
        }, null, 2));
        return;
      }

      // Validate date format (basic check)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'date must be in YYYY-MM-DD format',
        }, null, 2));
        return;
      }

      // Query scores for the specified date, ordered by score (descending) then timeTaken (ascending)
      const scores = await db
        .select()
        .from(bogleScores)
        .where(eq(bogleScores.gameDate, dateParam))
        .orderBy(desc(bogleScores.gameScore), asc(bogleScores.timeTaken));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        date: dateParam,
        count: scores.length,
        data: scores,
      }, null, 2));
    } catch (error) {
      console.error('Error fetching Bogle scores:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, null, 2));
    }
    return;
  }

  // 404 for all other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not Found',
    message: 'Available endpoints: /health, /ping, POST /api/bogle/scores, GET /api/bogle/scores?date=YYYY-MM-DD',
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
  console.log(`🎮 POST /api/bogle/scores - Submit a score`);
  console.log(`📊 GET /api/bogle/scores?date=YYYY-MM-DD - Get scores by date`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

