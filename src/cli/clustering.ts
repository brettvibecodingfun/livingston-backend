#!/usr/bin/env node
/**
 * CLI wrapper for clustering ETL job
 * 
 * Usage:
 *   npm run etl:clustering
 *   npm run etl:clustering -- --min-games 25 --min-minutes 20 --max-cluster-size 40
 */

import dotenv from 'dotenv';
// Load environment variables from .env file BEFORE importing other modules
dotenv.config();

import { runClusteringJob } from '../etl/jobs/clustering.js';
import { pool } from '../db/client.js';

// Parse command line arguments
function parseArgs(): {
  minGames?: number;
  minMinutes?: number;
  maxClusterSize?: number;
  currentSeason?: number;
} {
  const args = process.argv.slice(2);
  const options: {
    minGames?: number;
    minMinutes?: number;
    maxClusterSize?: number;
    currentSeason?: number;
  } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--min-games' && args[i + 1]) {
      options.minGames = parseInt(args[i + 1]!, 10);
      i++;
    } else if (arg === '--min-minutes' && args[i + 1]) {
      options.minMinutes = parseFloat(args[i + 1]!);
      i++;
    } else if (arg === '--max-cluster-size' && args[i + 1]) {
      options.maxClusterSize = parseInt(args[i + 1]!, 10);
      i++;
    } else if (arg === '--current-season' && args[i + 1]) {
      options.currentSeason = parseInt(args[i + 1]!, 10);
      i++;
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: npm run etl:clustering [options]');
      console.log('');
      console.log('Options:');
      console.log('  --min-games <number>        Minimum games played (default: 20)');
      console.log('  --min-minutes <number>      Minimum minutes per game (default: 15)');
      console.log('  --max-cluster-size <num>   Maximum players per cluster before splitting (default: 50)');
      console.log('  --current-season <year>     Current season year (default: 2026)');
      console.log('  --help, -h                 Show this help message');
      process.exit(0);
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  
  try {
    await runClusteringJob(options);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    await pool.end();
    process.exit(1);
  }
}

main();
