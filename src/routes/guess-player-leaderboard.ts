import { db } from '../db/client.js';
import { guessPlayerLeaderboard, type NewGuessPlayerLeaderboard } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { checkAuth, sendUnauthorized } from '../utils/auth.js';
import { parseJsonBody } from '../utils/parse.js';

/**
 * POST /api/guess-player-leaderboard - Submit a new guess
 */
async function handlePostGuess(req: any, res: any): Promise<boolean> {
  if (req.url === '/api/guess-player-leaderboard' && req.method === 'POST') {
    // Check authentication
    if (!checkAuth(req)) {
      sendUnauthorized(res);
      return true;
    }

    try {
      const body = await parseJsonBody(req);
      
      // Validate required fields
      if (!body.userName || typeof body.userName !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'userName is required and must be a string',
        }, null, 2));
        return true;
      }

      if (typeof body.score !== 'number' || body.score < 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'score is required and must be a non-negative number',
        }, null, 2));
        return true;
      }

      if (!body.gameDate || typeof body.gameDate !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'gameDate is required and must be a string (YYYY-MM-DD)',
        }, null, 2));
        return true;
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.gameDate)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'gameDate must be in YYYY-MM-DD format',
        }, null, 2));
        return true;
      }

      if (!body.playerIdSeason || typeof body.playerIdSeason !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'playerIdSeason is required and must be a string (format: "playerId-season", e.g., "246-2026")',
        }, null, 2));
        return true;
      }

      // Validate playerIdSeason format (e.g., "246-2026")
      if (!/^\d+-\d{4}$/.test(body.playerIdSeason)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'playerIdSeason must be in format "playerId-season" (e.g., "246-2026")',
        }, null, 2));
        return true;
      }

      // Create new guess record
      const newGuess: NewGuessPlayerLeaderboard = {
        userName: body.userName,
        score: Math.round(body.score),
        gameDate: body.gameDate,
        playerIdSeason: body.playerIdSeason,
      };

      // Insert into database
      const [insertedGuess] = await db.insert(guessPlayerLeaderboard).values(newGuess).returning();

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: insertedGuess,
      }, null, 2));
    } catch (error: any) {
      console.error('Error inserting guess:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, null, 2));
    }
    return true;
  }
  return false;
}

/**
 * GET /api/guess-player-leaderboard/:id - Get a guess by ID
 */
async function handleGetGuessById(req: any, res: any): Promise<boolean> {
  if (req.url?.startsWith('/api/guess-player-leaderboard/') && req.method === 'GET') {
    try {
      // Extract guess ID from URL
      const urlParts = req.url.split('/');
      const guessIdParam = urlParts[urlParts.length - 1];
      
      if (!guessIdParam) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'guess ID is required in URL path',
        }, null, 2));
        return true;
      }

      const guessId = parseInt(guessIdParam, 10);

      if (isNaN(guessId) || guessId <= 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid guess ID in URL path',
        }, null, 2));
        return true;
      }

      // Query guess by ID
      const [guess] = await db
        .select()
        .from(guessPlayerLeaderboard)
        .where(eq(guessPlayerLeaderboard.id, guessId))
        .limit(1);

      if (!guess) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Not Found',
          message: `Guess with ID ${guessId} does not exist`,
        }, null, 2));
        return true;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: guess,
      }, null, 2));
    } catch (error) {
      console.error('Error fetching guess:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, null, 2));
    }
    return true;
  }
  return false;
}

/**
 * GET /api/guess-player-leaderboard/player?playerIdSeason=246-2026 - Get all guesses for a specific player
 */
async function handleGetGuessesByPlayer(req: any, res: any): Promise<boolean> {
  // Match /api/guess-player-leaderboard/player with query params
  if (req.url?.startsWith('/api/guess-player-leaderboard/player') && req.method === 'GET') {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const playerIdSeasonParam = url.searchParams.get('playerIdSeason');

      if (!playerIdSeasonParam) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'playerIdSeason query parameter is required (format: "playerId-season", e.g., "246-2026")',
        }, null, 2));
        return true;
      }

      // Validate playerIdSeason format
      if (!/^\d+-\d{4}$/.test(playerIdSeasonParam)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'playerIdSeason must be in format "playerId-season" (e.g., "246-2026")',
        }, null, 2));
        return true;
      }

      // Query guesses for the specified player
      const guesses = await db
        .select()
        .from(guessPlayerLeaderboard)
        .where(eq(guessPlayerLeaderboard.playerIdSeason, playerIdSeasonParam))
        .orderBy(desc(guessPlayerLeaderboard.score), desc(guessPlayerLeaderboard.createdAt));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        playerIdSeason: playerIdSeasonParam,
        count: guesses.length,
        data: guesses,
      }, null, 2));
    } catch (error) {
      console.error('Error fetching guesses by player:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, null, 2));
    }
    return true;
  }
  return false;
}

/**
 * DELETE /api/guess-player-leaderboard/:id - Delete a guess by ID
 */
async function handleDeleteGuess(req: any, res: any): Promise<boolean> {
  if (req.url?.startsWith('/api/guess-player-leaderboard/') && req.method === 'DELETE') {
    // Check authentication
    if (!checkAuth(req)) {
      sendUnauthorized(res);
      return true;
    }

    try {
      // Extract guess ID from URL
      const urlParts = req.url.split('/');
      const guessIdParam = urlParts[urlParts.length - 1];
      
      if (!guessIdParam) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'guess ID is required in URL path',
        }, null, 2));
        return true;
      }

      const guessId = parseInt(guessIdParam, 10);

      if (isNaN(guessId) || guessId <= 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid guess ID in URL path',
        }, null, 2));
        return true;
      }

      // Check if guess exists
      const [existingGuess] = await db
        .select()
        .from(guessPlayerLeaderboard)
        .where(eq(guessPlayerLeaderboard.id, guessId))
        .limit(1);

      if (!existingGuess) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Not Found',
          message: `Guess with ID ${guessId} does not exist`,
        }, null, 2));
        return true;
      }

      // Delete the guess
      await db
        .delete(guessPlayerLeaderboard)
        .where(eq(guessPlayerLeaderboard.id, guessId));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: `Guess with ID ${guessId} has been deleted`,
        deletedGuess: existingGuess,
      }, null, 2));
    } catch (error) {
      console.error('Error deleting guess:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, null, 2));
    }
    return true;
  }
  return false;
}

/**
 * Main handler for guess player leaderboard routes
 * Returns true if the request was handled, false otherwise
 */
export async function handleGuessPlayerLeaderboard(req: any, res: any): Promise<boolean> {
  return (
    (await handlePostGuess(req, res)) ||
    (await handleGetGuessesByPlayer(req, res)) || // Check query param route before ID route
    (await handleGetGuessById(req, res)) ||
    (await handleDeleteGuess(req, res))
  );
}
