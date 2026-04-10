import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp, registerAndLogin, authHeaders } from '../helpers/app.js';
import { truncateAll } from '../helpers/db.js';

describe('Workspace routes', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => { app = await createTestApp(); });
  afterAll(async () => { await app.close(); });
  beforeEach(async () => {
    await truncateAll();
    ({ token } = await registerAndLogin(app));
  });

  const createWs = (payload?: object) =>
    app.inject({
      method: 'POST',
      url: '/api/workspaces',
      headers: authHeaders(token),
      payload: { name: 'My Channel', icon: '📺', color: '#6366f1', ...payload },
    });

  describe('POST /api/workspaces', () => {
    it('creates workspace and returns 201', async () => {
      const res = await createWs();
      expect(res.statusCode).toBe(201);
      const body = res.json<{ name: string; icon: string; color: string }>();
      expect(body.name).toBe('My Channel');
      expect(body.icon).toBe('📺');
      expect(body.color).toBe('#6366f1');
    });

    it('returns 401 without token', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/workspaces', payload: { name: 'X', icon: '🎬', color: '#000' } });
      expect(res.statusCode).toBe(401);
    });

    it('returns 400 for missing required fields', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/workspaces', headers: authHeaders(token), payload: {} });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/workspaces', () => {
    it('returns empty list initially', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/workspaces', headers: authHeaders(token) });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual([]);
    });

    it('returns created workspaces', async () => {
      await createWs({ name: 'WS 1' });
      await createWs({ name: 'WS 2' });
      const res = await app.inject({ method: 'GET', url: '/api/workspaces', headers: authHeaders(token) });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveLength(2);
    });

    it('does not return workspaces from other users', async () => {
      await createWs();
      const { token: otherToken } = await registerAndLogin(app);
      const res = await app.inject({ method: 'GET', url: '/api/workspaces', headers: authHeaders(otherToken) });
      expect(res.json()).toHaveLength(0);
    });
  });

  describe('PATCH /api/workspaces/:id', () => {
    it('updates workspace name', async () => {
      const created = await createWs();
      const wsId = created.json<{ id: string }>().id;
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/workspaces/${wsId}`,
        headers: authHeaders(token),
        payload: { name: 'Updated Channel' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json<{ name: string }>().name).toBe('Updated Channel');
    });

    it('returns 403 when updating another user\'s workspace', async () => {
      const created = await createWs();
      const wsId = created.json<{ id: string }>().id;
      const { token: otherToken } = await registerAndLogin(app);
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/workspaces/${wsId}`,
        headers: authHeaders(otherToken),
        payload: { name: 'Hijacked' },
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
