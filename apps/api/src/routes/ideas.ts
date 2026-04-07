import type { FastifyPluginAsync } from 'fastify';
const NI = { error: 'Not implemented' };
export const ideasRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/ideas', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.get('/api/ideas', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.patch('/api/ideas/:id', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.post('/api/ideas/:id/convert', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
};
