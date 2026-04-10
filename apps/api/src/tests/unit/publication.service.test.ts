import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PublicationService } from '../../domain/publication/publication.service.js';
import { ForbiddenError, NotFoundError } from '../../domain/errors.js';
import type { IPublicationRepository, Publication } from '../../domain/publication/publication.service.js';

const makePub = (overrides: Partial<Publication> = {}): Publication =>
  ({
    id: 'pub-1',
    contentId: 'content-1',
    platform: 'douyin',
    platformTitle: null,
    platformCopy: null,
    platformTags: [],
    coverUrl: null,
    platformSettings: {},
    scheduledAt: null,
    publishedAt: null,
    status: 'draft',
    platformPostId: null,
    platformUrl: null,
    failureReason: null,
    publishLog: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Publication;

describe('PublicationService', () => {
  let repo: IPublicationRepository;
  let svc: PublicationService;

  beforeEach(() => {
    repo = {
      create: vi.fn(),
      findByContent: vi.fn(),
      findById: vi.fn(),
      findQueue: vi.fn(),
      verifyOwnership: vi.fn(),
      verifyBulkOwnership: vi.fn(),
      update: vi.fn(),
      batchUpdate: vi.fn(),
      delete: vi.fn(),
    } as unknown as IPublicationRepository;
    svc = new PublicationService(repo);
  });

  describe('create', () => {
    it('sets status to draft when no scheduledAt', async () => {
      vi.mocked(repo.create).mockResolvedValue(makePub());
      await svc.create('content-1', { platform: 'douyin' });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'draft' }),
      );
    });

    it('sets status to queued when scheduledAt and platform are set', async () => {
      vi.mocked(repo.create).mockResolvedValue(makePub({ status: 'queued' }));
      await svc.create('content-1', {
        platform: 'douyin',
        scheduledAt: new Date('2026-04-15T18:00:00Z'),
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'queued' }),
      );
    });
  });

  describe('verifyOwnership', () => {
    it('throws ForbiddenError when publication not owned', async () => {
      vi.mocked(repo.verifyOwnership).mockResolvedValue(null);
      await expect(svc.verifyOwnership('pub-1', 'user-1')).rejects.toThrow(ForbiddenError);
    });

    it('returns ownership record when found', async () => {
      const row = { publicationId: 'pub-1', contentId: 'content-1', workspaceId: 'ws-1' };
      vi.mocked(repo.verifyOwnership).mockResolvedValue(row);
      const result = await svc.verifyOwnership('pub-1', 'user-1');
      expect(result).toBe(row);
    });
  });

  describe('listByContent', () => {
    it('returns publications for the content', async () => {
      const pubs = [makePub()];
      vi.mocked(repo.findByContent).mockResolvedValue(pubs);
      const result = await svc.listByContent('content-1');
      expect(repo.findByContent).toHaveBeenCalledWith('content-1');
      expect(result).toBe(pubs);
    });
  });

  describe('batchUpdate', () => {
    it('throws ForbiddenError when some publications not owned', async () => {
      vi.mocked(repo.verifyBulkOwnership).mockResolvedValue(['pub-1']); // only 1 of 2
      await expect(svc.batchUpdate('user-1', ['pub-1', 'pub-2'], {})).rejects.toThrow(ForbiddenError);
    });

    it('returns count of updated publications', async () => {
      vi.mocked(repo.verifyBulkOwnership).mockResolvedValue(['pub-1', 'pub-2']);
      vi.mocked(repo.batchUpdate).mockResolvedValue(undefined);
      const result = await svc.batchUpdate('user-1', ['pub-1', 'pub-2'], {});
      expect(result).toBe(2);
    });
  });

  describe('markPublished', () => {
    it('throws ForbiddenError when not owned', async () => {
      vi.mocked(repo.verifyOwnership).mockResolvedValue(null);
      await expect(svc.markPublished('user-1', 'pub-1', {})).rejects.toThrow(ForbiddenError);
    });

    it('throws NotFoundError when publication missing after ownership check', async () => {
      vi.mocked(repo.verifyOwnership).mockResolvedValue({ publicationId: 'pub-1', contentId: 'content-1', workspaceId: 'ws-1' });
      vi.mocked(repo.findById).mockResolvedValue(null);
      await expect(svc.markPublished('user-1', 'pub-1', {})).rejects.toThrow(NotFoundError);
    });

    it('sets status to published and appends to publishLog', async () => {
      const pub = makePub({ publishLog: [] });
      vi.mocked(repo.verifyOwnership).mockResolvedValue({ publicationId: 'pub-1', contentId: 'content-1', workspaceId: 'ws-1' });
      vi.mocked(repo.findById).mockResolvedValue(pub);
      const updatedPub = makePub({ status: 'published' });
      vi.mocked(repo.update).mockResolvedValue(updatedPub);

      const result = await svc.markPublished('user-1', 'pub-1', { platformUrl: 'https://example.com' });

      expect(repo.update).toHaveBeenCalledWith('pub-1', expect.objectContaining({ status: 'published' }));
      const updateArg = vi.mocked(repo.update).mock.calls[0]![1];
      const log = updateArg.publishLog as Array<{ action: string }>;
      expect(log[log.length - 1]!.action).toBe('published');
      expect(result.contentId).toBe('content-1');
    });

    it('uses provided publishedAt date', async () => {
      const pub = makePub();
      vi.mocked(repo.verifyOwnership).mockResolvedValue({ publicationId: 'pub-1', contentId: 'content-1', workspaceId: 'ws-1' });
      vi.mocked(repo.findById).mockResolvedValue(pub);
      vi.mocked(repo.update).mockResolvedValue(makePub({ status: 'published' }));

      const customDate = new Date('2026-04-10T12:00:00Z');
      const result = await svc.markPublished('user-1', 'pub-1', { publishedAt: customDate });
      expect(result.publishedAt).toEqual(customDate);
    });
  });

  describe('delete', () => {
    it('verifies ownership then deletes', async () => {
      vi.mocked(repo.verifyOwnership).mockResolvedValue({ publicationId: 'pub-1', contentId: 'content-1', workspaceId: 'ws-1' });
      vi.mocked(repo.delete).mockResolvedValue(undefined);
      await svc.delete('user-1', 'pub-1');
      expect(repo.delete).toHaveBeenCalledWith('pub-1');
    });
  });
});
