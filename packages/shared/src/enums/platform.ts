export const Platform = {
  DOUYIN: 'douyin',
  XIAOHONGSHU: 'xiaohongshu',
  WEIXIN: 'weixin',
  WEIXIN_VIDEO: 'weixin_video',
  BILIBILI: 'bilibili',
  X: 'x',
  YOUTUBE: 'youtube',
  INSTAGRAM: 'instagram',
} as const;

export type Platform = (typeof Platform)[keyof typeof Platform];

export const PLATFORM_LABELS: Record<Platform, string> = {
  douyin: 'Douyin',
  xiaohongshu: 'Xiaohongshu',
  weixin: 'WeChat OA',
  weixin_video: 'WeChat Video',
  bilibili: 'Bilibili',
  x: 'X (Twitter)',
  youtube: 'YouTube',
  instagram: 'Instagram',
};
