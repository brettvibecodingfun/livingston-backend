# ✅ Setup Complete - Drizzle Configuration & Migrations

## What Was Configured

### 1. Drizzle Configuration (`drizzle.config.ts`)
✅ PostgreSQL dialect configured
✅ Schema source: `./src/db/schema.ts`
✅ Migrations output: `./drizzle`
✅ DATABASE_URL environment variable integration
✅ Verbose and strict mode enabled

### 2. NPM Scripts Updated (`package.json`)
✅ `npm run db:gen` - Generate migrations from schema
✅ `npm run db:migrate` - Apply migrations to database
✅ `npm run db:push` - Push schema directly (dev only)
✅ `npm run db:studio` - Visual database browser

### 3. Schema Enhancements (`src/db/schema.ts`)
✅ **Primary Keys**: All tables have serial primary keys
✅ **Unique Constraints**: `api_id` unique on all tables
✅ **Foreign Keys**: 
   - `box_scores` → `games`, `players`, `teams`
   - `games` → `teams` (home and visitor)
   - `players` → `teams`

✅ **Indexes** on frequent filters:
   - `teams.api_id`
   - `players.api_id`, `players.team_id`, **`players.position`** (NEW)
   - `games.api_id`, `games.date`, **`games.season`**, `games.home_team_id`, `games.visitor_team_id`
   - `box_scores.game_id`, **`box_scores.player_id`**, `box_scores.team_id`

### 4. Generated Migrations (`drizzle/`)
✅ Initial migration: `0000_far_the_fallen.sql` (99 lines)
✅ Creates all 4 tables: teams, players, games, box_scores
✅ All constraints and indexes included
✅ Migration journal: `drizzle/meta/_journal.json`
✅ Schema snapshot: `drizzle/meta/0000_snapshot.json`

## Schema Summary

```
┌─────────────┬──────────┬─────────┬──────────┬──────────┐
│   Table     │ Columns  │ Indexes │   FKs    │  Unique  │
├─────────────┼──────────┼─────────┼──────────┼──────────┤
│ teams       │    10    │    1    │    0     │  api_id  │
│ players     │    16    │    3    │    1     │  api_id  │
│ games       │    14    │    5    │    2     │  api_id  │
│ box_scores  │    25    │    3    │    3     │ game+plr │
└─────────────┴──────────┴─────────┴──────────┴──────────┘
```

## Next Steps

### 1. Apply Migrations to Database

```bash
# Set your database URL
export DATABASE_URL="postgresql://user:pass@localhost:5432/monta_nba"

# Apply migrations
npm run db:migrate
```

### 2. Create Materialized Views

```bash
psql $DATABASE_URL < src/sql/materialized_views.sql
```

### 3. Run Initial ETL

```bash
# Set API key
export BALLDONTLIE_KEY="your_key_here"

# Run nightly job to populate initial data
npm run etl:nightly
```

### 4. Verify Setup

```bash
# Open Drizzle Studio to inspect database
npm run db:studio

# Or query directly
psql $DATABASE_URL -c "SELECT COUNT(*) FROM teams;"
```

## Migration Workflow

### When Making Schema Changes:

1. Edit `src/db/schema.ts`
2. Generate migration: `npm run db:gen`
3. Review SQL in `drizzle/XXXX_*.sql`
4. Apply migration: `npm run db:migrate`

## File Structure

```
livingston-backend/
├── drizzle/                        ← Generated migrations
│   ├── 0000_far_the_fallen.sql    ← Initial schema SQL
│   └── meta/
│       ├── _journal.json           ← Migration history
│       └── 0000_snapshot.json      ← Schema snapshot
├── drizzle.config.ts              ← Drizzle configuration
├── src/
│   ├── db/
│   │   ├── schema.ts              ← Source of truth (enhanced)
│   │   ├── client.ts              ← DB connection
│   │   └── migrate.ts             ← Migration runner (legacy)
│   └── ...
├── package.json                    ← Scripts updated
├── MIGRATIONS.md                   ← Migration guide
└── README.md                       ← Updated docs
```

## Key Features

✅ **Type-Safe**: Full TypeScript support with Drizzle
✅ **Idempotent**: Migrations tracked in journal, safe to re-run
✅ **Versioned**: Each migration has unique ID and timestamp
✅ **Transactional**: Changes wrapped in database transactions
✅ **Reversible**: Can rollback by restoring from backups
✅ **CI/CD Ready**: Simple npm commands for automation

## Environment Variables Required

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/monta_nba
BALLDONTLIE_KEY=your_api_key
BALLDONTLIE_BASE=https://api.balldontlie.io/v1
PORT=3000
```

## Verification Checklist

- [x] drizzle.config.ts created with DATABASE_URL
- [x] npm scripts: db:gen, db:migrate, db:push configured
- [x] Schema has primary keys on all tables
- [x] Schema has unique indexes on api_id fields
- [x] Schema has foreign keys with proper references
- [x] Schema has indexes on: season, player_id, game_id, position
- [x] Migrations generated in drizzle/ folder
- [x] Migration metadata created (_journal.json)
- [x] Documentation updated (README.md, MIGRATIONS.md)

## All Systems Ready! 🚀

Your NBA Stats ETL project is fully configured with Drizzle ORM:
- Database schema defined and validated
- Migrations generated and ready to apply
- Type-safe queries with full IntelliSense
- Production-ready migration workflow

Run `npm run db:migrate` when your database is ready!
