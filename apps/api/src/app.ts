import Fastify from 'fastify';
import { config } from './config.js';
import { corsPlugin } from './plugins/cors.js';
import { authPlugin } from './plugins/auth.js';
import { registerRoutes } from './routes/index.js';

export async function buildApp() {
  const app = Fastify({
    logger: config.NODE_ENV !== 'test',
  });

  await app.register(corsPlugin);
  await app.register(authPlugin);
  await registerRoutes(app);

  return app;
}
