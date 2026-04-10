import { sql } from 'drizzle-orm';
import { db } from '../../db/client.js';

/**
 * Truncates all tables in dependency order.
 * CASCADE handles foreign key constraints automatically.
 * Use in beforeEach of integration tests.
 */
export async function truncateAll(): Promise<void> {
  await db.execute(sql`TRUNCATE TABLE users CASCADE`);
}
