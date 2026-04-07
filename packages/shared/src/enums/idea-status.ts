export const IdeaStatus = {
  ACTIVE: 'active',
  CONVERTED: 'converted',
  ARCHIVED: 'archived',
} as const;

export type IdeaStatus = (typeof IdeaStatus)[keyof typeof IdeaStatus];
