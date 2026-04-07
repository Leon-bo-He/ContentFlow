import { z } from 'zod';

const attachmentSchema = z.object({
  type: z.enum(['image', 'link', 'screenshot']),
  url: z.string().url(),
  name: z.string(),
});

export const createIdeaSchema = z.object({
  title: z.string().min(1).max(500),
  workspaceId: z.string().uuid().optional(),
  note: z.string().optional(),
  tags: z.array(z.string()).default([]),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  attachments: z.array(attachmentSchema).default([]),
});

export const updateIdeaSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  workspaceId: z.string().uuid().nullable().optional(),
  note: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  attachments: z.array(attachmentSchema).optional(),
  status: z.enum(['active', 'converted', 'archived']).optional(),
});
