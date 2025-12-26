# API Documentation - Livingston Backend

## Base URL
```
http://localhost:3000
```

## CORS
All endpoints support CORS with:
- **Access-Control-Allow-Origin**: `*`
- **Access-Control-Allow-Methods**: `GET, POST, PATCH, OPTIONS`
- **Access-Control-Allow-Headers**: `Content-Type`

---

## Health & Status Endpoints

### GET `/health` or `/`
Health check endpoint that verifies server and database connectivity.

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "livingston-backend",
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "uptime": 12345.67
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "error",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "livingston-backend",
  "database": {
    "status": "error",
    "error": "Connection failed"
  }
}
```

**Example:**
```bash
curl http://localhost:3000/health
```

---

### GET `/ping`
Simple ping/pong endpoint for basic connectivity check.

**Response (200 OK):**
```
pong
```

**Example:**
```bash
curl http://localhost:3000/ping
```

---

## Bogle Games Endpoints

### POST `/api/bogle/games`
Create a new daily Bogle game.

**Request Body:**
```json
{
  "gameDate": "2025-12-23",
  "gameQuestion": "Name the top scorers under the age of 25",
  "rankType": "rebounds per game"
}
```

**Required Fields:**
- `gameDate` (string): Date in `YYYY-MM-DD` format
- `gameQuestion` (string): The question text/data for the game

**Optional Fields:**
- `rankType` (string): Type of ranking (e.g., "rebounds per game", "assists per game", "points per game")

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "gameId": 1,
    "gameDate": "2025-12-23",
    "gameQuestion": "Name the top scorers under the age of 25"
  }
}
```

**Error Responses:**
- **400 Bad Request**: Missing or invalid fields
- **409 Conflict**: A game for this date already exists
- **500 Internal Server Error**: Server error

**Example:**
```bash
curl -X POST http://localhost:3000/api/bogle/games \
  -H "Content-Type: application/json" \
  -d '{
    "gameDate": "2025-12-23",
    "gameQuestion": "Name the top scorers under the age of 25",
    "rankType": "rebounds per game"
  }'
```

---

### GET `/api/bogle/games`
Get all Bogle games, ordered by date (newest first).

