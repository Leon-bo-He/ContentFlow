import { buildApp } from './app.js';
import { config } from './config.js';
import { redis } from './redis/client.js';
import { startWorkers } from './queue/workers.js';

async function main() {
  await redis.connect();
  const app = await buildApp();
  startWorkers();
  await app.listen({ port: config.PORT, host: '0.0.0.0' });
  console.log(`API running on port ${config.PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
