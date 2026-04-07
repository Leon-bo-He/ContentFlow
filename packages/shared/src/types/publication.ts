import type { Platform } from '../enums/platform.js';
import type { PublicationStatus } from '../enums/publication-status.js';

export interface PlatformSettings {
  visibility?: 'public' | 'private' | 'friends';
  allowComments?: boolean;
  location?: string;
  collection?: string;
  [key: string]: unknown;
}

export interface PublishLogEntry {
  action: string;
  timestamp: string;
  actor?: string;
  note?: string;
}

export interface Publication {
  id: string;
  contentId: string;
  platform: Platform;
  platformTitle: string | null;
  platformCopy: string | null;
  platformTags: string[];
  coverUrl: string | null;
  platformSettings: PlatformSettings;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  status: PublicationStatus;
  platformPostId: string | null;
  platformUrl: string | null;
  failureReason: string | null;
  publishLog: PublishLogEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePublicationInput = Pick<Publication, 'contentId' | 'platform'> & {
  platformTitle?: string;
  platformCopy?: string;
  platformTags?: string[];
  coverUrl?: string;
  platformSettings?: PlatformSettings;
  scheduledAt?: Date;
};

export type UpdatePublicationInput = Partial<
  Pick<
    Publication,
    | 'platformTitle'
    | 'platformCopy'
    | 'platformTags'
    | 'coverUrl'
    | 'platformSettings'
    | 'scheduledAt'
    | 'status'
  >
>;

export interface MarkPublishedInput {
  platformUrl: string;
  platformPostId?: string;
  publishedAt?: Date;
}
