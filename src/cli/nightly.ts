#!/usr/bin/env node
/**
 * CLI wrapper for nightly ETL job
 * 
 * Usage:
 *   ts-node src/cli/nightly.ts
 *   ts-node src/cli/nightly.ts --season 2025
 */

import { runNightlyJob } from '../etl/jobs/nightly.js';
import { pool } from '../db/client.js';

// Parse command line arguments
function parseArgs(): { season?: number } {
  const args = process.argv.slice(2);
  const options: { season?: number } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--season' && args[i + 1]) {
      options.season = parseInt(args[i + 1]!, 10);
      i++;
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: ts-node src/cli/nightly.ts [options]');
      console.log('');
      console.log('Options:');
      console.log('  --season <year>    Season year (default: current year)');
      console.log('  --help, -h         Show this help message');
      process.exit(0);
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  
  try {
    await runNightlyJob(options);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    await pool.end();
    process.exit(1);
  }
}

main();

