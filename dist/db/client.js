import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
const { Pool } = pg;
// Environment variables
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}
// Create PostgreSQL connection pool
export const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
// Create Drizzle client instance
export const db = drizzle(pool, { schema });
// Test connection and log status
pool.on('connect', () => {
    console.log('✅ Database connection established');
});
pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    process.exit(-1);
});
// Graceful shutdown handler
export async function closeDatabase() {
    await pool.end();
    console.log('🔌 Database connection pool closed');
}
// Export schema for convenience
export { schema };
//# sourceMappingURL=client.js.map