#!/usr/bin/env node
/**
 * CLI wrapper for incremental ETL job
 * 
 * Usage:
 *   ts-node src/cli/incremental.ts
 *   ts-node src/cli/incremental.ts --refresh-mv
 */

import { runIncrementalJob } from '../etl/jobs/incremental.js';
import { pool } from '../db/client.js';

// Parse command line arguments
function parseArgs(): { refreshMv?: boolean } {
  const args = process.argv.slice(2);
  const options: { refreshMv?: boolean } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--refresh-mv') {
      options.refreshMv = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: ts-node src/cli/incremental.ts [options]');
      console.log('');
      console.log('Options:');
      console.log('  --refresh-mv       Refresh materialized views after update');
      console.log('  --help, -h         Show this help message');
      process.exit(0);
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  
  try {
    await runIncrementalJob(options);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    await pool.end();
    process.exit(1);
  }
}

main();

