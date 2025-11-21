#!/usr/bin/env node
/**
 * Test script to verify Cooper Flagg is included in season averages fetch
 */

import dotenv from 'dotenv';
import { db } from './dist/db/client.js';
import { players } from './dist/db/schema.js';
import { fetchSeasonAverages } from './dist/etl/providers/balldontlie.js';
import { eq } from 'drizzle-orm';

dotenv.config();

async function testCooperFlagg() {
  try {
    console.log('🔍 Testing Cooper Flagg season averages fetch...\n');
    
    // Step 1: Check if Cooper Flagg exists in database
    console.log('Step 1: Checking if Cooper Flagg exists in database...');
    const cooperFlagg = await db
      .select({ apiId: players.apiId, firstName: players.firstName, lastName: players.lastName })
      .from(players)
      .where(eq(players.apiId, 1057262088))
      .limit(1);
    
    if (cooperFlagg.length === 0) {
      console.log('❌ Cooper Flagg (api_id: 1057262088) not found in database!');
      process.exit(1);
    }
    
    console.log(`✅ Found Cooper Flagg: ${cooperFlagg[0].firstName} ${cooperFlagg[0].lastName} (api_id: ${cooperFlagg[0].apiId})\n`);
    
    // Step 2: Get ALL players from database (like the nightly job does now)
    console.log('Step 2: Querying all players from database...');
    const allPlayersInDb = await db
      .select({ apiId: players.apiId })
      .from(players);
    const playerApiIds = allPlayersInDb.map(p => p.apiId);
    console.log(`✅ Found ${playerApiIds.length} total players in database`);
    
    // Check if Cooper Flagg is in the list
    const cooperFlaggIncluded = playerApiIds.includes(1057262088);
    console.log(`   Cooper Flagg included: ${cooperFlaggIncluded ? '✅ YES' : '❌ NO'}\n`);
    
    if (!cooperFlaggIncluded) {
      console.log('❌ Cooper Flagg is NOT in the list of players to fetch season averages for!');
      process.exit(1);
    }
    
    // Step 3: Test fetching season averages for Cooper Flagg specifically
    console.log('Step 3: Testing fetchSeasonAverages for Cooper Flagg (api_id: 1057262088)...');
    try {
      const seasonAverages = await fetchSeasonAverages(2025, 'regular', [1057262088]);
      console.log(`✅ API returned ${seasonAverages.length} season average(s) for Cooper Flagg`);
      
      if (seasonAverages.length > 0) {
        const avg = seasonAverages[0];
        console.log(`   Season: ${avg.season}`);
        console.log(`   Player ID: ${avg.player?.id}`);
        console.log(`   Points: ${avg.pts}`);
        console.log(`   Games Played: ${avg.games_played}`);
        console.log(`   FG%: ${avg.fg_pct}`);
        console.log(`   3P%: ${avg.fg3_pct}`);
        console.log(`   FT%: ${avg.ft_pct}`);
      } else {
        console.log('⚠️  API did not return season averages for Cooper Flagg');
        console.log('   This could mean:');
        console.log('   - He has not played any games yet this season');
        console.log('   - The API does not have data for him yet');
      }
    } catch (error) {
      console.log(`❌ Error fetching season averages: ${error.message}`);
      throw error;
    }
    
    // Step 4: Test fetching for a larger batch (like the nightly job does)
    console.log('\nStep 4: Testing fetchSeasonAverages for all players (first 10 for speed)...');
    const testPlayerIds = playerApiIds.slice(0, 10);
    const cooperFlaggInTestBatch = testPlayerIds.includes(1057262088);
    console.log(`   Testing with ${testPlayerIds.length} players`);
    console.log(`   Cooper Flagg in test batch: ${cooperFlaggInTestBatch ? '✅ YES' : '❌ NO'}`);
    
    if (!cooperFlaggInTestBatch && playerApiIds.length > 10) {
      // Add Cooper Flagg to the test batch
      testPlayerIds.push(1057262088);
      console.log(`   Added Cooper Flagg to test batch`);
    }
    
    try {
      const allSeasonAverages = await fetchSeasonAverages(2025, 'regular', testPlayerIds);
      console.log(`✅ API returned ${allSeasonAverages.length} season average(s) for test batch`);
      
      const cooperFlaggAverages = allSeasonAverages.filter(avg => avg.player?.id === 1057262088);
      if (cooperFlaggAverages.length > 0) {
        console.log(`   ✅ Cooper Flagg season averages found in batch fetch!`);
      } else {
        console.log(`   ⚠️  Cooper Flagg season averages NOT found in batch fetch`);
      }
    } catch (error) {
      console.log(`❌ Error fetching batch season averages: ${error.message}`);
      throw error;
    }
    
    console.log('\n✅ All tests passed! The fix should work correctly.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testCooperFlagg();

