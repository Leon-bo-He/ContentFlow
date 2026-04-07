import { z } from 'zod';

const platformValues = [
  'douyin', 'xiaohongshu', 'weixin', 'weixin_video',
  'bilibili', 'x', 'youtube', 'instagram',
] as const;

const contentTypeValues = [
  'video_short', 'video_long', 'image_text', 'article', 'podcast', 'live',
] as const;

const publishGoalSchema = z.object({
  count: z.number().int().positive(),
  period: z.enum(['day', 'week', 'month']),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().min(1).max(10),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  platform: z.enum(platformValues),
  contentType: z.enum(contentTypeValues),
  defaultLocale: z.string().default('zh-CN'),
  timezone: z.string().default('Asia/Shanghai'),
  publishGoal: publishGoalSchema.optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().min(1).max(10).optional(),
  publishGoal: publishGoalSchema.optional(),
  defaultLocale: z.string().optional(),
  timezone: z.string().optional(),
  stageConfig: z
    .array(z.object({ id: z.string(), label: z.string(), order: z.number() }))
    .optional(),
});
