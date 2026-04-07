export const PublicationStatus = {
  DRAFT: 'draft',
  QUEUED: 'queued',
  READY: 'ready',
  POSTING: 'posting',
  PUBLISHED: 'published',
  FAILED: 'failed',
  SKIPPED: 'skipped',
} as const;

export type PublicationStatus = (typeof PublicationStatus)[keyof typeof PublicationStatus];
