import { db } from '../db/client.js';
import { bogleGames, type NewBogleGame } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { checkAuth, sendUnauthorized } from '../utils/auth.js';
import { parseJsonBody } from '../utils/parse.js';

/**
 * POST /api/bogle/games - Create a new game
 */
async function handlePostGame(req: any, res: any): Promise<boolean> {
  if (req.url === '/api/bogle/games' && req.method === 'POST') {
    // Check authentication
    if (!checkAuth(req)) {
      sendUnauthorized(res);
      return true;
    }

    try {
      const body = await parseJsonBody(req);
      
      // Validate required fields
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

      if (!body.gameQuestion || typeof body.gameQuestion !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'gameQuestion is required and must be a string',
        }, null, 2));
        return true;
      }

      // Validate rankType if provided
      if (body.rankType !== undefined && typeof body.rankType !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'rankType must be a string if provided',
        }, null, 2));
        return true;
      }

      // Validate querySchema if provided
      if (body.querySchema !== undefined && typeof body.querySchema !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'querySchema must be a string if provided',
        }, null, 2));
        return true;
      }

      // Create new game record
      const newGame: NewBogleGame = {
        gameDate: body.gameDate,
        gameQuestion: body.gameQuestion,
        rankType: body.rankType || null,
        querySchema: body.querySchema || null,
      };

      // Insert into database
      const [insertedGame] = await db.insert(bogleGames).values(newGame).returning();

      if (!insertedGame) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to create game',
        }, null, 2));
        return true;
      }

      // Ensure optional fields are properly handled (can be null)
      const gameResponse = {
        ...insertedGame,
        rankType: insertedGame.rankType ?? null,
        querySchema: insertedGame.querySchema ?? null,
      };

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: gameResponse,
      }, null, 2));
    } catch (error: any) {
      // Handle unique constraint violation (duplicate date)
      if (error.code === '23505' || error.message?.includes('unique')) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Conflict',
          message: 'A game for this date already exists',
        }, null, 2));
        return true;
      }

      console.error('Error inserting Bogle game:', error);
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
 * GET /api/bogle/games?date=YYYY-MM-DD - Get game by date or all games
 */
async function handleGetGames(req: any, res: any): Promise<boolean> {
  if (req.url?.startsWith('/api/bogle/games') && req.method === 'GET') {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const dateParam = url.searchParams.get('date');

      // If date parameter is provided, get game by date
      if (dateParam) {
        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Bad Request',
            message: 'date must be in YYYY-MM-DD format',
          }, null, 2));
          return true;
        }

        // Query game for the specified date
        const [game] = await db
          .select()
          .from(bogleGames)
          .where(eq(bogleGames.gameDate, dateParam))
          .limit(1);

        if (!game) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Not Found',
            message: `No game found for date ${dateParam}`,
          }, null, 2));
          return true;
        }

        // Ensure optional fields are properly handled (can be null)
        const gameResponse = {
          ...game,
          rankType: game.rankType ?? null,
          querySchema: game.querySchema ?? null,
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          date: dateParam,
          data: gameResponse,
        }, null, 2));
        return true;
      }

      // If no date parameter, get all games
      const games = await db
        .select()
        .from(bogleGames)
        .orderBy(desc(bogleGames.gameDate));

      // Ensure optional fields are properly handled for all games (can be null)
      const gamesResponse = games.map(game => ({
        ...game,
        rankType: game.rankType ?? null,
        querySchema: game.querySchema ?? null,
      }));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        count: gamesResponse.length,
        data: gamesResponse,
      }, null, 2));
    } catch (error) {
      console.error('Error fetching Bogle games:', error);
      console.error('Error details:', error instanceof Error ? error.stack : error);
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
 * PATCH /api/bogle/games/:gameId - Update a game
 */
async function handlePatchGame(req: any, res: any): Promise<boolean> {
  if (req.url?.startsWith('/api/bogle/games/') && req.method === 'PATCH') {
    // Check authentication
    if (!checkAuth(req)) {
      sendUnauthorized(res);
      return true;
    }

    try {
      // Extract gameId from URL
      const urlParts = req.url.split('/');
      const gameIdParam = urlParts[urlParts.length - 1];
      if (!gameIdParam) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'gameId is required in URL path',
        }, null, 2));
        return true;
      }
      const gameId = parseInt(gameIdParam, 10);

      if (isNaN(gameId) || gameId <= 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid gameId in URL path',
        }, null, 2));
        return true;
      }

      // Check if game exists
      const [existingGame] = await db
        .select()
        .from(bogleGames)
        .where(eq(bogleGames.gameId, gameId))
        .limit(1);

      if (!existingGame) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Not Found',
          message: `Game with gameId ${gameId} does not exist`,
        }, null, 2));
        return true;
      }

      const body = await parseJsonBody(req);

      // Build update object - only include fields that are provided
      const updateData: Partial<NewBogleGame> = {};

      if (body.gameDate !== undefined) {
        if (typeof body.gameDate !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Bad Request',
            message: 'gameDate must be a string (YYYY-MM-DD)',
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

        updateData.gameDate = body.gameDate;
      }

      if (body.gameQuestion !== undefined) {
        if (typeof body.gameQuestion !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Bad Request',
            message: 'gameQuestion must be a string',
          }, null, 2));
          return true;
        }

        updateData.gameQuestion = body.gameQuestion;
      }

      if (body.rankType !== undefined) {
        if (body.rankType !== null && typeof body.rankType !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Bad Request',
            message: 'rankType must be a string or null if provided',
          }, null, 2));
          return true;
        }

        updateData.rankType = body.rankType || null;
      }

      if (body.querySchema !== undefined) {
        if (body.querySchema !== null && typeof body.querySchema !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Bad Request',
            message: 'querySchema must be a string or null if provided',
          }, null, 2));
          return true;
        }

        updateData.querySchema = body.querySchema || null;
      }

      // Check if at least one field is being updated
      if (Object.keys(updateData).length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'At least one field (gameDate, gameQuestion, rankType, or querySchema) must be provided for update',
        }, null, 2));
        return true;
      }

      // Update the game
      const [updatedGame] = await db
        .update(bogleGames)
        .set(updateData)
        .where(eq(bogleGames.gameId, gameId))
        .returning();

      if (!updatedGame) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to update game',
        }, null, 2));
        return true;
      }

      // Ensure optional fields are properly handled (can be null)
      const gameResponse = {
        ...updatedGame,
        rankType: updatedGame.rankType ?? null,
        querySchema: updatedGame.querySchema ?? null,
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: gameResponse,
      }, null, 2));
    } catch (error: any) {
      // Handle unique constraint violation (duplicate date)
      if (error.code === '23505' || error.message?.includes('unique')) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Conflict',
          message: 'A game for this date already exists',
        }, null, 2));
        return true;
      }

      console.error('Error updating Bogle game:', error);
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
 * Main handler for Bogle games routes
 * Returns true if the request was handled, false otherwise
 */
export async function handleBogleGames(req: any, res: any): Promise<boolean> {
  return (
    (await handlePostGame(req, res)) ||
    (await handleGetGames(req, res)) ||
    (await handlePatchGame(req, res))
  );
}

