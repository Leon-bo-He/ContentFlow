import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp, registerAndLogin, authHeaders } from '../helpers/app.js';
import { truncateAll } from '../helpers/db.js';

describe('Metrics routes', () => {
  let app: FastifyInstance;
  let token: string;
  let pubId: string;
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
      payload: { workspaceId: wsId, title: 'Content', contentType: 'article', tags: [], targetPlatforms: [] },
    });
    contentId = content.json<{ id: string }>().id;
    const pub = await app.inject({
      method: 'POST', url: `/api/contents/${contentId}/publications`, headers: authHeaders(token),
      payload: { platform: 'douyin', platformTags: [] },
    });
    pubId = pub.json<{ id: string }>().id;
  });

  describe('POST /api/metrics', () => {
    it('records metrics and returns 201', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/metrics', headers: authHeaders(token),
        payload: { publicationId: pubId, views: 5000, likes: 300, comments: 50, shares: 20, saves: 100 },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json<{ views: number; likes: number }>();
      expect(body.views).toBe(5000);
      expect(body.likes).toBe(300);
    });

    it('defaults missing numeric fields to 0', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/metrics', headers: authHeaders(token),
        payload: { publicationId: pubId, views: 1000 },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json<{ likes: number; comments: number }>();
      expect(body.likes).toBe(0);
      expect(body.comments).toBe(0);
    });

    it('returns 403 for another user\'s publication', async () => {
      const { token: otherToken } = await registerAndLogin(app);
      const res = await app.inject({
        method: 'POST', url: '/api/metrics', headers: authHeaders(otherToken),
        payload: { publicationId: pubId, views: 100 },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/metrics/dashboard', () => {
    it('returns zero-filled dashboard when no metrics recorded', async () => {
      const res = await app.inject({
        method: 'GET', url: '/api/metrics/dashboard', headers: authHeaders(token),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<{ totalViews: number; engagementRate: number }>();
      expect(body.totalViews).toBe(0);
      expect(body.engagementRate).toBe(0);
    });

    it('includes recorded metrics in totals', async () => {
      await app.inject({
        method: 'POST', url: '/api/metrics', headers: authHeaders(token),
        payload: { publicationId: pubId, views: 2000, likes: 100, comments: 30, shares: 10 },
      });
      const res = await app.inject({
        method: 'GET', url: '/api/metrics/dashboard', headers: authHeaders(token),
      });
      const body = res.json<{ totalViews: number }>();
      expect(body.totalViews).toBe(2000);
    });
  });

  describe('GET /api/metrics/content/:id', () => {
    it('returns content metrics summary', async () => {
      await app.inject({
        method: 'POST', url: '/api/metrics', headers: authHeaders(token),
        payload: { publicationId: pubId, views: 1000, likes: 50 },
      });
      const res = await app.inject({
        method: 'GET', url: `/api/metrics/content/${contentId}`, headers: authHeaders(token),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<{ totals: { views: number; likes: number } }>();
      expect(body.totals.views).toBe(1000);
      expect(body.totals.likes).toBe(50);
    });

    it('returns 403 for another user\'s content', async () => {
      const { token: otherToken } = await registerAndLogin(app);
      const res = await app.inject({
        method: 'GET', url: `/api/metrics/content/${contentId}`, headers: authHeaders(otherToken),
      });
      expect(res.statusCode).toBe(403);
    });
  });
});
