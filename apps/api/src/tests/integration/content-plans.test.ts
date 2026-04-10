import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp, registerAndLogin, authHeaders } from '../helpers/app.js';
import { truncateAll } from '../helpers/db.js';

describe('Content Plan routes', () => {
  let app: FastifyInstance;
  let token: string;
  let contentId: string;
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
    const content = await app.inject({
      method: 'POST', url: '/api/contents', headers: authHeaders(token),
      payload: { workspaceId: wsId, title: 'Test', contentType: 'article', tags: [], targetPlatforms: [] },
    });
    contentId = content.json<{ id: string }>().id;
  });

  describe('PUT /api/contents/:id/plan', () => {
    it('creates brief and returns it', async () => {
      const res = await app.inject({
        method: 'PUT', url: `/api/contents/${contentId}/plan`, headers: authHeaders(token),
        payload: { goals: ['grow_followers'], goalDescription: 'Reach 10K' },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<{ goals: string[]; goalDescription: string }>();
      expect(body.goals).toContain('grow_followers');
      expect(body.goalDescription).toBe('Reach 10K');
    });

    it('updates brief on second call (upsert)', async () => {
      await app.inject({
        method: 'PUT', url: `/api/contents/${contentId}/plan`, headers: authHeaders(token),
        payload: { goals: ['grow_followers'] },
      });
      const res = await app.inject({
        method: 'PUT', url: `/api/contents/${contentId}/plan`, headers: authHeaders(token),
        payload: { goals: ['convert', 'branding'] },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json<{ goals: string[] }>().goals).toContain('convert');
    });

    it('returns 403 for another user\'s content', async () => {
      const { token: otherToken } = await registerAndLogin(app);
      const res = await app.inject({
        method: 'PUT', url: `/api/contents/${contentId}/plan`, headers: authHeaders(otherToken),
        payload: { goals: [] },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/contents/:id/plan', () => {
    it('returns null when no plan exists', async () => {
      const res = await app.inject({
        method: 'GET', url: `/api/contents/${contentId}/plan`, headers: authHeaders(token),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toBeNull();
    });

    it('returns plan after creation', async () => {
      await app.inject({
        method: 'PUT', url: `/api/contents/${contentId}/plan`, headers: authHeaders(token),
        payload: { titleCandidates: [{ text: 'Title 1', isPrimary: true }] },
      });
      const res = await app.inject({
        method: 'GET', url: `/api/contents/${contentId}/plan`, headers: authHeaders(token),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).not.toBeNull();
    });
  });

  describe('References', () => {
    it('POST creates reference and GET lists it', async () => {
      const createRes = await app.inject({
        method: 'POST', url: `/api/contents/${contentId}/references`, headers: authHeaders(token),
        payload: { authorName: 'Alice', contentTitle: 'Great Post', platform: 'douyin' },
      });
      expect(createRes.statusCode).toBe(201);
      const ref = createRes.json<{ id: string; authorName: string }>();
      expect(ref.authorName).toBe('Alice');

      const listRes = await app.inject({
        method: 'GET', url: `/api/contents/${contentId}/references`, headers: authHeaders(token),
      });
      expect(listRes.json()).toHaveLength(1);
    });

    it('DELETE removes reference', async () => {
      const createRes = await app.inject({
        method: 'POST', url: `/api/contents/${contentId}/references`, headers: authHeaders(token),
        payload: { authorName: 'Bob', contentTitle: 'Post', platform: 'xiaohongshu' },
      });
      const refId = createRes.json<{ id: string }>().id;

      const del = await app.inject({
        method: 'DELETE', url: `/api/contents/${contentId}/references/${refId}`, headers: authHeaders(token),
      });
      expect(del.statusCode).toBe(204);

      const list = await app.inject({
        method: 'GET', url: `/api/contents/${contentId}/references`, headers: authHeaders(token),
      });
      expect(list.json()).toHaveLength(0);
    });
  });

  describe('Plan templates', () => {
    it('creates, lists, renames, and deletes a template', async () => {
      // Create
      const created = await app.inject({
        method: 'POST', url: `/api/workspaces/${wsId}/plan-templates`, headers: authHeaders(token),
        payload: { name: 'Tech Tutorial Audience', goals: ['grow_followers'] },
      });
      expect(created.statusCode).toBe(201);
      const tplId = created.json<{ id: string }>().id;

      // List
      const listed = await app.inject({
        method: 'GET', url: `/api/workspaces/${wsId}/plan-templates`, headers: authHeaders(token),
      });
      expect(listed.json()).toHaveLength(1);

      // Rename
      const renamed = await app.inject({
        method: 'PATCH', url: `/api/workspaces/${wsId}/plan-templates/${tplId}`, headers: authHeaders(token),
        payload: { name: 'Updated Template' },
      });
      expect(renamed.statusCode).toBe(200);
      expect(renamed.json<{ name: string }>().name).toBe('Updated Template');

      // Delete
      const deleted = await app.inject({
        method: 'DELETE', url: `/api/workspaces/${wsId}/plan-templates/${tplId}`, headers: authHeaders(token),
      });
      expect(deleted.statusCode).toBe(204);

      const finalList = await app.inject({
        method: 'GET', url: `/api/workspaces/${wsId}/plan-templates`, headers: authHeaders(token),
      });
      expect(finalList.json()).toHaveLength(0);
    });

    it('returns 400 when renaming with empty name', async () => {
      const created = await app.inject({
        method: 'POST', url: `/api/workspaces/${wsId}/plan-templates`, headers: authHeaders(token),
        payload: { name: 'My Template' },
      });
      const tplId = created.json<{ id: string }>().id;
      const res = await app.inject({
        method: 'PATCH', url: `/api/workspaces/${wsId}/plan-templates/${tplId}`, headers: authHeaders(token),
        payload: { name: '   ' },
      });
      expect(res.statusCode).toBe(400);
    });
  });
});
