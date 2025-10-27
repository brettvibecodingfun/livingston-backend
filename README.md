# Livingston Backend - NBA Stats ETL

A production-ready NBA statistics ETL pipeline built with Node.js, TypeScript, PostgreSQL, and Drizzle ORM. Fetches data from the BallDontLie API and maintains a comprehensive database of teams, players, games, and box scores.

## 🏀 Features

- **Type-Safe Schema**: Drizzle ORM with full TypeScript support
- **Automated ETL Jobs**: 
  - Nightly sync of teams, players, and yesterday's games
  - Hourly incremental updates for game-day stats
- **API Data Validation**: Zod schemas for runtime type checking
- **Smart UPSERTs**: Conflict resolution using unique API IDs
- **Materialized Views**: Pre-aggregated season statistics for fast queries
- **Health Check Server**: Simple HTTP server for monitoring
- **Pagination Support**: Efficient handling of large datasets from API

## 📁 Project Structure

```
livingston-backend/
├── src/
│   ├── db/
│   │   ├── schema.ts          # Drizzle schema definitions
│   │   ├── client.ts          # Database connection pool & client
│   │   └── migrate.ts         # Migration runner
│   ├── etl/
│   │   ├── providers/
│   │   │   └── balldontlie.ts # API client with Zod validation
│   │   ├── maps.ts            # Data transformation functions
│   │   ├── upserts.ts         # Database upsert operations
│   │   └── jobs/
│   │       ├── nightly.ts     # Nightly ETL job
│   │       └── incremental.ts # Hourly incremental job
│   ├── sql/
│   │   └── materialized_views.sql # Aggregated stats views
│   └── index.ts               # Health check server
├── drizzle/                   # Generated migrations (auto-created)
├── drizzle.config.ts          # Drizzle Kit configuration
├── package.json
├── tsconfig.json
└── .env                       # Environment variables (create from .env.example)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose (for local development)
- BallDontLie API key (free tier available at https://balldontlie.io)

### Option 1: Docker Setup (Recommended for Development)

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Start PostgreSQL with Docker:**

```bash
# Start PostgreSQL and pgAdmin
npm run docker:up

# Check if services are running
npm run docker:logs
```

3. **Configure environment variables:**

Create a `.env` file with:
```bash
# Database Configuration for Docker
DATABASE_URL=postgresql://livingston:livingston123@localhost:5432/livingston

# BallDontLie API Configuration
BALLDONTLIE_BASE=https://api.balldontlie.io/v1
BALLDONTLIE_KEY=your_api_key_here

# Server Configuration
PORT=3000
```

4. **Setup database:**

```bash
# Generate migration files from schema
npm run db:gen

# Run migrations
npm run db:migrate

# Create materialized views (run after migrations)
npm run docker:db -c "CREATE MATERIALIZED VIEW IF NOT EXISTS season_player_stats AS SELECT p.id AS player_id, g.season, COUNT(DISTINCT g.id) AS games_played, AVG(b.points) AS ppg, AVG(b.assists) AS apg, AVG(b.rebounds) AS rpg, AVG(b.steals) AS spg, AVG(b.blocks) AS bpg, AVG(b.turnovers) AS tovpg, AVG(NULLIF(b.fgm,0)/NULLIF(b.fga,0)) AS fg_pct, AVG(NULLIF(b.tpm,0)/NULLIF(b.tpa,0)) AS three_pct, AVG(NULLIF(b.ftm,0)/NULLIF(b.fta,0)) AS ft_pct FROM box_scores b JOIN games g ON b.game_id = g.id JOIN players p ON b.player_id = p.id GROUP BY p.id, g.season;"
```

### Option 2: Local PostgreSQL Setup

1. **Install PostgreSQL locally** (version 14+)

2. **Create database:**
```bash
createdb livingston
```

3. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your local database credentials
```

4. **Setup database:**
```bash
npm run db:gen
npm run db:migrate
psql $DATABASE_URL < src/sql/materialized_views.sql
```

## 🔧 Usage

### Running ETL Jobs

**Nightly Job** (run once per day):
```bash
npm run etl:nightly
```
- Syncs all teams
- Syncs all players
- Fetches yesterday's games and box scores
- Refreshes materialized views

**Incremental Job** (run hourly on game days):
```bash
npm run etl:incremental
```
- Fetches today's games
- Updates box scores for in-progress and completed games

