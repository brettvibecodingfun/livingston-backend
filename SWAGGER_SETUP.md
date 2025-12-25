# Swagger/OpenAPI Documentation Setup

## Overview

This backend now includes Swagger UI for interactive API documentation. You can test all endpoints directly from your browser without using curl commands.

## Installation

The Swagger UI is served via CDN (no npm packages needed), so no additional installation is required!

## Accessing the Documentation

Once your server is running, visit:

- **Local**: `http://localhost:3000/api-docs`
- **Production**: `https://livingston-backend.onrender.com/api-docs`

## Features

- ✅ Interactive API testing - click "Try it out" on any endpoint
- ✅ Request/response examples
- ✅ Schema validation
- ✅ All endpoints documented (Health, Bogle Games, Bogle Scores)
- ✅ Works on both local and production servers

## Usage

1. Start your server:
   ```bash
   npm run dev
   # or
   npm start
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000/api-docs
   ```

3. Click on any endpoint to expand it

4. Click "Try it out" to test the endpoint

5. Fill in the required parameters/request body

6. Click "Execute" to send the request

7. View the response below

## Endpoints Available in Swagger

### Health
- `GET /health` - Health check
- `GET /ping` - Ping endpoint

### Bogle Games
- `POST /api/bogle/games` - Create a new game
- `GET /api/bogle/games` - Get all games (or by date with query param)
- `PATCH /api/bogle/games/{gameId}` - Update a game

### Bogle Scores
- `POST /api/bogle/scores` - Submit a score
- `GET /api/bogle/scores?date={date}` - Get scores by date
- `DELETE /api/bogle/scores/{id}` - Delete a score

## API Spec Endpoint

The OpenAPI JSON specification is also available at:
- `http://localhost:3000/api-docs.json`

This can be imported into other tools like Postman, Insomnia, or other API clients.

## Notes

- The Swagger UI uses CDN resources, so an internet connection is required to load the UI
- All endpoints support CORS, so you can test from the Swagger UI
- The production server URL is automatically configured in the Swagger UI

