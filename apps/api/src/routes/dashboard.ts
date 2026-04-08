import type { FastifyPluginAsync } from 'fastify';
import { eq, inArray, sum, count, sql, and, gte, desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { metrics } from '../db/schema/metrics.js';
import { publications } from '../db/schema/publications.js';
import { contents } from '../db/schema/contents.js';
import { workspaces } from '../db/schema/workspaces.js';
import {
  calcEngagementRate,
  buildTopContents,
  buildWeeklyTrend,
  buildTagPerformance,
} from '../lib/analytics.js';

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/dashboard', { onRequest: [app.authenticate] }, async (req, reply) => {
    const user = req.user as { sub: string };

    const userWorkspaces = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.userId, user.sub))
      .orderBy(workspaces.createdAt);

    const workspaceIds = userWorkspaces.map((w) => w.id);

    if (workspaceIds.length === 0) {
      return reply.send(buildEmptyDashboard([]));
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Content stats per workspace
    const contentStatsByWs = await db
      .select({
        workspaceId: contents.workspaceId,
        total: count(contents.id),
        publishedCount: sql<number>`count(case when ${contents.stage} = 'published' then 1 end)`,
        pendingCount: sql<number>`count(case when ${contents.stage} not in ('published', 'reviewed') then 1 end)`,
      })
      .from(contents)
      .where(inArray(contents.workspaceId, workspaceIds))
      .groupBy(contents.workspaceId);

    const wsStatsMap = new Map(
      contentStatsByWs.map((r) => [
        r.workspaceId,
        {
          contentsCount: Number(r.total),
          publishedCount: Number(r.publishedCount),
          pendingCount: Number(r.pendingCount),
        },
      ]),
    );

    const workspacesData = userWorkspaces.map((w) => ({
      id: w.id,
      name: w.name,
      color: w.color,
      icon: w.icon,
      contentsCount: wsStatsMap.get(w.id)?.contentsCount ?? 0,
      publishedCount: wsStatsMap.get(w.id)?.publishedCount ?? 0,
      pendingCount: wsStatsMap.get(w.id)?.pendingCount ?? 0,
    }));

    // Global content totals
    const globalContentStats = await db
      .select({
        total: count(contents.id),
        totalPublished: sql<number>`count(case when ${contents.stage} = 'published' then 1 end)`,
      })
      .from(contents)
      .where(inArray(contents.workspaceId, workspaceIds));

    // Published publications for week/month counts
    const publishedPubs = await db
      .select({ publishedAt: publications.publishedAt })
      .from(publications)
      .innerJoin(contents, eq(publications.contentId, contents.id))
      .where(
        and(inArray(contents.workspaceId, workspaceIds), eq(publications.status, 'published')),
      );

    const thisWeekPublished = publishedPubs.filter(
      (p) => p.publishedAt && p.publishedAt >= sevenDaysAgo,
    ).length;
    const thisMonthPublished = publishedPubs.filter(
      (p) => p.publishedAt && p.publishedAt >= thirtyDaysAgo,
    ).length;

    // Metrics totals
    const metricTotals = await db
      .select({
        totalViews: sum(metrics.views),
        totalLikes: sum(metrics.likes),
        totalComments: sum(metrics.comments),
        totalShares: sum(metrics.shares),
      })
      .from(metrics)
      .innerJoin(publications, eq(metrics.publicationId, publications.id))
      .innerJoin(contents, eq(publications.contentId, contents.id))
      .where(inArray(contents.workspaceId, workspaceIds));

    const totalViews = Number(metricTotals[0]?.totalViews ?? 0);
    const totalLikes = Number(metricTotals[0]?.totalLikes ?? 0);
    const totalComments = Number(metricTotals[0]?.totalComments ?? 0);
    const totalShares = Number(metricTotals[0]?.totalShares ?? 0);

    // Upcoming publications (next 5 scheduled)
    const upcomingRaw = await db
      .select({
        publication: publications,
        contentId: contents.id,
        contentTitle: contents.title,
        workspaceId: workspaces.id,
        workspaceName: workspaces.name,
        workspaceColor: workspaces.color,
        workspaceIcon: workspaces.icon,
      })
      .from(publications)
      .innerJoin(contents, eq(publications.contentId, contents.id))
      .innerJoin(workspaces, eq(contents.workspaceId, workspaces.id))
      .where(
        and(
          inArray(contents.workspaceId, workspaceIds),
          inArray(publications.status, ['queued', 'ready', 'draft']),
          gte(publications.scheduledAt, now),
        ),
      )
      .orderBy(publications.scheduledAt)
      .limit(5);

    const upcomingPublications = upcomingRaw.map((r) => ({
      publication: r.publication,
      content: { id: r.contentId, title: r.contentTitle },
      workspace: {
        id: r.workspaceId,
        name: r.workspaceName,
        color: r.workspaceColor,
        icon: r.workspaceIcon,
      },
    }));

    // Recent activity (last 10 published)
    const recentRaw = await db
      .select({
        publication: publications,
        contentId: contents.id,
        contentTitle: contents.title,
        workspaceId: workspaces.id,
        workspaceName: workspaces.name,
        workspaceColor: workspaces.color,
        workspaceIcon: workspaces.icon,
      })
      .from(publications)
      .innerJoin(contents, eq(publications.contentId, contents.id))
      .innerJoin(workspaces, eq(contents.workspaceId, workspaces.id))
      .where(
        and(inArray(contents.workspaceId, workspaceIds), eq(publications.status, 'published')),
      )
      .orderBy(desc(publications.publishedAt))
      .limit(10);

    const recentActivity = recentRaw.map((r) => ({
      publication: r.publication,
      content: { id: r.contentId, title: r.contentTitle },
      workspace: {
        id: r.workspaceId,
        name: r.workspaceName,
        color: r.workspaceColor,
        icon: r.workspaceIcon,
      },
    }));

    const [topContents, weeklyTrend, tagPerformance] = await Promise.all([
      buildTopContents(workspaceIds),
      buildWeeklyTrend(workspaceIds, now),
      buildTagPerformance(workspaceIds),
    ]);

    return reply.send({
      totalContents: Number(globalContentStats[0]?.total ?? 0),
      totalPublished: Number(globalContentStats[0]?.totalPublished ?? 0),
      thisWeekPublished,
      thisMonthPublished,
      totalViews,
      totalLikes,
      totalComments,
      engagementRate: calcEngagementRate(totalViews, totalLikes, totalComments, totalShares),
      topContents,
      weeklyTrend,
      tagPerformance,
      workspaces: workspacesData,
      upcomingPublications,
      recentActivity,
    });
  });
};

function buildEmptyDashboard(wsList: typeof workspaces.$inferSelect[]) {
  return {
    totalContents: 0,
    totalPublished: 0,
    thisWeekPublished: 0,
    thisMonthPublished: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    engagementRate: 0,
    topContents: [],
    weeklyTrend: [],
    tagPerformance: [],
    workspaces: wsList.map((w) => ({
      id: w.id,
      name: w.name,
      color: w.color,
      icon: w.icon,
      contentsCount: 0,
      publishedCount: 0,
      pendingCount: 0,
    })),
    upcomingPublications: [],
    recentActivity: [],
  };
}
