import { config } from '../config.js';

export const bullmqConnection = {
  host: new URL(config.REDIS_URL).hostname,
  port: parseInt(new URL(config.REDIS_URL).port || '6379', 10),
};
