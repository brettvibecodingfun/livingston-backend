# ✅ Schema Updated Successfully

## Changes Made

### Tables Updated

**1. teams** (7 columns)
```sql
- id (serial PK)
- api_id (int UNIQUE)
- name (text)
- abbreviation (text)
- city (text)
- conference (text)
- division (text)
```

**2. players** (10 columns)
```sql
- id (serial PK)
- api_id (int UNIQUE)
- full_name (text)
- first_name (text)
- last_name (text)
- team_id (int FK → teams.id)
- position (text)
- height (text)
- weight (text)
- birthdate (date)
```

**3. games** (8 columns)
```sql
- id (serial PK)
- api_id (int UNIQUE)
- season (int)
- date (date)
- home_team_id (int FK → teams.id)
- away_team_id (int FK → teams.id)
- home_score (int)
- away_score (int)
```

**4. box_scores** (17 columns)
```sql
- id (serial PK)
- game_id (int FK → games.id)
- player_id (int FK → players.id)
- team_id (int FK → teams.id)
- minutes (real)
- points (real)
- assists (real)
- rebounds (real)
- steals (real)
- blocks (real)
- turnovers (real)
- fgm (real)
- fga (real)
- tpm (real)  -- three-pointers made
- tpa (real)  -- three-pointers attempted
- ftm (real)
- fta (real)
```

### Constraints

✅ **Unique Constraints:**
- `api_id` unique on all tables
- `UNIQUE(game_id, player_id)` on box_scores

✅ **Foreign Keys:**
- box_scores → games, players, teams (3 FKs)
- games → teams (home and away, 2 FKs)
- players → teams (1 FK)

### Indexes

✅ **Created Indexes:**
- `box_scores(player_id)` ✓
- `box_scores(game_id)` ✓
- `players(position)` ✓
- `games(season)` ✓
- `games(date)` ✓

Plus additional indexes on:
- All `api_id` columns
- All foreign key columns

**Total: 12 indexes**

### Drizzle Relations Added

✅ **Relational API enabled for joins:**

```typescript
// Teams relations
teams → players (one-to-many)
teams → homeGames (one-to-many)
teams → awayGames (one-to-many)
teams → boxScores (one-to-many)

// Players relations
players → team (many-to-one)
players → boxScores (one-to-many)

// Games relations
games → homeTeam (many-to-one)
games → awayTeam (many-to-one)
games → boxScores (one-to-many)

// Box scores relations
boxScores → game (many-to-one)
boxScores → player (many-to-one)
boxScores → team (many-to-one)
```

## Migration Generated

```
drizzle/0000_opposite_monster_badoon.sql (76 lines)
```

Complete with all tables, constraints, and indexes.

## Usage Examples

### Query with Relations

```typescript
// Get player with team and stats
const player = await db.query.players.findFirst({
  where: eq(players.id, 1),
  with: {
    team: true,
    boxScores: {
      limit: 10,
      with: {
        game: {
          with: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
    },
  },
});

// Get game with both teams and all box scores
const game = await db.query.games.findFirst({
  where: eq(games.id, 1),
  with: {
    homeTeam: true,
    awayTeam: true,
    boxScores: {
      with: {
        player: true,
      },
    },
  },
});
```

### Traditional Joins

```typescript
// Get top scorers in a game
const topScorers = await db
  .select()
  .from(boxScores)
  .innerJoin(players, eq(boxScores.playerId, players.id))
  .where(eq(boxScores.gameId, 1))
  .orderBy(desc(boxScores.points))
  .limit(10);
```

## Files Updated

- ✅ `src/db/schema.ts` - Complete rewrite with new structure
- ✅ `src/db/example-queries.ts` - 8 example queries showing relations
- ✅ `drizzle/0000_opposite_monster_badoon.sql` - Fresh migration

## Next Steps

1. **Apply migration:**
   ```bash
   npm run db:migrate
   ```

2. **Update ETL mapper functions** to match new column names:
   - `src/etl/maps.ts` - Update field mappings
   - `src/etl/upserts.ts` - Update UPSERT logic if needed

3. **Update materialized views** if they reference old columns:
   ```bash
   # Edit src/sql/materialized_views.sql as needed
   ```

4. **Test queries:**
   ```bash
   npm run dev
   # Or use Drizzle Studio: npm run db:studio
   ```

## Key Differences from Previous Schema

| Feature | Old Schema | New Schema |
|---------|-----------|------------|
| Timestamp columns | `created_at`, `updated_at` | Removed |
| Game teams | `visitor_team_id` | `away_team_id` |
| Game scores | `home_team_score`, `visitor_team_score` | `home_score`, `away_score` |
| Stats type | Some integer, some real | All real (float) |
| Box score stats | `fg3m`, `fg3a` | `tpm`, `tpa` |
| Box score stats | Separate `oreb`, `dreb`, `reb` | Single `rebounds` |
| Player names | Separate first/last | Added `full_name` |
| Date fields | `timestamp` | `date` |

## All Systems Ready! ��

The schema is now aligned with your exact specifications, with full relational support and optimized indexes.
