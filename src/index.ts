import { createServer } from 'node:http';
import dotenv from 'dotenv';
import { pool } from './db/client.js';
import { swaggerSpec, getSwaggerHtml } from './swagger.js';
import { handleHealth } from './routes/health.js';
import { handleBogleGames } from './routes/bogle-games.js';
import { handleBogleScores } from './routes/bogle-scores.js';
import { handleGuessPlayerLeaderboard } from './routes/guess-player-leaderboard.js';
import { handleClusters } from './routes/clusters.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

/**
 * Main server handler
 */
const server = createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Swagger UI endpoint
  if (req.url === '/api-docs' || req.url === '/swagger') {
    // Detect protocol from headers (Render sets x-forwarded-proto)
    const protocol = req.headers['x-forwarded-proto'] || (req.headers.host?.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${protocol}://${req.headers.host}`;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getSwaggerHtml(baseUrl));
    return;
  }

  // OpenAPI JSON spec endpoint
  if (req.url === '/api-docs.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(swaggerSpec, null, 2));
    return;
  }

  // Route to health endpoints
  if (await handleHealth(req, res)) {
    return;
  }

  // Route to Bogle games endpoints
  if (await handleBogleGames(req, res)) {
    return;
  }

  // Route to Bogle scores endpoints
  if (await handleBogleScores(req, res)) {
    return;
  }

  // Route to guess player leaderboard endpoints
  if (await handleGuessPlayerLeaderboard(req, res)) {
    return;
  }

  // Route to clusters endpoints
  if (await handleClusters(req, res)) {
    return;
  }

  // 404 for all other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not Found',
    message: 'Available endpoints: /health, /ping, POST /api/bogle/games, PATCH /api/bogle/games/:gameId, GET /api/bogle/games, GET /api/bogle/games?date=YYYY-MM-DD, POST /api/bogle/scores, DELETE /api/bogle/scores/:id, GET /api/bogle/scores?date=YYYY-MM-DD, POST /api/guess-player-leaderboard, GET /api/guess-player-leaderboard/:id, GET /api/guess-player-leaderboard/player?playerIdSeason=246-2026, DELETE /api/guess-player-leaderboard/:id, GET /api/clusters?age=24&clusterNumber=4, GET /api/clusters/player?name=PlayerName',
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
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`🎮 POST /api/bogle/games - Create a new game`);
  console.log(`✏️  PATCH /api/bogle/games/:gameId - Update a game`);
  console.log(`📋 GET /api/bogle/games - Get all games`);
  console.log(`📅 GET /api/bogle/games?date=YYYY-MM-DD - Get game by date`);
  console.log(`🎮 POST /api/bogle/scores - Submit a score`);
  console.log(`🗑️  DELETE /api/bogle/scores/:id - Delete a score by ID`);
  console.log(`📊 GET /api/bogle/scores?date=YYYY-MM-DD - Get scores by date`);
  console.log(`🎯 POST /api/guess-player-leaderboard - Submit a guess`);
  console.log(`📋 GET /api/guess-player-leaderboard/:id - Get guess by ID`);
  console.log(`👤 GET /api/guess-player-leaderboard/player?playerIdSeason=246-2026 - Get guesses by player`);
  console.log(`🗑️  DELETE /api/guess-player-leaderboard/:id - Delete a guess by ID`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
