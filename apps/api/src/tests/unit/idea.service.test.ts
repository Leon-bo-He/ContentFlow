import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IdeaService } from '../../domain/idea/idea.service.js';
import { NotFoundError } from '../../domain/errors.js';
import type { IIdeaRepository, IContentCreatorRepository, Idea, Content } from '../../domain/idea/idea.service.js';

const makeIdea = (overrides: Partial<Idea> = {}): Idea =>
  ({
    id: 'idea-1',
    userId: 'user-1',
    workspaceId: null,
    title: 'Great idea',
    note: null,
    tags: [],
    priority: 'medium',
    attachments: [],
    status: 'active',
    convertedTo: null,
    createdAt: new Date(),
    ...overrides,
  }) as Idea;

const makeContent = (overrides: Partial<Content> = {}): Content =>
  ({
    id: 'content-1',
    workspaceId: 'ws-1',
    ideaId: 'idea-1',
    title: 'Great idea',
    contentType: 'article',
    stage: 'planned',
    description: null,
    tags: [],
    targetPlatforms: [],
    scheduledAt: null,
    publishedAt: null,
    notes: null,
    reviewNotes: null,
    attachments: [],
    stageHistory: [],
    locale: null,
    localeVariants: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Content;

describe('IdeaService', () => {
  let repo: IIdeaRepository;
  let contentRepo: IContentCreatorRepository;
  let svc: IdeaService;

  beforeEach(() => {
    repo = {
      create: vi.fn(),
      findAll: vi.fn(),
      findArchived: vi.fn(),
      deleteArchived: vi.fn(),
      findByIdAndUser: vi.fn(),
      update: vi.fn(),
      syncStatusByContentId: vi.fn(),
    } as unknown as IIdeaRepository;

    contentRepo = {
      createFromIdea: vi.fn(),
    } as unknown as IContentCreatorRepository;

    svc = new IdeaService(repo, contentRepo);
  });

  describe('create', () => {
    it('injects userId into repo call', async () => {
      const idea = makeIdea();
      vi.mocked(repo.create).mockResolvedValue(idea);
      await svc.create('user-1', { title: 'Test', tags: [], priority: 'medium', attachments: [] });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', title: 'Test' }),
      );
    });
  });

  describe('update', () => {
    it('returns updated idea', async () => {
      const idea = makeIdea({ title: 'Updated' });
      vi.mocked(repo.update).mockResolvedValue(idea);
      const result = await svc.update('user-1', 'idea-1', { title: 'Updated' });
      expect(result).toBe(idea);
    });

    it('throws NotFoundError when repo returns null', async () => {
      vi.mocked(repo.update).mockResolvedValue(null);
      await expect(svc.update('user-1', 'idea-1', { title: 'X' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('convert', () => {
    it('throws NotFoundError when idea not found', async () => {
      vi.mocked(repo.findByIdAndUser).mockResolvedValue(null);
      await expect(svc.convert('user-1', 'idea-1', 'ws-1')).rejects.toThrow(NotFoundError);
    });

    it('creates content from idea and marks idea as converted', async () => {
      const idea = makeIdea({ tags: ['tag1'] });
      const content = makeContent();
      vi.mocked(repo.findByIdAndUser).mockResolvedValue(idea);
      vi.mocked(contentRepo.createFromIdea).mockResolvedValue(content);
      vi.mocked(repo.update).mockResolvedValue({ ...idea, status: 'converted', convertedTo: content.id });

      const result = await svc.convert('user-1', 'idea-1', 'ws-1');

      expect(contentRepo.createFromIdea).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws-1',
          ideaId: 'idea-1',
          title: idea.title,
          contentType: 'article',
          tags: ['tag1'],
        }),
      );
      expect(repo.update).toHaveBeenCalledWith('idea-1', 'user-1', {
        status: 'converted',
        convertedTo: content.id,
      });
      expect(result.content).toBe(content);
    });

    it('uses custom title and contentType when provided', async () => {
      const idea = makeIdea();
      vi.mocked(repo.findByIdAndUser).mockResolvedValue(idea);
      vi.mocked(contentRepo.createFromIdea).mockResolvedValue(makeContent());
      vi.mocked(repo.update).mockResolvedValue(makeIdea());

      await svc.convert('user-1', 'idea-1', 'ws-1', 'Custom Title', 'video_short');

      expect(contentRepo.createFromIdea).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Custom Title', contentType: 'video_short' }),
      );
    });

    it('stageHistory includes idea creation timestamp then planned', async () => {
      const idea = makeIdea();
      vi.mocked(repo.findByIdAndUser).mockResolvedValue(idea);
      vi.mocked(contentRepo.createFromIdea).mockResolvedValue(makeContent());
      vi.mocked(repo.update).mockResolvedValue(makeIdea());

      await svc.convert('user-1', 'idea-1', 'ws-1');

      const call = vi.mocked(contentRepo.createFromIdea).mock.calls[0]![0];
      expect(call.stageHistory).toHaveLength(2);
      expect(call.stageHistory[0]!.stage).toBe('idea');
      expect(call.stageHistory[1]!.stage).toBe('planned');
    });
  });
});
