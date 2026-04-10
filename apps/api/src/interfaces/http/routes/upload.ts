import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ICONS_DIR = path.join(__dirname, '../../../../uploads/workspace-icons');
const AVATARS_DIR         = path.join(__dirname, '../../../../uploads/avatars');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

async function saveUpload(
  app: FastifyInstance,
  req: Parameters<Parameters<FastifyInstance['post']>[2]>[0],
  reply: Parameters<Parameters<FastifyInstance['post']>[2]>[1],
  destDir: string,
  urlPrefix: string,
) {
  const data = await req.file({ limits: { fileSize: MAX_BYTES } });
  if (!data) return reply.code(400).send({ error: 'No file uploaded' });

  if (!ALLOWED_MIME.has(data.mimetype)) {
    return reply.code(400).send({ error: 'Only JPEG, PNG, GIF, and WebP images are allowed' });
  }

  const ext = EXT_MAP[data.mimetype]!;
  const filename = `${randomUUID()}.${ext}`;
  const dest = path.join(destDir, filename);

  try {
    await pipeline(data.file, createWriteStream(dest));
  } catch {
    return reply.code(500).send({ error: 'Failed to save file' });
  }

  return reply.code(201).send({ url: `${urlPrefix}/${filename}` });
}

export function uploadRoutes(app: FastifyInstance) {
  // POST /api/upload/workspace-icon
  app.post('/api/upload/workspace-icon', { onRequest: [app.authenticate] }, (req, reply) =>
    saveUpload(app, req, reply, WORKSPACE_ICONS_DIR, '/uploads/workspace-icons'),
  );

  // POST /api/upload/avatar
  app.post('/api/upload/avatar', { onRequest: [app.authenticate] }, (req, reply) =>
    saveUpload(app, req, reply, AVATARS_DIR, '/uploads/avatars'),
  );
}
