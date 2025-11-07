#!/usr/bin/env node
/**
 * Query script to get PPG leaders filtered by age
 * 
 * Usage:
 *   node query-ppg-leaders-age.js [maxAge]
 *   Example: node query-ppg-leaders-age.js 24
 * 
 * NOTE: This script requires birthdate data in the players table.
 * The BallDontLie API doesn't provide birthdate information, so you'll need
 * to populate this data from another source (e.g., NBA.com, Basketball Reference, etc.)
 * 
 * SQL Query for age-based filtering (when birthdate data exists):
 * 
 *   SELECT 
 *     l.rank,
 *     p.full_name AS "playerName",
 *     p.first_name AS "firstName",
 *     p.last_name AS "lastName",
 *     p.position,
 *     t.name AS "teamName",
 *     t.abbreviation AS "teamAbbr",
 *     l.value AS ppg,
 *     l.games_played AS "gamesPlayed",
 *     EXTRACT(YEAR FROM AGE(p.birthdate)) AS age
 *   FROM leaders l
 *   INNER JOIN players p ON l.player_id = p.id
 *   LEFT JOIN teams t ON p.team_id = t.id
 *   WHERE l.stat_type = 'pts'
 *     AND p.birthdate IS NOT NULL
 *     AND EXTRACT(YEAR FROM AGE(p.birthdate)) < 24
 *   ORDER BY l.rank
 *   LIMIT 20
 * 
 * Variations:
 *   - Under age X:    EXTRACT(YEAR FROM AGE(p.birthdate)) < X
 *   - Age X or under: EXTRACT(YEAR FROM AGE(p.birthdate)) <= X
 *   - Age range:      EXTRACT(YEAR FROM AGE(p.birthdate)) BETWEEN 20 AND 25
 *   - Over age X:     EXTRACT(YEAR FROM AGE(p.birthdate)) > X
 */

import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';

// Use external database URL for queries
const { Pool } = pg;
const EXTERNAL_DATABASE_URL = process.env.EXTERNAL_DATABASE_URL;

if (!EXTERNAL_DATABASE_URL) {
  console.error('❌ EXTERNAL_DATABASE_URL environment variable is required');
  process.exit(1);
}

// Get max age from command line args (default: 24)
const maxAge = parseInt(process.argv[2]) || 24;

// Create connection to external database
const pool = new Pool({
  connectionString: EXTERNAL_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function getPPGLeadersByAge() {
  const currentSeason = new Date().getFullYear();
  console.log(`🏀 Points Per Game Leaders Under Age ${maxAge} - ${currentSeason} Season`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // First, let's check if we have birthdate data
    const birthdateCheck = await pool.query(`
      SELECT 
        COUNT(*) as total_leaders,
        COUNT(p.birthdate) as players_with_birthdate,
        COUNT(*) - COUNT(p.birthdate) as players_without_birthdate
      FROM leaders l
      INNER JOIN players p ON l.player_id = p.id
      WHERE l.stat_type = 'pts'
    `);

    console.log('📊 Database Status:');
    console.log(`   Total PPG leaders: ${birthdateCheck.rows[0].total_leaders}`);
    console.log(`   Players with birthdate: ${birthdateCheck.rows[0].players_with_birthdate}`);
    console.log(`   Players without birthdate: ${birthdateCheck.rows[0].players_without_birthdate}`);
    console.log('');

    if (parseInt(birthdateCheck.rows[0].players_with_birthdate) === 0) {
      console.log('⚠️  WARNING: No players have birthdate data in the database!');
      console.log('   The ETL job sets birthdate to NULL because the BallDontLie API doesn\'t provide it.');
      console.log('   You would need to source birthdate data from another API or database.');
      console.log('');
      console.log('📝 Showing top PPG leaders (without age filter):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Show top leaders without age filter
      const allLeaders = await pool.query(`
        SELECT 
          l.rank,
          p.full_name AS "playerName",
          p.first_name AS "firstName",
          p.last_name AS "lastName",
          p.position,
          t.name AS "teamName",
          t.abbreviation AS "teamAbbr",
          l.value AS ppg,
          l.games_played AS "gamesPlayed"
        FROM leaders l
        INNER JOIN players p ON l.player_id = p.id
        LEFT JOIN teams t ON p.team_id = t.id
        WHERE l.stat_type = 'pts'
        ORDER BY l.rank
        LIMIT 20
      `);

      allLeaders.rows.forEach((leader) => {
        console.log(`${leader.rank}. ${leader.firstName} ${leader.lastName} (${leader.position})`);
        console.log(`   🏀 ${leader.teamName} (${leader.teamAbbr})`);
        console.log(`   📊 ${parseFloat(leader.ppg).toFixed(1)} PPG | ${leader.gamesPlayed} GP`);
        console.log('');
      });

      await pool.end();
      return;
    }

    // Raw SQL query with age calculation
    const query = `
      SELECT 
        l.rank,
        p.full_name AS "playerName",
        p.first_name AS "firstName",
        p.last_name AS "lastName",
        p.position,
        t.name AS "teamName",
        t.abbreviation AS "teamAbbr",
        l.value AS ppg,
        l.games_played AS "gamesPlayed",
        EXTRACT(YEAR FROM AGE(p.birthdate)) AS age
      FROM leaders l
      INNER JOIN players p ON l.player_id = p.id
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE l.stat_type = 'pts'
        AND p.birthdate IS NOT NULL
        AND EXTRACT(YEAR FROM AGE(p.birthdate)) < $1
      ORDER BY l.rank
      LIMIT 20
    `;

    const result = await pool.query(query, [maxAge]);

    if (result.rows.length === 0) {
      console.log(`❌ No PPG leaders found for players under age ${maxAge}`);
      console.log(`   Found ${birthdateCheck.rows[0].players_with_birthdate} players with birthdate data, but none meet the age criteria.`);
      console.log('   Try increasing the age limit or check if the data is correct.');
      return;
    }

    console.log(`📊 Top ${result.rows.length} PPG Leaders (Under Age ${maxAge}):`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    result.rows.forEach((leader) => {
      console.log(`${leader.rank}. ${leader.firstName} ${leader.lastName} (${leader.position}) - Age ${Math.floor(leader.age)}`);
      console.log(`   🏀 ${leader.teamName} (${leader.teamAbbr})`);
      console.log(`   📊 ${parseFloat(leader.ppg).toFixed(1)} PPG | ${leader.gamesPlayed} GP`);
      console.log('');
    });

    console.log('\n📝 SQL Query Used:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(query.replace('$1', maxAge.toString()));

  } catch (error) {
    console.error('❌ Error querying PPG leaders:', error);
    throw error;
  }
}

async function main() {
  try {
    await getPPGLeadersByAge();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    await pool.end();
    process.exit(1);
  }
}

main();
