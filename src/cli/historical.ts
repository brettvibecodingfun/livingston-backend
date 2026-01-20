#!/usr/bin/env node
/**
 * CLI wrapper for historical season averages ETL job
 * 
 * Usage:
 *   ts-node src/cli/historical.ts --season 2024
 *   ts-node src/cli/historical.ts --season 2024 --season-type regular
 */

// Load environment variables FIRST before any imports
// This ensures BALLDONTLIE_KEY is available when provider modules load
import dotenv from 'dotenv';
dotenv.config();

import { runHistoricalJob } from '../etl/jobs/historical.js';
import { pool } from '../db/client.js';

// Parse command line arguments
function parseArgs(): { season: number; seasonType?: string } {
  const args = process.argv.slice(2);
  const options: { season: number; seasonType?: string } = { season: 2024 };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--season' && args[i + 1]) {
      options.season = parseInt(args[i + 1]!, 10);
      i++;
    } else if (arg === '--season-type' && args[i + 1]) {
      options.seasonType = args[i + 1]!;
      i++;
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: npm run etl:historical -- --season <year> [options]');
      console.log('');
      console.log('Options:');
      console.log('  --season <year>       API season year (e.g., 2024, will be stored as 2025)');
      console.log('  --season-type <type>  Season type: regular or playoffs (default: regular)');
      console.log('  --help, -h           Show this help message');
      process.exit(0);
    }
  }

  if (!options.season) {
    console.error('Error: --season is required');
    process.exit(1);
  }

  return options;
}

async function main() {
  const options = parseArgs();
  
  try {
    await runHistoricalJob(options);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    await pool.end();
    process.exit(1);
  }
}

main();
