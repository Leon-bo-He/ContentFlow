import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp, registerAndLogin, authHeaders } from '../helpers/app.js';
import { truncateAll } from '../helpers/db.js';

describe('Export / Import routes', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => { app = await createTestApp(); });
  afterAll(async () => { await app.close(); });
  beforeEach(async () => {
    await truncateAll();
    ({ token } = await registerAndLogin(app));
  });

  async function buildDataSet() {
    const ws = await app.inject({
      method: 'POST', url: '/api/workspaces', headers: authHeaders(token),
      payload: { name: 'Export WS', icon: '📺', color: '#6366f1' },
    });
    const wsId = ws.json<{ id: string }>().id;

    const content = await app.inject({
      method: 'POST', url: '/api/contents', headers: authHeaders(token),
      payload: { workspaceId: wsId, title: 'Exportable Content', contentType: 'article', tags: ['tech'], targetPlatforms: [] },
    });
    const contentId = content.json<{ id: string }>().id;

    await app.inject({
      method: 'PUT', url: `/api/contents/${contentId}/plan`, headers: authHeaders(token),
      payload: { goals: ['grow_followers'] },
    });

    await app.inject({
      method: 'POST', url: `/api/contents/${contentId}/publications`, headers: authHeaders(token),
      payload: { platform: 'douyin', platformTags: [] },
    });

    await app.inject({
      method: 'POST', url: '/api/ideas', headers: authHeaders(token),
      payload: { title: 'An Idea', tags: [], priority: 'medium' },
    });

    return { wsId, contentId };
  }

  describe('GET /api/export', () => {
    it('returns a JSON archive with correct structure', async () => {
      await buildDataSet();
      const res = await app.inject({ method: 'GET', url: '/api/export', headers: authHeaders(token) });
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/json');
      expect(res.headers['content-disposition']).toContain('attachment');

      const body = res.json<{
        version: string;
        profile: { email: string };
        workspaces: Array<{ name: string; contents: unknown[] }>;
        ideas: unknown[];
      }>();
      expect(body.version).toBe('1.0');
      expect(body.profile).toBeTruthy();
      expect(body.workspaces).toHaveLength(1);
      expect(body.workspaces[0]!.name).toBe('Export WS');
      expect(body.workspaces[0]!.contents).toHaveLength(1);
      expect(body.ideas).toHaveLength(1);
    });

    it('returns empty workspaces and ideas for new user', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/export', headers: authHeaders(token) });
      const body = res.json<{ workspaces: unknown[]; ideas: unknown[] }>();
      expect(body.workspaces).toHaveLength(0);
      expect(body.ideas).toHaveLength(0);
    });
  });

  describe('POST /api/import', () => {
    it('imports a valid export file and returns counts', async () => {
      await buildDataSet();
      const exportRes = await app.inject({ method: 'GET', url: '/api/export', headers: authHeaders(token) });
      const exportData = exportRes.json();

      // Import into a fresh user account
      const { token: newToken } = await registerAndLogin(app);
      const importRes = await app.inject({
        method: 'POST', url: '/api/import', headers: authHeaders(newToken),
        payload: exportData,
      });
      expect(importRes.statusCode).toBe(200);
      const result = importRes.json<{ ok: boolean; imported: { workspaces: number; contents: number; ideas: number } }>();
      expect(result.ok).toBe(true);
      expect(result.imported.workspaces).toBe(1);
      expect(result.imported.contents).toBe(1);
      expect(result.imported.ideas).toBe(1);
    });

    it('creates correct data in the new account after import', async () => {
      await buildDataSet();
      const exportRes = await app.inject({ method: 'GET', url: '/api/export', headers: authHeaders(token) });

      const { token: newToken } = await registerAndLogin(app);
      await app.inject({
        method: 'POST', url: '/api/import', headers: authHeaders(newToken),
        payload: exportRes.json(),
      });

      const wsList = await app.inject({ method: 'GET', url: '/api/workspaces', headers: authHeaders(newToken) });
      expect(wsList.json()).toHaveLength(1);
      expect(wsList.json<Array<{ name: string }>>()[0]!.name).toBe('Export WS');

      const ideas = await app.inject({ method: 'GET', url: '/api/ideas', headers: authHeaders(newToken) });
      expect(ideas.json()).toHaveLength(1);
    });

    it('returns 400 for invalid import file', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/import', headers: authHeaders(token),
        payload: { version: '99.0', workspaces: [] },
      });
      expect(res.statusCode).toBe(400);
    });
  });
});
