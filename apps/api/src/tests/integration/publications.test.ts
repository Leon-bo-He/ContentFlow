import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp, registerAndLogin, authHeaders } from '../helpers/app.js';
import { truncateAll } from '../helpers/db.js';

describe('Publication routes', () => {
  let app: FastifyInstance;
  let token: string;
  let contentId: string;

  beforeAll(async () => { app = await createTestApp(); });
  afterAll(async () => { await app.close(); });
  beforeEach(async () => {
    await truncateAll();
    ({ token } = await registerAndLogin(app));
    const ws = await app.inject({
      method: 'POST', url: '/api/workspaces', headers: authHeaders(token),
      payload: { name: 'WS', icon: '📺', color: '#6366f1' },
    });
    const wsId = ws.json<{ id: string }>().id;
    const content = await app.inject({
      method: 'POST', url: '/api/contents', headers: authHeaders(token),
      payload: { workspaceId: wsId, title: 'Test Content', contentType: 'article', tags: [], targetPlatforms: [] },
    });
    contentId = content.json<{ id: string }>().id;
  });

  const createPub = (payload?: object) =>
    app.inject({
      method: 'POST',
      url: `/api/contents/${contentId}/publications`,
      headers: authHeaders(token),
      payload: { platform: 'douyin', platformTags: [], ...payload },
    });

  describe('POST /api/contents/:id/publications', () => {
    it('creates publication with draft status when no scheduledAt', async () => {
      const res = await createPub();
      expect(res.statusCode).toBe(201);
      const body = res.json<{ platform: string; status: string }>();
      expect(body.platform).toBe('douyin');
      expect(body.status).toBe('draft');
    });

    it('creates publication with queued status when scheduledAt provided', async () => {
      const res = await createPub({ scheduledAt: '2026-04-15T18:00:00Z' });
      expect(res.statusCode).toBe(201);
      expect(res.json<{ status: string }>().status).toBe('queued');
    });

    it('returns 403 for another user\'s content', async () => {
      const { token: otherToken } = await registerAndLogin(app);
      const res = await app.inject({
        method: 'POST',
        url: `/api/contents/${contentId}/publications`,
        headers: authHeaders(otherToken),
        payload: { platform: 'douyin', platformTags: [] },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/contents/:id/publications', () => {
    it('lists publications for content', async () => {
      await createPub({ platform: 'douyin' });
      await createPub({ platform: 'xiaohongshu' });
      const res = await app.inject({
        method: 'GET', url: `/api/contents/${contentId}/publications`, headers: authHeaders(token),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveLength(2);
    });
  });

  describe('PATCH /api/publications/:id', () => {
    it('updates platform copy', async () => {
      const pub = await createPub();
      const pubId = pub.json<{ id: string }>().id;
      const res = await app.inject({
        method: 'PATCH', url: `/api/publications/${pubId}`, headers: authHeaders(token),
        payload: { platformCopy: 'Check out my new video!' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json<{ platformCopy: string }>().platformCopy).toBe('Check out my new video!');
    });

    it('returns 403 for another user\'s publication', async () => {
      const pub = await createPub();
      const pubId = pub.json<{ id: string }>().id;
      const { token: otherToken } = await registerAndLogin(app);
      const res = await app.inject({
        method: 'PATCH', url: `/api/publications/${pubId}`, headers: authHeaders(otherToken),
        payload: { platformCopy: 'Hacked' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/publications/:id', () => {
    it('deletes publication and returns 204', async () => {
      const pub = await createPub();
      const pubId = pub.json<{ id: string }>().id;
      const res = await app.inject({
        method: 'DELETE', url: `/api/publications/${pubId}`, headers: authHeaders(token),
      });
      expect(res.statusCode).toBe(204);

      const list = await app.inject({
        method: 'GET', url: `/api/contents/${contentId}/publications`, headers: authHeaders(token),
      });
      expect(list.json()).toHaveLength(0);
    });
  });

  describe('POST /api/publications/:id/mark-published', () => {
    it('marks publication as published and records platform URL', async () => {
      const pub = await createPub();
      const pubId = pub.json<{ id: string }>().id;
      const res = await app.inject({
        method: 'POST', url: `/api/publications/${pubId}/mark-published`, headers: authHeaders(token),
        payload: { platformUrl: 'https://www.douyin.com/video/12345' },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<{ status: string; platformUrl: string }>();
      expect(body.status).toBe('published');
      expect(body.platformUrl).toBe('https://www.douyin.com/video/12345');
    });

    it('stamps publishedAt on parent content', async () => {
      const pub = await createPub();
      const pubId = pub.json<{ id: string }>().id;
      await app.inject({
        method: 'POST', url: `/api/publications/${pubId}/mark-published`, headers: authHeaders(token),
        payload: { platformUrl: 'https://www.douyin.com/video/12345' },
      });
      const ws = await app.inject({ method: 'GET', url: '/api/workspaces', headers: authHeaders(token) });
      const wsId = ws.json<Array<{ id: string }>>()[0]!.id;
      const contents = await app.inject({
        method: 'GET', url: `/api/contents?workspace=${wsId}`, headers: authHeaders(token),
      });
      const content = contents.json<Array<{ publishedAt: string | null }>>()[0]!;
      expect(content.publishedAt).not.toBeNull();
    });
  });

  describe('PATCH /api/publications/batch', () => {
    it('batch-updates status for owned publications', async () => {
      const p1 = await createPub({ platform: 'douyin' });
      const p2 = await createPub({ platform: 'xiaohongshu' });
      const ids = [p1.json<{ id: string }>().id, p2.json<{ id: string }>().id];
      const res = await app.inject({
        method: 'PATCH', url: '/api/publications/batch', headers: authHeaders(token),
        payload: { ids, status: 'skipped' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json<{ updated: number }>().updated).toBe(2);
    });
  });

  describe('GET /api/publications/queue', () => {
    it('returns upcoming publications', async () => {
      await createPub({ scheduledAt: '2026-04-15T18:00:00Z' });
      const res = await app.inject({
        method: 'GET',
        url: '/api/publications/queue?from=2026-04-01&to=2026-04-30',
        headers: authHeaders(token),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveLength(1);
    });
  });
});
