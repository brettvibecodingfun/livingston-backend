import { db } from '../db/client.js';
import { bogleScores, bogleGames, type NewBogleScore } from '../db/schema.js';
import { eq, desc, asc } from 'drizzle-orm';
import { checkAuth, sendUnauthorized } from '../utils/auth.js';
import { parseJsonBody } from '../utils/parse.js';

/**
 * POST /api/bogle/scores - Submit a new score
 */
async function handlePostScore(req: any, res: any): Promise<boolean> {
  if (req.url === '/api/bogle/scores' && req.method === 'POST') {
    // Check authentication
    if (!checkAuth(req)) {
      sendUnauthorized(res);
      return true;
    }

    try {
      const body = await parseJsonBody(req);
      
      // Validate required fields
      if (!body.username || typeof body.username !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'username is required and must be a string',
        }, null, 2));
        return true;
      }

      if (typeof body.gameScore !== 'number' || body.gameScore < 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'gameScore is required and must be a non-negative number',
        }, null, 2));
        return true;
      }

      if (!body.gameId || typeof body.gameId !== 'number') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'gameId is required and must be a number',
        }, null, 2));
        return true;
      }

      // Validate that the game exists
      const [game] = await db
        .select()
        .from(bogleGames)
        .where(eq(bogleGames.gameId, body.gameId))
        .limit(1);

      if (!game) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Not Found',
          message: `Game with gameId ${body.gameId} does not exist`,
        }, null, 2));
        return true;
      }

      // Validate timeTaken if provided
      if (body.timeTaken !== undefined && (typeof body.timeTaken !== 'number' || body.timeTaken < 0)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'timeTaken must be a non-negative number if provided',
        }, null, 2));
        return true;
      }

      // Validate answersCorrect if provided
      if (body.answersCorrect !== undefined) {
        if (!Array.isArray(body.answersCorrect)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Bad Request',
            message: 'answersCorrect must be an array of strings if provided',
          }, null, 2));
          return true;
        }
        if (!body.answersCorrect.every((item: any) => typeof item === 'string')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Bad Request',
            message: 'answersCorrect must be an array of strings if provided',
          }, null, 2));
          return true;
        }
      }

      // Validate answersMissed if provided
      if (body.answersMissed !== undefined) {
        if (!Array.isArray(body.answersMissed)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Bad Request',
            message: 'answersMissed must be an array of strings if provided',
          }, null, 2));
          return true;
        }
        if (!body.answersMissed.every((item: any) => typeof item === 'string')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Bad Request',
            message: 'answersMissed must be an array of strings if provided',
          }, null, 2));
          return true;
        }
      }

      // Create new score record
      const newScore: NewBogleScore = {
        gameId: Math.round(body.gameId),
        username: body.username,
        gameScore: Math.round(body.gameScore),
        gameDate: game.gameDate,
        gameQuestion: game.gameQuestion,
        timeTaken: body.timeTaken !== undefined ? Math.round(body.timeTaken) : null,
        answersCorrect: body.answersCorrect !== undefined ? body.answersCorrect : null,
        answersMissed: body.answersMissed !== undefined ? body.answersMissed : null,
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
          message: 'A score for this username and game already exists',
        }, null, 2));
        return true;
      }

      console.error('Error inserting Bogle score:', error);
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
 * DELETE /api/bogle/scores/:id - Delete a score by ID
 */
async function handleDeleteScore(req: any, res: any): Promise<boolean> {
  if (req.url?.startsWith('/api/bogle/scores/') && req.method === 'DELETE') {
    // Check authentication
    if (!checkAuth(req)) {
      sendUnauthorized(res);
      return true;
    }

    try {
      // Extract score ID from URL
      const urlParts = req.url.split('/');
      const scoreIdParam = urlParts[urlParts.length - 1];
      if (!scoreIdParam) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'score ID is required in URL path',
        }, null, 2));
        return true;
      }
      const scoreId = parseInt(scoreIdParam, 10);

      if (isNaN(scoreId) || scoreId <= 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid score ID in URL path',
        }, null, 2));
        return true;
      }

      // Check if score exists
      const [existingScore] = await db
        .select()
        .from(bogleScores)
        .where(eq(bogleScores.id, scoreId))
        .limit(1);

      if (!existingScore) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Not Found',
          message: `Score with ID ${scoreId} does not exist`,
        }, null, 2));
        return true;
      }

      // Delete the score
      await db
        .delete(bogleScores)
        .where(eq(bogleScores.id, scoreId));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: `Score with ID ${scoreId} has been deleted`,
        deletedScore: existingScore,
      }, null, 2));
    } catch (error) {
      console.error('Error deleting Bogle score:', error);
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
 * GET /api/bogle/scores?date=YYYY-MM-DD - Get all scores for a specific date
 */
async function handleGetScores(req: any, res: any): Promise<boolean> {
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
        return true;
      }

      // Validate date format (basic check)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'date must be in YYYY-MM-DD format',
        }, null, 2));
        return true;
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
    return true;
  }
  return false;
}

/**
 * Main handler for Bogle scores routes
 * Returns true if the request was handled, false otherwise
 */
export async function handleBogleScores(req: any, res: any): Promise<boolean> {
  return (
    (await handlePostScore(req, res)) ||
    (await handleDeleteScore(req, res)) ||
    (await handleGetScores(req, res))
  );
}

