import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp, registerAndLogin, authHeaders } from '../helpers/app.js';
import { truncateAll } from '../helpers/db.js';

describe('Ideas routes', () => {
  let app: FastifyInstance;
  let token: string;
  let wsId: string;

  beforeAll(async () => { app = await createTestApp(); });
  afterAll(async () => { await app.close(); });
  beforeEach(async () => {
    await truncateAll();
    ({ token } = await registerAndLogin(app));
    const ws = await app.inject({
      method: 'POST', url: '/api/workspaces', headers: authHeaders(token),
      payload: { name: 'WS', icon: '📺', color: '#000' },
    });
    wsId = ws.json<{ id: string }>().id;
  });

  const createIdea = (payload?: object) =>
    app.inject({
      method: 'POST', url: '/api/ideas', headers: authHeaders(token),
      payload: { title: 'My Idea', tags: [], priority: 'medium', ...payload },
    });

  describe('POST /api/ideas', () => {
    it('creates idea in global pool and returns 201', async () => {
      const res = await createIdea();
      expect(res.statusCode).toBe(201);
      const body = res.json<{ title: string; status: string; workspaceId: unknown }>();
      expect(body.title).toBe('My Idea');
      expect(body.status).toBe('active');
      expect(body.workspaceId).toBeNull();
    });

    it('creates idea in a specific workspace', async () => {
      const res = await createIdea({ workspaceId: wsId });
      expect(res.statusCode).toBe(201);
      expect(res.json<{ workspaceId: string }>().workspaceId).toBe(wsId);
    });

    it('returns 401 without token', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/ideas', payload: { title: 'X', tags: [], priority: 'medium' } });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/ideas', () => {
    it('lists all ideas for user', async () => {
      await createIdea({ title: 'Idea 1' });
      await createIdea({ title: 'Idea 2' });
      const res = await app.inject({ method: 'GET', url: '/api/ideas', headers: authHeaders(token) });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveLength(2);
    });

    it('filters by workspace', async () => {
      await createIdea({ title: 'Global Idea' });
      await createIdea({ title: 'WS Idea', workspaceId: wsId });
      const res = await app.inject({
        method: 'GET', url: `/api/ideas?workspace=${wsId}`, headers: authHeaders(token),
      });
      const ideas = res.json<Array<{ title: string }>>();
      expect(ideas.every((i) => i.title === 'WS Idea')).toBe(true);
    });

    it('filters by priority', async () => {
      await createIdea({ priority: 'high' });
      await createIdea({ priority: 'low' });
      const res = await app.inject({ method: 'GET', url: '/api/ideas?priority=high', headers: authHeaders(token) });
      expect(res.json()).toHaveLength(1);
    });
  });

  describe('PATCH /api/ideas/:id', () => {
    it('updates idea title', async () => {
      const created = await createIdea();
      const ideaId = created.json<{ id: string }>().id;
      const res = await app.inject({
        method: 'PATCH', url: `/api/ideas/${ideaId}`, headers: authHeaders(token),
        payload: { title: 'Updated Idea' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json<{ title: string }>().title).toBe('Updated Idea');
    });

    it('returns 403 for another user\'s idea', async () => {
      const created = await createIdea();
      const ideaId = created.json<{ id: string }>().id;
      const { token: otherToken } = await registerAndLogin(app);
      const res = await app.inject({
        method: 'PATCH', url: `/api/ideas/${ideaId}`, headers: authHeaders(otherToken),
        payload: { title: 'Hijacked' },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/ideas/:id/convert', () => {
    it('converts idea to content and marks idea as converted', async () => {
      const created = await createIdea({ title: 'Convert Me' });
      const ideaId = created.json<{ id: string }>().id;
      const res = await app.inject({
        method: 'POST', url: `/api/ideas/${ideaId}/convert`, headers: authHeaders(token),
        payload: { workspaceId: wsId },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<{ idea: { status: string; convertedTo: string }; content: { id: string; title: string } }>();
      expect(body.idea.status).toBe('converted');
      expect(body.idea.convertedTo).toBe(body.content.id);
      expect(body.content.title).toBe('Convert Me');
    });

    it('uses custom title when provided', async () => {
      const created = await createIdea();
      const ideaId = created.json<{ id: string }>().id;
      const res = await app.inject({
        method: 'POST', url: `/api/ideas/${ideaId}/convert`, headers: authHeaders(token),
        payload: { workspaceId: wsId, title: 'Custom Title' },
      });
      expect(res.json<{ content: { title: string } }>().content.title).toBe('Custom Title');
    });
  });

  describe('GET /api/ideas/archived/export', () => {
    it('returns empty array when no archived ideas', async () => {
      const res = await app.inject({
        method: 'GET', url: '/api/ideas/archived/export', headers: authHeaders(token),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual([]);
    });

    it('returns archived ideas', async () => {
      const created = await createIdea();
      const ideaId = created.json<{ id: string }>().id;
      await app.inject({
        method: 'PATCH', url: `/api/ideas/${ideaId}`, headers: authHeaders(token),
        payload: { status: 'archived' },
      });
      const res = await app.inject({
        method: 'GET', url: '/api/ideas/archived/export', headers: authHeaders(token),
      });
      expect(res.json()).toHaveLength(1);
    });
  });

  describe('DELETE /api/ideas/archived', () => {
    it('deletes archived ideas and returns count', async () => {
      const created = await createIdea();
      const ideaId = created.json<{ id: string }>().id;
      await app.inject({
        method: 'PATCH', url: `/api/ideas/${ideaId}`, headers: authHeaders(token),
        payload: { status: 'archived' },
      });
      const res = await app.inject({
        method: 'DELETE', url: '/api/ideas/archived', headers: authHeaders(token),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json<{ deleted: number }>().deleted).toBe(1);
    });
  });
});
