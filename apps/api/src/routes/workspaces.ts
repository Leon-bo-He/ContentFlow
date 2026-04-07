import type { FastifyPluginAsync } from 'fastify';
const NI = { error: 'Not implemented' };
export const workspacesRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/workspaces', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.get('/api/workspaces', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.patch('/api/workspaces/:id', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.post('/api/workspaces/:id/plan-templates', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
  app.get('/api/workspaces/:id/plan-templates', { onRequest: [app.authenticate] }, async (_r, reply) => reply.code(501).send(NI));
};
