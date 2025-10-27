#!/usr/bin/env node
/**
 * Query script to get PPG leaders for current season
 * 
 * Usage:
 *   node query-ppg-leaders.js
 */

import dotenv from 'dotenv';
dotenv.config();

import { db } from './dist/db/client.js';
import { players, teams, leaders } from './dist/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { pool } from './dist/db/client.js';

async function getPPGLeaders() {
  const currentSeason = new Date().getFullYear();
  console.log(`🏀 Points Per Game Leaders - ${currentSeason} Season`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Get PPG leaders from the leaders table
    const ppgLeaders = await db
      .select({
        rank: leaders.rank,
        playerName: players.fullName,
        firstName: players.firstName,
        lastName: players.lastName,
        position: players.position,
        teamName: teams.name,
        teamAbbr: teams.abbreviation,
        ppg: leaders.value,
        gamesPlayed: leaders.gamesPlayed,
      })
      .from(leaders)
      .innerJoin(players, eq(leaders.playerId, players.id))
      .leftJoin(teams, eq(players.teamId, teams.id))
      .where(eq(leaders.statType, 'pts'))
      .orderBy(leaders.rank)
      .limit(20);

    if (ppgLeaders.length === 0) {
      console.log('❌ No PPG leaders found');
      console.log('ℹ️  Make sure you have run the nightly ETL job to populate leaders data');
      return;
    }

    console.log(`📊 Top ${ppgLeaders.length} PPG Leaders:`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    ppgLeaders.forEach((leader, index) => {
      console.log(`${leader.rank}. ${leader.firstName} ${leader.lastName} (${leader.position})`);
      console.log(`   🏀 ${leader.teamName} (${leader.teamAbbr})`);
      console.log(`   📊 ${leader.ppg.toFixed(1)} PPG | ${leader.gamesPlayed} GP`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error querying PPG leaders:', error);
    throw error;
  }
}

async function main() {
  try {
    await getPPGLeaders();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    await pool.end();
    process.exit(1);
  }
}

main();