**Response (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "gameId": 2,
      "gameId": 2,
      "gameDate": "2025-12-24",
      "gameQuestion": "Name the top rebounders",
      "rankType": "rebounds per game"
    },
    {
      "gameId": 1,
      "gameDate": "2025-12-23",
      "gameQuestion": "Name the top scorers under the age of 25",
      "rankType": null
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:3000/api/bogle/games
```

---

### GET `/api/bogle/games?date=YYYY-MM-DD`
Get a specific game by date.

**Query Parameters:**
- `date` (required): Date in `YYYY-MM-DD` format

**Response (200 OK):**
```json
{
  "success": true,
      "date": "2025-12-23",
      "data": {
        "gameId": 1,
        "gameDate": "2025-12-23",
        "gameQuestion": "Name the top scorers under the age of 25",
        "rankType": null
      }
}
```

**Error Responses:**
- **400 Bad Request**: Invalid date format
- **404 Not Found**: No game found for the specified date
- **500 Internal Server Error**: Server error

**Example:**
```bash
curl "http://localhost:3000/api/bogle/games?date=2025-12-23"
```

---

### PATCH `/api/bogle/games/:gameId`
Update an existing Bogle game. You can update `gameDate`, `gameQuestion`, and/or `rankType`.

**URL Parameters:**
- `gameId` (required): The ID of the game to update

**Request Body:**
```json
{
  "gameDate": "2025-12-24",
  "gameQuestion": "Updated question text",
  "rankType": "assists per game"
}
```

**Note:** All fields are optional. Provide only the fields you want to update. Set `rankType` to `null` to clear it.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
        "gameId": 1,
        "gameDate": "2025-12-24",
        "gameQuestion": "Updated question text",
        "rankType": "assists per game"
      }
}
```

**Error Responses:**
- **400 Bad Request**: Invalid gameId, missing fields, or invalid date format
- **404 Not Found**: Game with the specified gameId does not exist
- **409 Conflict**: A game for the new date already exists
- **500 Internal Server Error**: Server error

**Examples:**

Update only the question:
```bash
curl -X PATCH http://localhost:3000/api/bogle/games/1 \
  -H "Content-Type: application/json" \
  -d '{
    "gameQuestion": "Name the top scorers under the age of 25 (updated)"
  }'
```

Update only the date:
```bash
curl -X PATCH http://localhost:3000/api/bogle/games/1 \
  -H "Content-Type: application/json" \
  -d '{
    "gameDate": "2025-12-24"
  }'
```

Update both fields:
```bash
curl -X PATCH http://localhost:3000/api/bogle/games/1 \
  -H "Content-Type: application/json" \
  -d '{
    "gameDate": "2025-12-24",
    "gameQuestion": "Updated question text"
  }'
```

---

## Bogle Scores Endpoints

### POST `/api/bogle/scores`
Submit a new player score for a Bogle game.

**Request Body:**
```json
{
  "username": "player123",
  "gameScore": 85,
  "gameId": 1,
  "timeTaken": 120
}
```

**Required Fields:**
- `username` (string): Player's username
- `gameScore` (number): Player's score (must be non-negative)
- `gameId` (number): ID of the game this score is for

**Optional Fields:**
- `timeTaken` (number): Time taken in seconds (must be non-negative if provided)

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "gameId": 1,
    "username": "player123",
    "gameScore": 85,
    "gameDate": "2025-12-23",
    "gameQuestion": "Name the top scorers under the age of 25",
    "timeTaken": 120,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Note:** The `gameDate` and `gameQuestion` are automatically populated from the game record.

**Error Responses:**
- **400 Bad Request**: Missing or invalid fields
- **404 Not Found**: Game with the specified gameId does not exist
- **409 Conflict**: A score for this username and game already exists (one score per user per game)
- **500 Internal Server Error**: Server error

**Example:**
```bash
curl -X POST http://localhost:3000/api/bogle/scores \
  -H "Content-Type: application/json" \
  -d '{
    "username": "player123",
    "gameScore": 85,
    "gameId": 1,
    "timeTaken": 120
  }'
```

---

### GET `/api/bogle/scores?date=YYYY-MM-DD`
Get all scores for a specific date, ordered by score (descending) and then by timeTaken (ascending).

**Query Parameters:**
- `date` (required): Date in `YYYY-MM-DD` format

**Response (200 OK):**
```json
{
  "success": true,
  "date": "2025-12-23",
  "count": 3,
  "data": [
    {
      "id": 2,
      "gameId": 1,
      "username": "player456",
      "gameScore": 95,
      "gameDate": "2025-12-23",
      "gameQuestion": "Name the top scorers under the age of 25",
      "timeTaken": 100,
      "createdAt": "2024-01-15T10:35:00.000Z"
    },
    {
      "id": 1,
      "gameId": 1,
      "username": "player123",
      "gameScore": 85,
      "gameDate": "2025-12-23",
      "gameQuestion": "Name the top scorers under the age of 25",
      "timeTaken": 120,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 3,
      "gameId": 1,
      "username": "player789",
      "gameScore": 85,
      "gameDate": "2025-12-23",
      "gameQuestion": "Name the top scorers under the age of 25",
      "timeTaken": 150,
      "createdAt": "2024-01-15T10:40:00.000Z"
    }
  ]
}
```

**Error Responses:**
- **400 Bad Request**: Missing or invalid date format
- **500 Internal Server Error**: Server error

**Example:**
```bash
curl "http://localhost:3000/api/bogle/scores?date=2025-12-23"
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message"
}
```

## Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., duplicate entry)
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Service unavailable (database connection issues)

---

## Notes

1. **Date Format**: All dates must be in `YYYY-MM-DD` format (e.g., `2025-12-23`)

2. **Unique Constraints**:
   - Only one game per date (enforced by unique constraint on `gameDate`)
   - Only one score per username per game (enforced by unique constraint on `username` + `gameId`)

3. **Score Ordering**: When retrieving scores by date, results are ordered by:
   - `gameScore` (descending - highest scores first)
   - `timeTaken` (ascending - fastest times first, nulls last)

4. **Authentication**: Currently, no authentication is required for any endpoints.

