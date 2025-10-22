import * as schema from './schema.js';
export declare const pool: import("pg").Pool;
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> & {
    $client: import("pg").Pool;
};
export declare function closeDatabase(): Promise<void>;
export { schema };
//# sourceMappingURL=client.d.ts.map