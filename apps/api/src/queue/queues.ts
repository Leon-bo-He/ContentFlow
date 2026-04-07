import { Queue } from 'bullmq';
import { bullmqConnection } from './client.js';

export const notificationQueue = new Queue('notifications', { connection: bullmqConnection });
export const syncQueue = new Queue('sync', { connection: bullmqConnection });
