import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';
import { authRoutes } from './auth.js';
import { ideasRoutes } from './ideas.js';
import { workspacesRoutes } from './workspaces.js';
import { contentsRoutes } from './contents.js';
import { contentPlansRoutes } from './content-plans.js';
import { publicationsRoutes } from './publications.js';
import { metricsRoutes } from './metrics.js';
import { dashboardRoutes } from './dashboard.js';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(ideasRoutes);
  await app.register(workspacesRoutes);
  await app.register(contentsRoutes);
  await app.register(contentPlansRoutes);
  await app.register(publicationsRoutes);
  await app.register(metricsRoutes);
  await app.register(dashboardRoutes);
}
