import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp, registerAndLogin, authHeaders } from '../helpers/app.js';
import { truncateAll } from '../helpers/db.js';

describe('Content routes', () => {
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
      payload: { name: 'WS', icon: '📺', color: '#6366f1' },
    });
    wsId = ws.json<{ id: string }>().id;
  });

  const createContent = (payload?: object) =>
    app.inject({
      method: 'POST', url: '/api/contents', headers: authHeaders(token),
      payload: { workspaceId: wsId, title: 'My Content', contentType: 'article', tags: [], targetPlatforms: [], ...payload },
    });

  describe('POST /api/contents', () => {
    it('creates content and returns 201', async () => {
      const res = await createContent();
      expect(res.statusCode).toBe(201);
      const body = res.json<{ title: string; stage: string; stageHistory: Array<{ stage: string }> }>();
      expect(body.title).toBe('My Content');
      expect(body.stage).toBe('planned');
      expect(body.stageHistory[0]!.stage).toBe('planned');
    });

    it('returns 403 when workspace does not belong to user', async () => {
      const { token: otherToken } = await registerAndLogin(app);
      const res = await app.inject({
        method: 'POST', url: '/api/contents', headers: authHeaders(otherToken),
        payload: { workspaceId: wsId, title: 'X', contentType: 'article', tags: [], targetPlatforms: [] },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/contents', () => {
    it('requires workspace query param', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/contents', headers: authHeaders(token) });
      expect(res.statusCode).toBe(400);
    });

    it('returns contents for workspace', async () => {
      await createContent({ title: 'C1' });
      await createContent({ title: 'C2' });
      const res = await app.inject({
        method: 'GET', url: `/api/contents?workspace=${wsId}`, headers: authHeaders(token),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveLength(2);
    });

    it('filters by stage', async () => {
      await createContent({ title: 'Planned' });
      const c2 = await createContent({ title: 'Creating' });
      const c2Id = c2.json<{ id: string }>().id;
      await app.inject({
        method: 'PATCH', url: `/api/contents/${c2Id}`, headers: authHeaders(token),
        payload: { stage: 'creating' },
      });
      const res = await app.inject({
        method: 'GET', url: `/api/contents?workspace=${wsId}&stage=creating`, headers: authHeaders(token),
      });
      expect(res.json()).toHaveLength(1);
      expect(res.json<Array<{ title: string }>>()[0]!.title).toBe('Creating');
    });
  });

  describe('PATCH /api/contents/:id', () => {
    it('updates title', async () => {
      const created = await createContent();
      const id = created.json<{ id: string }>().id;
      const res = await app.inject({
        method: 'PATCH', url: `/api/contents/${id}`, headers: authHeaders(token),
        payload: { title: 'Updated Title' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json<{ title: string }>().title).toBe('Updated Title');
    });

    it('advances stage and appends to stageHistory', async () => {
      const created = await createContent();
      const id = created.json<{ id: string }>().id;
      const res = await app.inject({
        method: 'PATCH', url: `/api/contents/${id}`, headers: authHeaders(token),
        payload: { stage: 'creating' },
      });
      const body = res.json<{ stage: string; stageHistory: Array<{ stage: string }> }>();
      expect(body.stage).toBe('creating');
      expect(body.stageHistory).toHaveLength(2);
    });

    it('returns 403 for another user\'s content', async () => {
      const created = await createContent();
      const id = created.json<{ id: string }>().id;
      const { token: otherToken } = await registerAndLogin(app);
      const res = await app.inject({
        method: 'PATCH', url: `/api/contents/${id}`, headers: authHeaders(otherToken),
        payload: { title: 'Hijacked' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/contents/:id', () => {
    it('deletes content and returns 204', async () => {
      const created = await createContent();
      const id = created.json<{ id: string }>().id;
      const res = await app.inject({
        method: 'DELETE', url: `/api/contents/${id}`, headers: authHeaders(token),
      });
      expect(res.statusCode).toBe(204);

      const list = await app.inject({
        method: 'GET', url: `/api/contents?workspace=${wsId}`, headers: authHeaders(token),
      });
      expect(list.json()).toHaveLength(0);
    });

    it('returns 403 for another user\'s content', async () => {
      const created = await createContent();
      const id = created.json<{ id: string }>().id;
      const { token: otherToken } = await registerAndLogin(app);
      const res = await app.inject({
        method: 'DELETE', url: `/api/contents/${id}`, headers: authHeaders(otherToken),
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/contents/calendar', () => {
    it('requires from and to params', async () => {
      const res = await app.inject({
        method: 'GET', url: '/api/contents/calendar', headers: authHeaders(token),
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns contents grouped by date', async () => {
      await createContent({ scheduledAt: '2026-04-15T10:00:00Z', title: 'Apr 15 content' });
      await createContent({ scheduledAt: '2026-04-15T18:00:00Z', title: 'Apr 15 content 2' });
      await createContent({ scheduledAt: '2026-04-16T10:00:00Z', title: 'Apr 16 content' });
      await createContent(); // no scheduledAt — should not appear

      const res = await app.inject({
        method: 'GET',
        url: `/api/contents/calendar?workspace=${wsId}&from=2026-04-01&to=2026-04-30`,
        headers: authHeaders(token),
      });
      expect(res.statusCode).toBe(200);
      const grouped = res.json<Record<string, unknown[]>>();
      expect(grouped['2026-04-15']).toHaveLength(2);
      expect(grouped['2026-04-16']).toHaveLength(1);
      expect(Object.keys(grouped)).toHaveLength(2);
    });
  });

  describe('GET /api/contents/archived/export', () => {
    it('returns archived contents', async () => {
      const created = await createContent();
      const id = created.json<{ id: string }>().id;
      await app.inject({
        method: 'PATCH', url: `/api/contents/${id}`, headers: authHeaders(token),
        payload: { stage: 'archived' },
      });
      const res = await app.inject({
        method: 'GET', url: `/api/contents/archived/export?workspace=${wsId}`, headers: authHeaders(token),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveLength(1);
    });
  });

  describe('DELETE /api/contents/archived', () => {
    it('deletes archived contents and returns count', async () => {
      const created = await createContent();
      const id = created.json<{ id: string }>().id;
      await app.inject({
        method: 'PATCH', url: `/api/contents/${id}`, headers: authHeaders(token),
        payload: { stage: 'archived' },
      });
      const res = await app.inject({
        method: 'DELETE', url: `/api/contents/archived?workspace=${wsId}`, headers: authHeaders(token),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json<{ deleted: number }>().deleted).toBe(1);
    });
  });
});
