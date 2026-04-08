import type { FastifyPluginAsync } from 'fastify';
import { eq, and, inArray, sum, count, gte, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { metrics } from '../db/schema/metrics.js';
import { publications } from '../db/schema/publications.js';
import { contents } from '../db/schema/contents.js';
import { workspaces } from '../db/schema/workspaces.js';
import { createMetricsSchema } from '@contentflow/shared';
import {
  calcEngagementRate,
  buildTopContents,
  buildWeeklyTrend,
  buildTagPerformance,
} from '../lib/analytics.js';

async function verifyPublicationOwnership(
  publicationId: string,
  userId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: publications.id })
    .from(publications)
    .innerJoin(contents, eq(publications.contentId, contents.id))
    .innerJoin(workspaces, eq(contents.workspaceId, workspaces.id))
    .where(and(eq(publications.id, publicationId), eq(workspaces.userId, userId)));
  return Boolean(row);
}

async function getUserWorkspaceIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.userId, userId));
  return rows.map((r) => r.id);
}

export const metricsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/metrics', { onRequest: [app.authenticate] }, async (req, reply) => {
    const user = req.user as { sub: string };
    const body = createMetricsSchema.parse(req.body);

    const owned = await verifyPublicationOwnership(body.publicationId, user.sub);
    if (!owned) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const [row] = await db
      .insert(metrics)
      .values({
        publicationId: body.publicationId,
        views: body.views ?? 0,
        likes: body.likes ?? 0,
        comments: body.comments ?? 0,
        shares: body.shares ?? 0,
        saves: body.saves ?? 0,
        followersGained: body.followersGained ?? 0,
        recordedAt: body.recordedAt ?? new Date(),
      })
      .returning();

    return reply.code(201).send(row);
  });

  app.get('/api/metrics/dashboard', { onRequest: [app.authenticate] }, async (req, reply) => {
    const user = req.user as { sub: string };
    const query = req.query as { workspace?: string };

    let workspaceIds: string[];
    if (query.workspace) {
      const [ws] = await db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(and(eq(workspaces.id, query.workspace), eq(workspaces.userId, user.sub)));
      if (!ws) return reply.code(403).send({ error: 'Forbidden' });
      workspaceIds = [query.workspace];
    } else {
      workspaceIds = await getUserWorkspaceIds(user.sub);
    }

    if (workspaceIds.length === 0) {
      return reply.send(buildEmptyDashboard());
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const contentStats = await db
      .select({
        total: count(contents.id),
        totalPublished: sql<number>`count(case when ${contents.stage} = 'published' then 1 end)`,
      })
      .from(contents)
      .where(inArray(contents.workspaceId, workspaceIds));

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

    const [topContents, weeklyTrend, tagPerformance] = await Promise.all([
      buildTopContents(workspaceIds),
      buildWeeklyTrend(workspaceIds, now),
      buildTagPerformance(workspaceIds),
    ]);

    return reply.send({
      totalContents: Number(contentStats[0]?.total ?? 0),
      totalPublished: Number(contentStats[0]?.totalPublished ?? 0),
      thisWeekPublished,
      thisMonthPublished,
      totalViews,
      totalLikes,
      totalComments,
      engagementRate: calcEngagementRate(totalViews, totalLikes, totalComments, totalShares),
      topContents,
      weeklyTrend,
      tagPerformance,
    });
  });

  app.get('/api/metrics/content/:id', { onRequest: [app.authenticate] }, async (req, reply) => {
    const user = req.user as { sub: string };
    const { id: contentId } = req.params as { id: string };

    const [contentRow] = await db
      .select({ id: contents.id, title: contents.title, stage: contents.stage })
      .from(contents)
      .innerJoin(workspaces, eq(contents.workspaceId, workspaces.id))
      .where(and(eq(contents.id, contentId), eq(workspaces.userId, user.sub)));

    if (!contentRow) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const pubRows = await db
      .select()
      .from(publications)
      .where(eq(publications.contentId, contentId))
      .orderBy(publications.createdAt);

    const result = await Promise.all(
      pubRows.map(async (pub) => {
        const metricRows = await db
          .select()
          .from(metrics)
          .where(eq(metrics.publicationId, pub.id))
          .orderBy(metrics.recordedAt);
        const latest = metricRows.length > 0 ? metricRows[metricRows.length - 1]! : null;
        return { publication: pub, metrics: metricRows, latest };
      }),
    );

    const allMetrics = result.flatMap((r) => r.metrics);
    const totals = {
      views: allMetrics.reduce((s, m) => s + m.views, 0),
      likes: allMetrics.reduce((s, m) => s + m.likes, 0),
      comments: allMetrics.reduce((s, m) => s + m.comments, 0),
      shares: allMetrics.reduce((s, m) => s + m.shares, 0),
      saves: allMetrics.reduce((s, m) => s + m.saves, 0),
      followersGained: allMetrics.reduce((s, m) => s + m.followersGained, 0),
    };

    return reply.send({
      content: { id: contentRow.id, title: contentRow.title, stage: contentRow.stage },
      publications: result,
      totals,
    });
  });
};

function buildEmptyDashboard() {
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
  };
}
