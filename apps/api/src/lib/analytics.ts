import { eq, and, inArray, sum, count, gte, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { metrics } from '../db/schema/metrics.js';
import { publications } from '../db/schema/publications.js';
import { contents } from '../db/schema/contents.js';

export function calcEngagementRate(
  totalViews: number,
  totalLikes: number,
  totalComments: number,
  totalShares: number,
): number {
  return totalViews > 0
    ? Math.round(((totalLikes + totalComments + totalShares) / totalViews) * 100 * 100) / 100
    : 0;
}

export async function buildTopContents(workspaceIds: string[]) {
  const rows = await db
    .select({
      contentId: contents.id,
      title: contents.title,
      platform: publications.platform,
      views: sum(metrics.views),
      likes: sum(metrics.likes),
      comments: sum(metrics.comments),
      publishedAt: publications.publishedAt,
    })
    .from(metrics)
    .innerJoin(publications, eq(metrics.publicationId, publications.id))
    .innerJoin(contents, eq(publications.contentId, contents.id))
    .where(inArray(contents.workspaceId, workspaceIds))
    .groupBy(contents.id, contents.title, publications.platform, publications.publishedAt)
    .orderBy(sql`sum(${metrics.views}) desc`)
    .limit(10);

  return rows.map((r) => ({
    contentId: r.contentId,
    title: r.title,
    platform: r.platform,
    views: Number(r.views ?? 0),
    likes: Number(r.likes ?? 0),
    comments: Number(r.comments ?? 0),
    publishedAt: r.publishedAt,
  }));
}

export async function buildWeeklyTrend(workspaceIds: string[], now: Date) {
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);

  const weeklyMetrics = await db
    .select({
      week: sql<string>`date_trunc('week', ${metrics.recordedAt})`,
      views: sum(metrics.views),
      likes: sum(metrics.likes),
    })
    .from(metrics)
    .innerJoin(publications, eq(metrics.publicationId, publications.id))
    .innerJoin(contents, eq(publications.contentId, contents.id))
    .where(and(inArray(contents.workspaceId, workspaceIds), gte(metrics.recordedAt, eightWeeksAgo)))
    .groupBy(sql`date_trunc('week', ${metrics.recordedAt})`)
    .orderBy(sql`date_trunc('week', ${metrics.recordedAt})`);

  const weeklyPublished = await db
    .select({
      week: sql<string>`date_trunc('week', ${publications.publishedAt})`,
      published: count(publications.id),
    })
    .from(publications)
    .innerJoin(contents, eq(publications.contentId, contents.id))
    .where(
      and(
        inArray(contents.workspaceId, workspaceIds),
        eq(publications.status, 'published'),
        gte(publications.publishedAt, eightWeeksAgo),
      ),
    )
    .groupBy(sql`date_trunc('week', ${publications.publishedAt})`)
    .orderBy(sql`date_trunc('week', ${publications.publishedAt})`);

  const trendMap = new Map<string, { views: number; likes: number; published: number }>();
  for (let i = 7; i >= 0; i--) {
    const weekDate = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const day = weekDate.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(weekDate.getTime() + diff * 24 * 60 * 60 * 1000);
    monday.setHours(0, 0, 0, 0);
    trendMap.set(monday.toISOString().split('T')[0]!, { views: 0, likes: 0, published: 0 });
  }

  for (const row of weeklyMetrics) {
    const key = new Date(row.week).toISOString().split('T')[0]!;
    const existing = trendMap.get(key);
    if (existing) {
      existing.views = Number(row.views ?? 0);
      existing.likes = Number(row.likes ?? 0);
    }
  }
  for (const row of weeklyPublished) {
    if (!row.week) continue;
    const key = new Date(row.week).toISOString().split('T')[0]!;
    const existing = trendMap.get(key);
    if (existing) {
      existing.published = Number(row.published ?? 0);
    }
  }

  return Array.from(trendMap.entries()).map(([weekStart, data]) => ({ weekStart, ...data }));
}

export async function buildTagPerformance(workspaceIds: string[]) {
  const allContentsWithTags = await db
    .select({ tags: contents.tags, contentId: contents.id })
    .from(contents)
    .where(inArray(contents.workspaceId, workspaceIds));

  const allMetricsByContent = await db
    .select({
      contentId: contents.id,
      totalViews: sum(metrics.views),
      totalLikes: sum(metrics.likes),
    })
    .from(metrics)
    .innerJoin(publications, eq(metrics.publicationId, publications.id))
    .innerJoin(contents, eq(publications.contentId, contents.id))
    .where(inArray(contents.workspaceId, workspaceIds))
    .groupBy(contents.id);

  const metricsMap = new Map(
    allMetricsByContent.map((r) => [
      r.contentId,
      { views: Number(r.totalViews ?? 0), likes: Number(r.totalLikes ?? 0) },
    ]),
  );

  const tagMap = new Map<string, { contentCount: number; totalViews: number; totalLikes: number }>();
  for (const c of allContentsWithTags) {
    const tags = (c.tags as string[]) ?? [];
    const m = metricsMap.get(c.contentId) ?? { views: 0, likes: 0 };
    for (const tag of tags) {
      const existing = tagMap.get(tag) ?? { contentCount: 0, totalViews: 0, totalLikes: 0 };
      existing.contentCount += 1;
      existing.totalViews += m.views;
      existing.totalLikes += m.likes;
      tagMap.set(tag, existing);
    }
  }

  return Array.from(tagMap.entries())
    .map(([tag, data]) => ({
      tag,
      contentCount: data.contentCount,
      avgViews: data.contentCount > 0 ? Math.round(data.totalViews / data.contentCount) : 0,
      avgLikes: data.contentCount > 0 ? Math.round(data.totalLikes / data.contentCount) : 0,
    }))
    .sort((a, b) => b.avgViews - a.avgViews);
}
