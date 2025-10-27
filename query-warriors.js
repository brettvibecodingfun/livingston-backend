#!/usr/bin/env node
/**
 * Query script to get Warriors box score from last night
 * 
 * Usage:
 *   node query-warriors.js
 */

import dotenv from 'dotenv';
dotenv.config();

import { db } from './dist/db/client.js';
import { teams, players, games, boxScores } from './dist/db/schema.js';
import { eq, and, gte, lt } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { pool } from './dist/db/client.js';

/**
 * Get yesterday's date in America/Chicago timezone
 */
function getYesterdayChicago() {
  const now = new Date();
  // Convert to Chicago time (UTC-5 or UTC-6 depending on DST)
  const chicagoOffset = -6 * 60; // CST offset in minutes
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const chicagoTime = new Date(utcTime + chicagoOffset * 60000);
  
  // Subtract one day
  chicagoTime.setDate(chicagoTime.getDate() - 1);
  
  return chicagoTime.toISOString().split('T')[0];
}

async function getWarriorsBoxScore() {
  const yesterday = getYesterdayChicago();
  console.log(`🏀 Looking for Warriors box score from ${yesterday} (America/Chicago)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Create table aliases for home and away teams
    const homeTeams = alias(teams, 'homeTeams');
    const awayTeams = alias(teams, 'awayTeams');
    
    // First, check if there were any games yesterday
    const yesterdayGames = await db
      .select({
        id: games.id,
        date: games.date,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        homeScore: games.homeScore,
        awayScore: games.awayScore,
        homeTeam: {
          name: homeTeams.name,
          abbreviation: homeTeams.abbreviation,
        },
        awayTeam: {
          name: awayTeams.name,
          abbreviation: awayTeams.abbreviation,
        }
      })
      .from(games)
      .leftJoin(homeTeams, eq(games.homeTeamId, homeTeams.id))
      .leftJoin(awayTeams, eq(games.awayTeamId, awayTeams.id))
      .where(eq(games.date, yesterday));

    if (yesterdayGames.length === 0) {
      console.log('❌ No games found for yesterday');
      console.log('ℹ️  This might be an off-day for the NBA');
      return;
    }

    console.log(`📅 Found ${yesterdayGames.length} game(s) yesterday:`);
    yesterdayGames.forEach(game => {
      console.log(`   • ${game.awayTeam?.abbreviation} @ ${game.homeTeam?.abbreviation}`);
    });
    console.log('');

    // Look for Warriors games (GSW or WAR)
    const warriorsGames = yesterdayGames.filter(game => 
      game.homeTeam?.abbreviation === 'GSW' || 
      game.awayTeam?.abbreviation === 'GSW' ||
      game.homeTeam?.abbreviation === 'WAR' || 
      game.awayTeam?.abbreviation === 'WAR'
    );

    if (warriorsGames.length === 0) {
      console.log('❌ No Warriors games found yesterday');
      console.log('ℹ️  Warriors might not have played yesterday');
      return;
    }

    console.log(`🏀 Found ${warriorsGames.length} Warriors game(s):`);
    warriorsGames.forEach(game => {
      console.log(`   • ${game.awayTeam?.abbreviation} @ ${game.homeTeam?.abbreviation}`);
    });
    console.log('');

    // Get box scores for each Warriors game
    for (const game of warriorsGames) {
      console.log(`🎯 Game: ${game.awayTeam?.abbreviation} @ ${game.homeTeam?.abbreviation}`);
      console.log(`📅 Date: ${game.date}`);
      if (game.homeScore !== null && game.awayScore !== null) {
        console.log(`🏆 Final Score: ${game.awayTeam?.abbreviation} ${game.awayScore} - ${game.homeScore} ${game.homeTeam?.abbreviation}`);
      }
      console.log('');

      // Get Warriors box scores for this game
      const warriorsBoxScores = await db
        .select({
          player: {
            firstName: players.firstName,
            lastName: players.lastName,
            position: players.position,
          },
          team: {
            name: teams.name,
            abbreviation: teams.abbreviation,
          },
          stats: {
            minutes: boxScores.minutes,
            points: boxScores.points,
            assists: boxScores.assists,
            rebounds: boxScores.rebounds,
            steals: boxScores.steals,
            blocks: boxScores.blocks,
            turnovers: boxScores.turnovers,
            fgm: boxScores.fgm,
            fga: boxScores.fga,
            tpm: boxScores.tpm,
            tpa: boxScores.tpa,
            ftm: boxScores.ftm,
            fta: boxScores.fta,
          }
        })
        .from(boxScores)
        .innerJoin(players, eq(boxScores.playerId, players.id))
        .innerJoin(teams, eq(boxScores.teamId, teams.id))
        .where(
          and(
            eq(boxScores.gameId, game.id),
            eq(teams.abbreviation, 'GSW')
          )
        )
        .orderBy(boxScores.points);

      if (warriorsBoxScores.length === 0) {
        console.log('❌ No Warriors box scores found for this game');
        continue;
      }

      console.log(`👥 Warriors Players (${warriorsBoxScores.length}):`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      warriorsBoxScores.forEach(player => {
        const stats = player.stats;
        console.log(`${player.player.firstName} ${player.player.lastName} (${player.player.position})`);
        console.log(`  📊 ${stats.points || 0} PTS | ${stats.assists || 0} AST | ${stats.rebounds || 0} REB`);
        console.log(`  ⏱️  ${stats.minutes || 0} MIN | ${stats.steals || 0} STL | ${stats.blocks || 0} BLK`);
        if (stats.fga && stats.fga > 0) {
          const fgPct = ((stats.fgm || 0) / stats.fga * 100).toFixed(1);
          console.log(`  🎯 ${stats.fgm || 0}/${stats.fga} FG (${fgPct}%)`);
        }
        if (stats.tpa && stats.tpa > 0) {
          const tpPct = ((stats.tpm || 0) / stats.tpa * 100).toFixed(1);
          console.log(`  🏹 ${stats.tpm || 0}/${stats.tpa} 3PT (${tpPct}%)`);
        }
        if (stats.fta && stats.fta > 0) {
          const ftPct = ((stats.ftm || 0) / stats.fta * 100).toFixed(1);
          console.log(`  🎯 ${stats.ftm || 0}/${stats.fta} FT (${ftPct}%)`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error querying database:', error);
    throw error;
  }
}

async function main() {
  try {
    await getWarriorsBoxScore();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    await pool.end();
    process.exit(1);
  }
}

main();
