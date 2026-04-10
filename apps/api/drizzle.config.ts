import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/*.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgres://orbit:secret@localhost:5432/orbit',
  },
});
