import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetricService, calcEngagementRate } from '../../domain/metric/metric.service.js';
import { ForbiddenError } from '../../domain/errors.js';
import type { IMetricRepository, Metric } from '../../domain/metric/metric.service.js';

const makeMetric = (overrides: Partial<Metric> = {}): Metric =>
  ({
    id: 'metric-1',
    publicationId: 'pub-1',
    views: 1000,
    likes: 100,
    comments: 20,
    shares: 10,
    saves: 5,
    followersGained: 50,
    recordedAt: new Date(),
    createdAt: new Date(),
    ...overrides,
  }) as Metric;

const emptyRepoCounts = () => ({
  getContentStats: vi.fn().mockResolvedValue({ total: 0, totalPublished: 0 }),
  getPublishedCounts: vi.fn().mockResolvedValue([]),
  getWorkspaceTotals: vi.fn().mockResolvedValue({ totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0 }),
  getTopContents: vi.fn().mockResolvedValue([]),
  getWeeklyTrend: vi.fn().mockResolvedValue([]),
  getTagPerformance: vi.fn().mockResolvedValue([]),
});

describe('calcEngagementRate', () => {
  it('returns 0 when views is 0', () => {
    expect(calcEngagementRate(0, 100, 50, 25)).toBe(0);
  });

  it('calculates correctly with known values', () => {
    // (100 + 20 + 10) / 1000 * 100 = 13.00
    expect(calcEngagementRate(1000, 100, 20, 10)).toBe(13);
  });

  it('rounds to 2 decimal places', () => {
    // (1 + 0 + 0) / 3 * 100 = 33.33...
    expect(calcEngagementRate(3, 1, 0, 0)).toBe(33.33);
  });
});