### Running the Health Check Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

Endpoints:
- `GET /health` - Full health check with database status
- `GET /ping` - Simple ping/pong

### Database Management

```bash
# Open Drizzle Studio (visual database browser)
npm run db:studio

# Generate new migrations after schema changes
npm run db:gen

# Apply migrations
npm run db:migrate
```

## 📊 Database Schema

### Tables

- **teams**: NBA team information (30 teams)
- **players**: Player profiles and attributes
- **games**: Game schedules, scores, and status
- **box_scores**: Per-game player statistics

### Materialized Views

- **season_player_stats**: Aggregated player stats by season
  - Total and per-game averages
  - Shooting percentages
  - Advanced metrics
  
- **season_team_stats**: Team records and performance by season
  - Win-loss records
  - Home/away splits
  - Scoring averages

Refresh materialized views after ETL runs:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY season_player_stats;
REFRESH MATERIALIZED VIEW CONCURRENTLY season_team_stats;
```

## 🔑 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `BALLDONTLIE_BASE` | BallDontLie API base URL | `https://api.balldontlie.io/v1` |
| `BALLDONTLIE_KEY` | BallDontLie API key | Required |
| `PORT` | Health check server port | `3000` |

## 🐳 Docker Development

### Docker Services

The `docker-compose.yml` provides:

- **PostgreSQL 15**: Database server on port 5432
- **pgAdmin**: Web-based database admin on port 8080

### Docker Commands

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# View logs
npm run docker:logs

# Connect to database
npm run docker:db

# Reset everything (removes all data)
npm run docker:reset
```

### Accessing Services

- **PostgreSQL**: `localhost:5432`
  - Database: `livingston`
  - Username: `livingston`
  - Password: `livingston123`

- **pgAdmin**: `http://localhost:8080`
  - Email: `admin@livingston.com`
  - Password: `admin123`

### Adding pgAdmin Server Connection

1. Open pgAdmin at `http://localhost:8080`
2. Right-click "Servers" → "Create" → "Server"
3. **General tab**: Name = "Livingston Local"
4. **Connection tab**:
   - Host: `postgres` (Docker service name)
   - Port: `5432`
   - Database: `livingston`
   - Username: `livingston`
   - Password: `livingston123`

## 🧪 Development

### Build the project:
```bash
npm run build
```

### TypeScript compilation:
The project uses ES modules with `nodenext` module resolution. All imports must include `.js` extensions even in TypeScript files.

## 📝 Scheduling ETL Jobs

Use a scheduler like `cron`, `systemd timers`, or a cloud scheduler:

**Cron example:**
```cron
# Nightly job at 3 AM
0 3 * * * cd /path/to/monta-backend && npm run etl:nightly

# Incremental job every hour during NBA season
0 * * 10-6 * cd /path/to/monta-backend && npm run etl:incremental
```

## 🏗️ Architecture Highlights

- **Type Safety**: End-to-end type safety from API → validation → database
- **Idempotent UPSERTs**: Safe to re-run jobs without duplicating data
- **Batch Processing**: Efficient chunking for large datasets
- **Transaction Support**: Drizzle transactions for data consistency
- **Rate Limiting**: Built-in delays to respect API limits
- **Error Handling**: Graceful degradation with detailed logging
- **ID Mapping**: Automatic resolution of foreign keys between API IDs and database IDs

## 📚 API Reference

The BallDontLie API provides:
- Teams: All 30 NBA teams
- Players: Active and historical players
- Games: Scores, schedules, and game metadata
- Stats (box scores): Per-game player performance

API Documentation: https://docs.balldontlie.io

## 🐛 Troubleshooting

**Connection Issues:**
- Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Check PostgreSQL is running and accessible

**Missing Materialized Views:**
- Run the SQL script: `psql $DATABASE_URL < src/sql/materialized_views.sql`
- Views must be created manually after initial migration

**Rate Limiting:**
- Free tier has request limits
- Add delays between requests (already implemented)
- Consider upgrading API plan for heavy usage

## 📄 License

ISC

## 🤝 Contributing

Contributions welcome! This is a scaffold project designed to be extended with:
- Additional API endpoints
- More complex analytics
- Real-time game tracking
- GraphQL or REST API layer
- Advanced metrics and player comparisons

---

Built with ❤️ for NBA stats enthusiasts

