// OpenAPI 3.0 specification
export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Livingston Backend API',
    version: '1.0.0',
    description: 'API documentation for Livingston Backend - NBA Stats ETL and Bogle Game',
  },
  servers: [
    {
      url: 'https://livingston-backend.onrender.com',
      description: 'Production server',
    }
  ],
  tags: [
    {
      name: 'Health',
      description: 'Health check and status endpoints',
    },
    {
      name: 'Bogle Games',
      description: 'Endpoints for managing daily Bogle games',
    },
    {
      name: 'Bogle Scores',
      description: 'Endpoints for managing player scores',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns server and database status',
        responses: {
          '200': {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                    service: { type: 'string', example: 'livingston-backend' },
                    version: { type: 'string', example: '1.0.0' },
                    database: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'connected' },
                        timestamp: { type: 'string', format: 'date-time' },
                      },
                    },
                    uptime: { type: 'number', example: 12345.67 },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/ping': {
      get: {
        tags: ['Health'],
        summary: 'Ping endpoint',
        description: 'Simple ping/pong endpoint',
        responses: {
          '200': {
            description: 'Pong response',
            content: {
              'text/plain': {
                schema: { type: 'string', example: 'pong' },
              },
            },
          },
        },
      },
    },
    '/api/bogle/games': {
      post: {
        tags: ['Bogle Games'],
        summary: 'Create a new game',
        description: 'Create a new daily Bogle game',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['gameDate', 'gameQuestion'],
                properties: {
                  gameDate: {
                    type: 'string',
                    format: 'date',
                    example: '2026-01-01',
                    description: 'Date in YYYY-MM-DD format',
                  },
                  gameQuestion: {
                    type: 'string',
                    example: 'Name the top scorers under the age of 25',
                  },
                  rankType: {
                    type: 'string',
                    nullable: true,
                    description: 'Optional: Type of ranking (e.g., "rebounds per game", "assists per game")',
                    example: 'rebounds per game',
                  },
                  querySchema: {
                    type: 'string',
                    nullable: true,
                    description: 'Optional: Schema/query definition for the game',
                    example: '{"filters": {"age": {"max": 25}}}',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Game created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/BogleGame' },
                  },
                },
              },
            },
          },
          '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Unauthorized - Valid API key required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: 'Conflict - Game for this date already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      get: {
        tags: ['Bogle Games'],
        summary: 'Get all games or game by date',
        description: 'Get all games (ordered by date) or a specific game by date query parameter',
        parameters: [
          {
            name: 'date',
            in: 'query',
            description: 'Date in YYYY-MM-DD format to get a specific game',
            required: false,
            schema: {
              type: 'string',
              format: 'date',
              example: '2026-01-01',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        count: { type: 'integer' },
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/BogleGame' },
                        },
                      },
                    },
                    {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        date: { type: 'string' },
                        data: { $ref: '#/components/schemas/BogleGame' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Game not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/bogle/games/{gameId}': {
      patch: {
        tags: ['Bogle Games'],
        summary: 'Update a game',
        description: 'Update gameDate, gameQuestion, rankType, and/or querySchema for an existing game',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          {
            name: 'gameId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'ID of the game to update',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  gameDate: {
                    type: 'string',
                    format: 'date',
                    example: '2026-01-01',
                  },
                  gameQuestion: {
                    type: 'string',
                    example: 'Updated question text',
                  },
                  rankType: {
                    type: 'string',
                    nullable: true,
                    description: 'Optional: Type of ranking (e.g., "rebounds per game", "assists per game")',
                    example: 'assists per game',
                  },
                  querySchema: {
                    type: 'string',
                    nullable: true,
                    description: 'Optional: Schema/query definition for the game',
                    example: '{"filters": {"age": {"max": 25}}}',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Game updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/BogleGame' },
                  },
                },
              },
            },
          },
          '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Unauthorized - Valid API key required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Game not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: 'Conflict - Game for this date already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/bogle/scores': {
      post: {
        tags: ['Bogle Scores'],
        summary: 'Submit a score',
        description: 'Submit a new player score for a Bogle game',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'gameScore', 'gameId'],
                properties: {
                  username: {
                    type: 'string',
                    example: 'player123',
                  },
                  gameScore: {
                    type: 'integer',
                    minimum: 0,
                    example: 85,
                  },
                  gameId: {
                    type: 'integer',
                    example: 1,
                  },
                  timeTaken: {
                    type: 'integer',
                    nullable: true,
                    minimum: 0,
                    example: 120,
                    description: 'Time taken in seconds (optional)',
                  },
                  answersCorrect: {
                    type: 'array',
                    items: { type: 'string' },
                    nullable: true,
                    example: ['LeBron James', 'Stephen Curry', 'Kevin Durant'],
                    description: 'Array of correct answers (optional)',
                  },
                  answersMissed: {
                    type: 'array',
                    items: { type: 'string' },
                    nullable: true,
                    example: ['Kawhi Leonard', 'Giannis Antetokounmpo'],
                    description: 'Array of missed answers (optional)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Score created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/BogleScore' },
                  },
                },
              },
            },
          },
          '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Unauthorized - Valid API key required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Game not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: 'Conflict - Score already exists for this user and game', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/bogle/scores/{id}': {
      delete: {
        tags: ['Bogle Scores'],
        summary: 'Delete a score',
        description: 'Delete a score by its ID',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'ID of the score to delete',
          },
        ],
        responses: {
          '200': {
            description: 'Score deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    deletedScore: { $ref: '#/components/schemas/BogleScore' },
                  },
                },
              },
            },
          },
          '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Unauthorized - Valid API key required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Score not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/bogle/scores?date={date}': {
      get: {
        tags: ['Bogle Scores'],
        summary: 'Get scores by date',
        description: 'Get all scores for a specific date, ordered by score (descending) then timeTaken (ascending)',
        parameters: [
          {
            name: 'date',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              format: 'date',
              example: '2026-01-01',
            },
            description: 'Date in YYYY-MM-DD format',
          },
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    date: { type: 'string' },
                    count: { type: 'integer' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/BogleScore' },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for authentication. Can also be provided in Authorization header as Bearer token.',
      },
    },
    schemas: {
      BogleGame: {
        type: 'object',
        properties: {
          gameId: {
            type: 'integer',
            description: 'Auto-incrementing game ID',
            example: 1,
          },
          gameDate: {
            type: 'string',
            format: 'date',
            description: 'Date of the game in YYYY-MM-DD format',
            example: '2026-01-01',
          },
          gameQuestion: {
            type: 'string',
            description: 'The question text/data for the game',
            example: 'Name the top scorers under the age of 25',
          },
          rankType: {
            type: 'string',
            nullable: true,
            description: 'Optional: Type of ranking (e.g., "rebounds per game", "assists per game")',
            example: 'rebounds per game',
          },
          querySchema: {
            type: 'string',
            nullable: true,
            description: 'Optional: Schema/query definition for the game',
            example: '{"filters": {"age": {"max": 25}}}',
          },
        },
        required: ['gameId', 'gameDate', 'gameQuestion'],
      },
      BogleScore: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Auto-incrementing score ID',
            example: 1,
          },
          gameId: {
            type: 'integer',
            description: 'ID of the game this score is for',
            example: 1,
          },
          username: {
            type: 'string',
            description: "Player's username",
            example: 'player123',
          },
          gameScore: {
            type: 'integer',
            description: "Player's score",
            example: 85,
          },
          gameDate: {
            type: 'string',
            format: 'date',
            description: 'Date of the game',
            example: '2026-01-01',
          },
          gameQuestion: {
            type: 'string',
            description: 'The question for this game',
            example: 'Name the top scorers under the age of 25',
          },
          timeTaken: {
            type: 'integer',
            nullable: true,
            description: 'Time taken in seconds',
            example: 120,
          },
          answersCorrect: {
            type: 'array',
            items: { type: 'string' },
            nullable: true,
            description: 'Array of correct answers',
            example: ['LeBron James', 'Stephen Curry', 'Kevin Durant'],
          },
          answersMissed: {
            type: 'array',
            items: { type: 'string' },
            nullable: true,
            description: 'Array of missed answers',
            example: ['Kawhi Leonard', 'Giannis Antetokounmpo'],
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the score was created',
            example: '2024-01-15T10:30:00.000Z',
          },
        },
        required: ['id', 'gameId', 'username', 'gameScore', 'gameDate', 'gameQuestion', 'createdAt'],
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            example: 'Bad Request',
          },
          message: {
            type: 'string',
            example: 'Invalid request data',
          },
        },
        required: ['error', 'message'],
      },
    },
  },
};

// Helper function to serve Swagger UI HTML
export function getSwaggerHtml(baseUrl: string = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Livingston Backend API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "${baseUrl}/api-docs.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;
}

