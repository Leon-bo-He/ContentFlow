import type { Priority } from '../enums/priority.js';
import type { IdeaStatus } from '../enums/idea-status.js';

export interface IdeaAttachment {
  type: 'image' | 'link' | 'screenshot';
  url: string;
  name: string;
}

export interface Idea {
  id: string;
  userId: string;
  workspaceId: string | null;
  title: string;
  note: string | null;
  tags: string[];
  priority: Priority;
  attachments: IdeaAttachment[];
  status: IdeaStatus;
  convertedTo: string | null;
  createdAt: Date;
}

export type CreateIdeaInput = Pick<Idea, 'title'> & {
  workspaceId?: string;
  note?: string;
  tags?: string[];
  priority?: Priority;
  attachments?: IdeaAttachment[];
};

export type UpdateIdeaInput = Partial<
  Pick<Idea, 'title' | 'note' | 'tags' | 'priority' | 'attachments' | 'workspaceId' | 'status'>
>;
