import type { FastifyPluginAsync } from 'fastify';
const NI = { error: 'Not implemented' };
export const contentsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/contents', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.get('/api/contents', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.patch('/api/contents/:id', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.get('/api/contents/calendar', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
};
