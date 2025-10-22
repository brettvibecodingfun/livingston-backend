# Database Migrations Guide

## Overview

This project uses Drizzle Kit for database migrations. Migrations are generated from the TypeScript schema and stored as SQL files in the `drizzle/` folder.

## Configuration

Migrations are configured via `drizzle.config.ts`:

```typescript
{
  schema: './src/db/schema.ts',      // Source schema
  out: './drizzle',                  // Output directory for migrations
  dialect: 'postgresql',             // Database type
  dbCredentials: {
    url: process.env.DATABASE_URL    // Connection string
  }
}
```

## Commands

### Generate Migrations

```bash
npm run db:gen
```

- Reads `src/db/schema.ts`
- Compares with existing migrations
- Generates new SQL migration files in `drizzle/`
- Creates snapshots and journal metadata

### Apply Migrations

```bash
npm run db:migrate
```

- Executes all pending migrations in order
- Updates the migrations journal in the database
- Idempotent: safe to run multiple times

### Push Schema (Development Only)

```bash
npm run db:push
```

- Directly pushes schema changes to the database
- **Skips migration generation**
- Useful for rapid prototyping
- ⚠️ Not recommended for production

## Current Schema

### Tables

- **teams** (10 columns, 1 index)
  - Primary key: `id`
  - Unique constraint: `api_id`
  - Index: `api_id`

- **players** (16 columns, 3 indexes)
  - Primary key: `id`
  - Unique constraint: `api_id`
  - Foreign key: `team_id` → `teams.id`
  - Indexes: `api_id`, `team_id`, `position`

- **games** (14 columns, 5 indexes)
  - Primary key: `id`
  - Unique constraint: `api_id`
  - Foreign keys: `home_team_id` → `teams.id`, `visitor_team_id` → `teams.id`
  - Indexes: `api_id`, `date`, `season`, `home_team_id`, `visitor_team_id`

- **box_scores** (25 columns, 3 indexes)
  - Primary key: `id`
  - Unique constraint: `(game_id, player_id)` composite
  - Foreign keys: `game_id` → `games.id`, `player_id` → `players.id`, `team_id` → `teams.id`
  - Indexes: `game_id`, `player_id`, `team_id`

## Workflow

### Initial Setup

1. Set `DATABASE_URL` in `.env`
2. Generate migrations: `npm run db:gen`
3. Apply migrations: `npm run db:migrate`
4. Create materialized views: `psql $DATABASE_URL < src/sql/materialized_views.sql`

### Making Schema Changes

1. Edit `src/db/schema.ts`
2. Generate migration: `npm run db:gen`
3. Review generated SQL in `drizzle/XXXX_*.sql`
4. Apply migration: `npm run db:migrate`

### Example: Adding a New Column

```typescript
// src/db/schema.ts
export const players = pgTable('players', {
  // ... existing columns
  nickname: varchar('nickname', { length: 50 }), // NEW
});
```

Then:
```bash
npm run db:gen    # Generates migration with ALTER TABLE
npm run db:migrate # Applies the change
```

## Migration Files

Migrations are stored in `drizzle/` with naming convention:

```
0000_far_the_fallen.sql      # Initial schema
0001_swift_avengers.sql      # Second migration
0002_...                     # etc.
```

Each migration includes:
- Table creation/alteration statements
- Index definitions
- Foreign key constraints
- Unique constraints

## Metadata

`drizzle/meta/` contains:
- `_journal.json` - Migration history and order
- `XXXX_snapshot.json` - Schema state at each migration

## Troubleshooting

### Migration Out of Sync

```bash
# Reset database (⚠️ destroys data)
dropdb monta_nba && createdb monta_nba

# Re-apply all migrations
npm run db:migrate
```

### Manual SQL Execution

```bash
# Execute a specific migration file
psql $DATABASE_URL < drizzle/0000_far_the_fallen.sql
```

### Verify Schema

```bash
# Open Drizzle Studio to inspect database
npm run db:studio
```

## Best Practices

1. **Never edit migration files** - Always generate new ones
2. **Review migrations before applying** - Check SQL correctness
3. **Test migrations locally first** - Don't apply untested migrations to production
4. **Use transactions** - Drizzle Kit wraps migrations in transactions automatically
5. **Keep schema.ts in sync** - Schema is the source of truth

## CI/CD Integration

```yaml
# Example GitHub Actions workflow
- name: Run migrations
  run: npm run db:migrate
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Additional Resources

- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [PostgreSQL Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Migration Strategies](https://orm.drizzle.team/docs/migrations)

