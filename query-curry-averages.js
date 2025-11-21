#!/usr/bin/env node
/**
 * Query script to get Stephen Curry's season averages
 * 
 * Usage:
 *   node query-curry-averages.js [season]
 *   Example: node query-curry-averages.js 2025
 */

import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { seasonAverages, players } from './dist/db/schema.js';
import { eq, desc, and } from 'drizzle-orm';

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

const db = drizzle(pool, { schema: { seasonAverages, players } });

async function getCurryAverages(seasonFilter) {
  try {
    const whereConditions = [
      eq(players.firstName, 'Cooper'),
      eq(players.lastName, 'Flagg'),
    ];

    if (seasonFilter) {
      whereConditions.push(eq(seasonAverages.season, seasonFilter));
    }

    const rows = await db
      .select({
        playerName: players.fullName,
        firstName: players.firstName,
        lastName: players.lastName,
        season: seasonAverages.season,
        gamesPlayed: seasonAverages.gamesPlayed,
        minutes: seasonAverages.minutes,
        points: seasonAverages.points,
        assists: seasonAverages.assists,
        rebounds: seasonAverages.rebounds,
        steals: seasonAverages.steals,
        blocks: seasonAverages.blocks,
        turnovers: seasonAverages.turnovers,
        fgm: seasonAverages.fgm,
        fga: seasonAverages.fga,
        fgPct: seasonAverages.fgPct,
        tpm: seasonAverages.tpm,
        tpa: seasonAverages.tpa,
        threePct: seasonAverages.threePct,
        ftm: seasonAverages.ftm,
        fta: seasonAverages.fta,
        ftPct: seasonAverages.ftPct,
      })
      .from(seasonAverages)
      .innerJoin(players, eq(seasonAverages.playerId, players.id))
      .where(and(...whereConditions))
      .orderBy(desc(seasonAverages.season));

    if (rows.length === 0) {
      console.log('ℹ️  No season averages found for Stephen Curry.');
      if (seasonFilter) {
        console.log(`   Have you populated season averages for season ${seasonFilter}?`);
      } else {
        console.log('   Have you populated season averages yet?');
      }
      return;
    }

    console.log('\n🏀 Stephen Curry - Season Averages');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    rows.forEach((row) => {
      console.log(`📅 Season: ${row.season}`);
      console.log(`   Games Played: ${row.gamesPlayed ?? 'N/A'}`);
      console.log(`   Minutes: ${row.minutes?.toFixed(1) ?? 'N/A'} MPG`);
      console.log('');
      console.log(`📊 Per Game Stats:`);
      console.log(`   Points: ${row.points?.toFixed(1) ?? 'N/A'} PPG`);
      console.log(`   Assists: ${row.assists?.toFixed(1) ?? 'N/A'} APG`);
      console.log(`   Rebounds: ${row.rebounds?.toFixed(1) ?? 'N/A'} RPG`);
      console.log(`   Steals: ${row.steals?.toFixed(1) ?? 'N/A'} SPG`);
      console.log(`   Blocks: ${row.blocks?.toFixed(1) ?? 'N/A'} BPG`);
      console.log(`   Turnovers: ${row.turnovers?.toFixed(1) ?? 'N/A'} TOV/G`);
      console.log('');
      console.log(`🎯 Shooting Stats:`);
      console.log(`   Field Goals: ${row.fgm?.toFixed(1) ?? 'N/A'}/${row.fga?.toFixed(1) ?? 'N/A'} (${((row.fgPct ?? 0) * 100).toFixed(1)}%)`);
      console.log(`   3-Pointers: ${row.tpm?.toFixed(1) ?? 'N/A'}/${row.tpa?.toFixed(1) ?? 'N/A'} (${((row.threePct ?? 0) * 100).toFixed(1)}%)`);
      console.log(`   Free Throws: ${row.ftm?.toFixed(1) ?? 'N/A'}/${row.fta?.toFixed(1) ?? 'N/A'} (${((row.ftPct ?? 0) * 100).toFixed(1)}%)`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error querying season averages:', error);
    throw error;
  }
}

async function main() {
  const seasonArg = process.argv[2] ? Number.parseInt(process.argv[2], 10) : undefined;

  if (seasonArg && Number.isNaN(seasonArg)) {
    console.error('❌ Invalid season argument. Provide a numeric season (e.g. 2025).');
    process.exit(1);
  }

  await getCurryAverages(seasonArg);
  await pool.end();
}

main().catch(async (err) => {
  console.error('Fatal error:', err);
  await pool.end();
  process.exit(1);
});

