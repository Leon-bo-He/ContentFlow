import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env['DATABASE_URL'] ?? 'postgres://contentflow:secret@localhost:5432/contentflow',
  },
} satisfies Config;
