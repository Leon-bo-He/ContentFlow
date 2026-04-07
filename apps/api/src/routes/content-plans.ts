import type { FastifyPluginAsync } from 'fastify';
const NI = { error: 'Not implemented' };
export const contentPlansRoutes: FastifyPluginAsync = async (app) => {
  app.put('/api/contents/:id/plan', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.get('/api/contents/:id/plan', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.post('/api/contents/:id/references', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.delete('/api/contents/:id/references/:refId', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
};
