import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(604800),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  WECHAT_APP_ID: z.string().optional(),
  WECHAT_APP_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

const _parsed = envSchema.safeParse(process.env);
if (!_parsed.success) {
  console.error('Invalid environment variables:', _parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = _parsed.data;
export type Config = typeof config;
