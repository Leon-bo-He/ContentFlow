import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlanService } from '../../domain/plan/plan.service.js';
import { NotFoundError, ValidationError } from '../../domain/errors.js';
import type { IPlanRepository, ContentPlan, ContentReference, PlanTemplate } from '../../domain/plan/plan.service.js';

const makePlan = (): ContentPlan =>
  ({
    id: 'plan-1',
    contentId: 'content-1',
    formatConfig: {},
    audience: null,
    audienceTemplateId: null,
    goals: [],
    goalDescription: null,
    kpiTargets: {},
    hooks: null,
    titleCandidates: [],
    outline: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as ContentPlan;

const makeRef = (): ContentReference =>
  ({
    id: 'ref-1',
    contentId: 'content-1',
    authorName: 'Alice',
    contentTitle: 'A great post',
    platform: 'douyin',
    url: 'https://example.com',
    metricsSnapshot: {},
    takeaway: '',
    attachments: [],
    createdAt: new Date(),
  }) as ContentReference;

const makeTpl = (): PlanTemplate =>
  ({
    id: 'tpl-1',
    workspaceId: 'ws-1',
    name: 'My Template',
    audience: null,
    goals: [],
    goalDescription: null,
    createdAt: new Date(),
  }) as PlanTemplate;

describe('PlanService', () => {
  let repo: IPlanRepository;
  let svc: PlanService;

  beforeEach(() => {
    repo = {
      upsertPlan: vi.fn(),
      findPlan: vi.fn(),
      findReferences: vi.fn(),
      createReference: vi.fn(),
      deleteReference: vi.fn(),
      createTemplate: vi.fn(),
      findTemplates: vi.fn(),
      updateTemplate: vi.fn(),
      deleteTemplate: vi.fn(),
    } as unknown as IPlanRepository;
    svc = new PlanService(repo);
  });

  describe('upsertPlan', () => {
    it('delegates to repo', async () => {
      const plan = makePlan();
      vi.mocked(repo.upsertPlan).mockResolvedValue(plan);
      const result = await svc.upsertPlan('content-1', { goals: ['grow_followers'] });
      expect(repo.upsertPlan).toHaveBeenCalledWith('content-1', { goals: ['grow_followers'] });
      expect(result).toBe(plan);
    });
  });

  describe('deleteReference', () => {
    it('throws NotFoundError when reference does not exist', async () => {
      vi.mocked(repo.deleteReference).mockResolvedValue(false);
      await expect(svc.deleteReference('content-1', 'ref-1')).rejects.toThrow(NotFoundError);
    });

    it('succeeds when reference is deleted', async () => {
      vi.mocked(repo.deleteReference).mockResolvedValue(true);
      await expect(svc.deleteReference('content-1', 'ref-1')).resolves.toBeUndefined();
    });
  });

  describe('renameTemplate', () => {
    it('throws ValidationError when name is empty', async () => {
      await expect(svc.renameTemplate('ws-1', 'tpl-1', '')).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when name is only whitespace', async () => {
      await expect(svc.renameTemplate('ws-1', 'tpl-1', '   ')).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError when template not found', async () => {
      vi.mocked(repo.updateTemplate).mockResolvedValue(null);
      await expect(svc.renameTemplate('ws-1', 'tpl-1', 'New Name')).rejects.toThrow(NotFoundError);
    });

    it('trims and returns updated template', async () => {
      const tpl = makeTpl();
      vi.mocked(repo.updateTemplate).mockResolvedValue(tpl);
      const result = await svc.renameTemplate('ws-1', 'tpl-1', '  Trimmed  ');
      expect(repo.updateTemplate).toHaveBeenCalledWith('tpl-1', 'ws-1', 'Trimmed');
      expect(result).toBe(tpl);
    });
  });

  describe('deleteTemplate', () => {
    it('throws NotFoundError when template does not exist', async () => {
      vi.mocked(repo.deleteTemplate).mockResolvedValue(false);
      await expect(svc.deleteTemplate('ws-1', 'tpl-1')).rejects.toThrow(NotFoundError);
    });

    it('resolves when template is deleted', async () => {
      vi.mocked(repo.deleteTemplate).mockResolvedValue(true);
      await expect(svc.deleteTemplate('ws-1', 'tpl-1')).resolves.toBeUndefined();
    });
  });

  describe('addReference', () => {
    it('delegates to repo with correct args', async () => {
      const ref = makeRef();
      vi.mocked(repo.createReference).mockResolvedValue(ref);
      const result = await svc.addReference('content-1', {
        authorName: 'Alice', contentTitle: 'A great post', platform: 'douyin',
      });
      expect(repo.createReference).toHaveBeenCalledWith('content-1', {
        authorName: 'Alice', contentTitle: 'A great post', platform: 'douyin',
      });
      expect(result).toBe(ref);
    });
  });
});
