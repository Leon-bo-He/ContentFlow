import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentService } from '../../domain/content/content.service.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../domain/errors.js';
import type { IContentRepository, Content } from '../../domain/content/content.service.js';

const makeContent = (overrides: Partial<Content> = {}): Content =>
  ({
    id: 'content-1',
    workspaceId: 'ws-1',
    ideaId: null,
    title: 'Test Content',
    description: null,
    contentType: 'article',
    stage: 'planned',
    tags: [],
    targetPlatforms: [],
    scheduledAt: null,
    publishedAt: null,
    notes: null,
    reviewNotes: null,
    attachments: [],
    stageHistory: [{ stage: 'planned', timestamp: '2026-01-01T00:00:00.000Z' }],
    locale: null,
    localeVariants: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Content;

describe('ContentService', () => {
  let repo: IContentRepository;
  let svc: ContentService;

  beforeEach(() => {
    repo = {
      create: vi.fn(),
      findByWorkspace: vi.fn(),
      findCalendar: vi.fn(),
      findAllByWorkspaces: vi.fn(),
      findById: vi.fn(),
      findByIdWithWorkspaceUser: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteArchived: vi.fn(),
      stampPublishedAt: vi.fn(),
    } as unknown as IContentRepository;
    svc = new ContentService(repo);
  });

  describe('create', () => {
    it('adds stageHistory with planned entry', async () => {
      const content = makeContent();
      vi.mocked(repo.create).mockResolvedValue(content);
      await svc.create({ workspaceId: 'ws-1', title: 'T', contentType: 'article', tags: [], targetPlatforms: [] });
      const call = vi.mocked(repo.create).mock.calls[0]![0];
      expect(call.stageHistory).toHaveLength(1);
      expect(call.stageHistory[0]!.stage).toBe('planned');
    });
  });

  describe('list', () => {
    it('passes no stage filter when stage is undefined', async () => {
      vi.mocked(repo.findByWorkspace).mockResolvedValue([]);
      await svc.list('ws-1', {});
      expect(repo.findByWorkspace).toHaveBeenCalledWith('ws-1', {});
    });

    it('passes single stage as string', async () => {
      vi.mocked(repo.findByWorkspace).mockResolvedValue([]);
      await svc.list('ws-1', { stage: 'planned' });
      expect(repo.findByWorkspace).toHaveBeenCalledWith('ws-1', { stage: 'planned' });
    });

    it('passes comma-separated stages as array', async () => {
      vi.mocked(repo.findByWorkspace).mockResolvedValue([]);
      await svc.list('ws-1', { stage: 'planned,creating' });
      expect(repo.findByWorkspace).toHaveBeenCalledWith('ws-1', { stage: ['planned', 'creating'] });
    });
  });

  describe('getCalendar', () => {
    it('returns empty object when no workspaceId and no getter', async () => {
      const result = await svc.getCalendar('user-1', new Date(), new Date());
      expect(result).toEqual({});
      expect(repo.findCalendar).not.toHaveBeenCalled();
    });

    it('returns empty object when getter returns empty array', async () => {
      const result = await svc.getCalendar('user-1', new Date(), new Date(), undefined, async () => []);
      expect(result).toEqual({});
    });

    it('groups contents by scheduledAt date key', async () => {
      const d1 = new Date('2026-04-10T10:00:00Z');
      const d2 = new Date('2026-04-11T18:00:00Z');
      vi.mocked(repo.findCalendar).mockResolvedValue([
        makeContent({ id: 'c1', scheduledAt: d1 }),
        makeContent({ id: 'c2', scheduledAt: d1 }),
        makeContent({ id: 'c3', scheduledAt: d2 }),
      ]);
      const result = await svc.getCalendar('user-1', new Date(), new Date(), 'ws-1');
      expect(Object.keys(result)).toHaveLength(2);
      expect(result['2026-04-10']).toHaveLength(2);
      expect(result['2026-04-11']).toHaveLength(1);
    });

    it('skips contents without scheduledAt', async () => {
      vi.mocked(repo.findCalendar).mockResolvedValue([
        makeContent({ scheduledAt: null }),
      ]);
      const result = await svc.getCalendar('user-1', new Date(), new Date(), 'ws-1');
      expect(result).toEqual({});
    });
  });

  describe('delete', () => {
    it('throws NotFoundError when content does not exist', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);
      await expect(svc.delete('content-1', 'user-1')).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when user does not own the content', async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeContent());
      vi.mocked(repo.findByIdWithWorkspaceUser).mockResolvedValue(null);
      await expect(svc.delete('content-1', 'user-1')).rejects.toThrow(ForbiddenError);
    });

    it('calls repo.delete when ownership is verified', async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeContent());
      vi.mocked(repo.findByIdWithWorkspaceUser).mockResolvedValue({ id: 'content-1', workspaceId: 'ws-1' });
      vi.mocked(repo.delete).mockResolvedValue(undefined);
      await svc.delete('content-1', 'user-1');
      expect(repo.delete).toHaveBeenCalledWith('content-1');
    });
  });

  describe('update', () => {
    it('throws ForbiddenError when user does not own content', async () => {
      vi.mocked(repo.findByIdWithWorkspaceUser).mockResolvedValue(null);
      await expect(svc.update('content-1', 'user-1', { title: 'New' })).rejects.toThrow(ForbiddenError);
    });

    it('appends to stageHistory when stage changes', async () => {
      vi.mocked(repo.findByIdWithWorkspaceUser).mockResolvedValue({ id: 'content-1', workspaceId: 'ws-1' });
      vi.mocked(repo.findById).mockResolvedValue(makeContent());
      const updated = makeContent({ stage: 'creating' });
      vi.mocked(repo.update).mockResolvedValue(updated);

      await svc.update('content-1', 'user-1', { stage: 'creating' });

      const updateCall = vi.mocked(repo.update).mock.calls[0]![1];
      const history = updateCall.stageHistory as Array<{ stage: string; timestamp: string }>;
      expect(history).toHaveLength(2);
      expect(history[1]!.stage).toBe('creating');
    });

    it('records previousStage in return value', async () => {
      vi.mocked(repo.findByIdWithWorkspaceUser).mockResolvedValue({ id: 'content-1', workspaceId: 'ws-1' });
      vi.mocked(repo.findById).mockResolvedValue(makeContent({ stage: 'planned' }));
      vi.mocked(repo.update).mockResolvedValue(makeContent({ stage: 'creating' }));

      const { previousStage } = await svc.update('content-1', 'user-1', { stage: 'creating' });
      expect(previousStage).toBe('planned');
    });

    it('throws ValidationError when stageHistory entries are out of chronological order', async () => {
      vi.mocked(repo.findByIdWithWorkspaceUser).mockResolvedValue({ id: 'content-1', workspaceId: 'ws-1' });

      await expect(
        svc.update('content-1', 'user-1', {
          stageHistory: [
            { stage: 'creating', timestamp: '2026-04-10T12:00:00.000Z' },
            { stage: 'planned', timestamp: '2026-04-10T10:00:00.000Z' },
          ],
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError when repo.update returns null', async () => {
      vi.mocked(repo.findByIdWithWorkspaceUser).mockResolvedValue({ id: 'content-1', workspaceId: 'ws-1' });
      vi.mocked(repo.update).mockResolvedValue(null);
      await expect(svc.update('content-1', 'user-1', { title: 'X' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('verifyOwnership', () => {
    it('throws ForbiddenError when content not owned by user', async () => {
      vi.mocked(repo.findByIdWithWorkspaceUser).mockResolvedValue(null);
      await expect(svc.verifyOwnership('content-1', 'user-1')).rejects.toThrow(ForbiddenError);
    });

    it('returns ownership record when found', async () => {
      const row = { id: 'content-1', workspaceId: 'ws-1' };
      vi.mocked(repo.findByIdWithWorkspaceUser).mockResolvedValue(row);
      const result = await svc.verifyOwnership('content-1', 'user-1');
      expect(result).toBe(row);
    });
  });
});
