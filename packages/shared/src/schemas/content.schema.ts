import { z } from 'zod';

const contentTypeValues = [
  'video_short', 'video_long', 'image_text', 'article', 'podcast', 'live',
] as const;

const stageValues = [
  'planned', 'planning', 'creating', 'ready', 'publishing', 'published', 'reviewed',
] as const;

const platformValues = [
  'douyin', 'xiaohongshu', 'weixin', 'weixin_video',
  'bilibili', 'x', 'youtube', 'instagram',
] as const;

export const createContentSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().min(1).max(500),
  contentType: z.enum(contentTypeValues),
  ideaId: z.string().uuid().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  targetPlatforms: z.array(z.enum(platformValues)).default([]),
  locale: z.string().default('zh-CN'),
  scheduledAt: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const updateContentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().nullable().optional(),
  contentType: z.enum(contentTypeValues).optional(),
  stage: z.enum(stageValues).optional(),
  tags: z.array(z.string()).optional(),
  targetPlatforms: z.array(z.enum(platformValues)).optional(),
  locale: z.string().optional(),
  scheduledAt: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional(),
  reviewNotes: z.string().nullable().optional(),
});
