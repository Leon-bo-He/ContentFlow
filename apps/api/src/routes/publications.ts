import type { FastifyPluginAsync } from 'fastify';
const NI = { error: 'Not implemented' };
export const publicationsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/contents/:id/publications', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.get('/api/contents/:id/publications', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.patch('/api/publications/:id', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.post('/api/publications/:id/mark-published', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.get('/api/publications/queue', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.patch('/api/publications/batch', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
};
