import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkspaceService } from '../../domain/workspace/workspace.service.js';
import { ForbiddenError, NotFoundError } from '../../domain/errors.js';
import type { IWorkspaceRepository, Workspace } from '../../domain/workspace/workspace.service.js';

const makeWs = (overrides: Partial<Workspace> = {}): Workspace =>
  ({
    id: 'ws-1',
    userId: 'user-1',
    name: 'My Workspace',
    icon: '📺',
    color: '#6366f1',
    about: null,
    publishGoal: null,
    stageConfig: [],
    createdAt: new Date(),
    ...overrides,
  }) as Workspace;

describe('WorkspaceService', () => {
  let repo: IWorkspaceRepository;
  let svc: WorkspaceService;

  beforeEach(() => {
    repo = {
      create: vi.fn(),
      findAllByUser: vi.fn(),
      findByIdAndUser: vi.fn(),
      update: vi.fn(),
    } as unknown as IWorkspaceRepository;
    svc = new WorkspaceService(repo);
  });

  describe('create', () => {
    it('delegates to repo and returns result', async () => {
      const ws = makeWs();
      vi.mocked(repo.create).mockResolvedValue(ws);
      const result = await svc.create('user-1', { name: 'My Workspace', icon: '📺', color: '#6366f1' });
      expect(repo.create).toHaveBeenCalledWith('user-1', { name: 'My Workspace', icon: '📺', color: '#6366f1' });
      expect(result).toBe(ws);
    });
  });

  describe('list', () => {
    it('returns all workspaces for user', async () => {
      const workspaces = [makeWs(), makeWs({ id: 'ws-2' })];
      vi.mocked(repo.findAllByUser).mockResolvedValue(workspaces);
      const result = await svc.list('user-1');
      expect(repo.findAllByUser).toHaveBeenCalledWith('user-1');
      expect(result).toHaveLength(2);
    });
  });

  describe('verifyOwnership', () => {
    it('returns workspace when user owns it', async () => {
      const ws = makeWs();
      vi.mocked(repo.findByIdAndUser).mockResolvedValue(ws);
      const result = await svc.verifyOwnership('ws-1', 'user-1');
      expect(result).toBe(ws);
    });

    it('throws ForbiddenError when workspace not found for user', async () => {
      vi.mocked(repo.findByIdAndUser).mockResolvedValue(null);
      await expect(svc.verifyOwnership('ws-1', 'other')).rejects.toThrow(ForbiddenError);
    });
  });

  describe('update', () => {
    it('returns updated workspace', async () => {
      const ws = makeWs({ name: 'Updated' });
      vi.mocked(repo.update).mockResolvedValue(ws);
      const result = await svc.update('user-1', 'ws-1', { name: 'Updated' });
      expect(result).toBe(ws);
      expect(repo.update).toHaveBeenCalledWith('ws-1', 'user-1', { name: 'Updated' });
    });

    it('throws NotFoundError when repo returns null', async () => {
      vi.mocked(repo.update).mockResolvedValue(null);
      await expect(svc.update('user-1', 'ws-1', { name: 'X' })).rejects.toThrow(NotFoundError);
    });
  });
});
