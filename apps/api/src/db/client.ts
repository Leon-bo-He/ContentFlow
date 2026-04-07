import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from '../config.js';
import * as schema from './schema/index.js';

const pool = new Pool({ connectionString: config.DATABASE_URL });

export const db = drizzle(pool, { schema });
export type DB = typeof db;
