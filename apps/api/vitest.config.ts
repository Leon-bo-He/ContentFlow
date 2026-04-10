import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://orbit:secret@localhost:5433/orbit_test',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
    },
  },
});
