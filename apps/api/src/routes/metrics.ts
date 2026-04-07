import type { FastifyPluginAsync } from 'fastify';
const NI = { error: 'Not implemented' };
export const metricsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/metrics', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.get('/api/metrics/dashboard', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.get('/api/metrics/content/:id', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
};
