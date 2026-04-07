export const ContentType = {
  VIDEO_SHORT: 'video_short',
  VIDEO_LONG: 'video_long',
  IMAGE_TEXT: 'image_text',
  ARTICLE: 'article',
  PODCAST: 'podcast',
  LIVE: 'live',
} as const;

export type ContentType = (typeof ContentType)[keyof typeof ContentType];
