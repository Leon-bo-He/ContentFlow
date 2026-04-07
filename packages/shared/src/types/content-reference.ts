export interface ReferenceMetrics {
  views?: number;
  likes?: number;
  comments?: number;
}

export interface ContentReference {
  id: string;
  contentId: string;
  authorName: string;
  contentTitle: string;
  platform: string;
  url: string;
  metricsSnapshot: ReferenceMetrics;
  takeaway: string;
  attachments: string[];
  createdAt: Date;
}

export type CreateContentReferenceInput = Pick<
  ContentReference,
  'authorName' | 'contentTitle' | 'platform' | 'url' | 'takeaway'
> & {
  metricsSnapshot?: ReferenceMetrics;
  attachments?: string[];
};
