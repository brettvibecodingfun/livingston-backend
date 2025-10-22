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
- PostgreSQL 14+
- BallDontLie API key (free tier available at https://balldontlie.io)

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Configure environment variables:**

```bash
cp .env.example .env
# Edit .env with your database credentials and API key
```

3. **Setup database:**

```bash
# Generate migration files from schema
npm run db:gen

# Run migrations
npm run db:migrate

# Or push schema directly (development)
npm run db:push
```

4. **Create materialized views:**

```bash
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

