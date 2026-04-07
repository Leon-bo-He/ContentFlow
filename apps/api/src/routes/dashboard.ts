import type { FastifyPluginAsync } from 'fastify';
const NI = { error: 'Not implemented' };
export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/dashboard', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
};
