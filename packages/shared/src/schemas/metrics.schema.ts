import { z } from 'zod';

export const createMetricsSchema = z.object({
  publicationId: z.string().uuid(),
  views: z.number().int().min(0).default(0),
  likes: z.number().int().min(0).default(0),
  comments: z.number().int().min(0).default(0),
  shares: z.number().int().min(0).default(0),
  saves: z.number().int().min(0).default(0),
  followersGained: z.number().int().default(0),
  recordedAt: z.coerce.date().default(() => new Date()),
});