describe('MetricService', () => {
  let repo: IMetricRepository;
  let svc: MetricService;

  beforeEach(() => {
    repo = {
      verifyPublicationOwnership: vi.fn(),
      getUserWorkspaceIds: vi.fn(),
      create: vi.fn(),
      ...emptyRepoCounts(),
      getContentPublications: vi.fn(),
      getWorkspaceStatsByIds: vi.fn(),
      getUpcomingPublications: vi.fn(),
      getRecentActivity: vi.fn(),
    } as unknown as IMetricRepository;
    svc = new MetricService(repo);
  });

  describe('record', () => {
    it('throws ForbiddenError when publication not owned', async () => {
      vi.mocked(repo.verifyPublicationOwnership).mockResolvedValue(false);
      await expect(svc.record('user-1', { publicationId: 'pub-1' })).rejects.toThrow(ForbiddenError);
    });

    it('creates metric with defaults when optional fields omitted', async () => {
      vi.mocked(repo.verifyPublicationOwnership).mockResolvedValue(true);
      vi.mocked(repo.create).mockResolvedValue(makeMetric());
      await svc.record('user-1', { publicationId: 'pub-1' });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ views: 0, likes: 0, comments: 0, shares: 0, saves: 0, followersGained: 0 }),
      );
    });

    it('forwards provided metric values', async () => {
      vi.mocked(repo.verifyPublicationOwnership).mockResolvedValue(true);
      vi.mocked(repo.create).mockResolvedValue(makeMetric());
      await svc.record('user-1', { publicationId: 'pub-1', views: 5000, likes: 300 });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ views: 5000, likes: 300 }),
      );
    });
  });

  describe('getDashboard', () => {
    it('returns empty dashboard when user has no workspaces', async () => {
      vi.mocked(repo.getUserWorkspaceIds).mockResolvedValue([]);
      const result = await svc.getDashboard('user-1');
      expect(result.totalContents).toBe(0);
      expect(result.engagementRate).toBe(0);
      expect(result.topContents).toEqual([]);
    });

    it('calculates engagement rate from repo totals', async () => {
      vi.mocked(repo.getUserWorkspaceIds).mockResolvedValue(['ws-1']);
      vi.mocked(repo.getContentStats).mockResolvedValue({ total: 10, totalPublished: 5 });
      vi.mocked(repo.getPublishedCounts).mockResolvedValue([]);
      vi.mocked(repo.getWorkspaceTotals).mockResolvedValue({
        totalViews: 1000,
        totalLikes: 100,
        totalComments: 20,
        totalShares: 10,
      });
      vi.mocked(repo.getTopContents).mockResolvedValue([]);
      vi.mocked(repo.getWeeklyTrend).mockResolvedValue([]);
      vi.mocked(repo.getTagPerformance).mockResolvedValue([]);

      const result = await svc.getDashboard('user-1');
      expect(result.totalContents).toBe(10);
      expect(result.totalPublished).toBe(5);
      expect(result.engagementRate).toBe(13); // (100+20+10)/1000 * 100
    });

    it('counts thisWeekPublished correctly', async () => {
      vi.mocked(repo.getUserWorkspaceIds).mockResolvedValue(['ws-1']);
      const now = new Date();
      const recentDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const oldDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      vi.mocked(repo.getPublishedCounts).mockResolvedValue([
        { publishedAt: recentDate },
        { publishedAt: oldDate },
        { publishedAt: null },
      ]);
      vi.mocked(repo.getWorkspaceTotals).mockResolvedValue({ totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0 });
      vi.mocked(repo.getTopContents).mockResolvedValue([]);
      vi.mocked(repo.getWeeklyTrend).mockResolvedValue([]);
      vi.mocked(repo.getTagPerformance).mockResolvedValue([]);

      const result = await svc.getDashboard('user-1');
      expect(result.thisWeekPublished).toBe(1);
    });
  });

  describe('getFullDashboard', () => {
    it('returns null when user has no workspaces', async () => {
      vi.mocked(repo.getUserWorkspaceIds).mockResolvedValue([]);
      const result = await svc.getFullDashboard('user-1');
      expect(result).toBeNull();
    });

    it('returns dashboard data when workspaces exist', async () => {
      vi.mocked(repo.getUserWorkspaceIds).mockResolvedValue(['ws-1']);
      vi.mocked(repo.getContentStats).mockResolvedValue({ total: 5, totalPublished: 3 });
      vi.mocked(repo.getPublishedCounts).mockResolvedValue([]);
      vi.mocked(repo.getWorkspaceTotals).mockResolvedValue({ totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0 });
      vi.mocked(repo.getTopContents).mockResolvedValue([]);
      vi.mocked(repo.getWeeklyTrend).mockResolvedValue([]);
      vi.mocked(repo.getTagPerformance).mockResolvedValue([]);
      vi.mocked(repo.getWorkspaceStatsByIds).mockResolvedValue(new Map());
      vi.mocked(repo.getUpcomingPublications).mockResolvedValue([]);
      vi.mocked(repo.getRecentActivity).mockResolvedValue([]);

      const result = await svc.getFullDashboard('user-1');
      expect(result).not.toBeNull();
      expect(result!.workspaceIds).toEqual(['ws-1']);
      expect(result!.contentStats.total).toBe(5);
    });
  });

  describe('getContentMetrics', () => {
    it('throws ForbiddenError when content not found', async () => {
      vi.mocked(repo.getContentPublications).mockResolvedValue({ content: null, publications: [] });
      await expect(svc.getContentMetrics('content-1', 'user-1')).rejects.toThrow(ForbiddenError);
    });

    it('aggregates totals across all publications and metrics', async () => {
      vi.mocked(repo.getContentPublications).mockResolvedValue({
        content: { id: 'content-1', title: 'Test', stage: 'published' },
        publications: [
          {
            publication: {} as any,
            metrics: [
              makeMetric({ views: 1000, likes: 50, comments: 10, shares: 5, saves: 3, followersGained: 20 }),
              makeMetric({ views: 500, likes: 25, comments: 5, shares: 2, saves: 1, followersGained: 10 }),
            ],
          },
        ],
      });

      const result = await svc.getContentMetrics('content-1', 'user-1');
      expect(result.totals.views).toBe(1500);
      expect(result.totals.likes).toBe(75);
      expect(result.totals.followersGained).toBe(30);
    });
  });
});
