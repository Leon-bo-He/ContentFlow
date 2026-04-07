export interface Metrics {
  id: string;
  publicationId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followersGained: number;
  recordedAt: Date;
  createdAt: Date;
}

export type CreateMetricsInput = Pick<Metrics, 'publicationId'> & {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  followersGained?: number;
  recordedAt?: Date;
};
