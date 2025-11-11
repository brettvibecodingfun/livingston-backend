#!/usr/bin/env node
/**
 * Query script to list all team standings stored in the database.
 *
 * Usage:
 *   node query-standings.js [season]
 *     - season (optional): limits results to a specific season (e.g. 2025)
 */

import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { standings, teams } from './dist/db/schema.js';
import { eq, desc } from 'drizzle-orm';

const { Pool } = pg;
const CONNECTION_URL = process.env.DATABASE_URL || process.env.EXTERNAL_DATABASE_URL;

if (!CONNECTION_URL) {
  console.error('❌ DATABASE_URL (preferred) or EXTERNAL_DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: CONNECTION_URL,
  ssl: CONNECTION_URL.includes('localhost') ? undefined : { rejectUnauthorized: false },
});

const db = drizzle(pool, { schema: { standings, teams } });

async function getStandings(seasonFilter) {
  try {
    let query = db
      .select({
        teamName: teams.name,
        teamAbbr: teams.abbreviation,
        conference: teams.conference,
        division: teams.division,
        season: standings.season,
        wins: standings.wins,
        losses: standings.losses,
        conferenceRank: standings.conferenceRank,
        divisionRank: standings.divisionRank,
        conferenceRecord: standings.conferenceRecord,
        divisionRecord: standings.divisionRecord,
        homeRecord: standings.homeRecord,
        roadRecord: standings.roadRecord,
      })
      .from(standings)
      .innerJoin(teams, eq(standings.teamId, teams.id))
      .orderBy(desc(standings.season), standings.teamId);

    if (seasonFilter) {
      query = query.where(eq(standings.season, seasonFilter));
    }

    const rows = await query;

    if (rows.length === 0) {
      console.log('ℹ️  No standings found. Have you populated the standings table yet?');
      return;
    }

    const grouped = rows.reduce((acc, row) => {
      if (!acc[row.season]) acc[row.season] = [];
      acc[row.season].push(row);
      return acc;
    }, {});

    Object.entries(grouped)
      .sort(([a], [b]) => Number(b) - Number(a))
      .forEach(([season, data]) => {
        console.log(`\n📈 Standings - Season ${season}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        data
          .sort((a, b) => a.conferenceRank - b.conferenceRank)
          .forEach((row, idx) => {
            console.log(`${String(idx + 1).padStart(2, ' ')}. ${row.teamName} (${row.teamAbbr})`);
            console.log(`    Conference: ${row.conference} | Division: ${row.division}`);
            console.log(`    Record: ${row.wins}-${row.losses}`);
            console.log(
              `    Ranks: Conf ${row.conferenceRank ?? '—'}, Div ${row.divisionRank ?? '—'}`
            );
            console.log(
              `    Splits: Conf ${row.conferenceRecord ?? '—'} | Div ${row.divisionRecord ?? '—'} | Home ${row.homeRecord ?? '—'} | Road ${row.roadRecord ?? '—'}`
            );
            console.log('');
          });
      });
  } catch (error) {
    console.error('❌ Error querying standings:', error);
    throw error;
  }
}

async function main() {
  const seasonArg = process.argv[2] ? Number.parseInt(process.argv[2], 10) : undefined;

  if (seasonArg && Number.isNaN(seasonArg)) {
    console.error('❌ Invalid season argument. Provide a numeric season (e.g. 2025).');
    process.exit(1);
  }

  await getStandings(seasonArg);
  await pool.end();
}

main().catch(async (err) => {
  console.error('Fatal error:', err);
  await pool.end();
  process.exit(1);
});
