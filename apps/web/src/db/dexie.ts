import Dexie, { type Table } from 'dexie';

interface LocalIdea {
  id: string;
  userId: string;
  workspaceId: string | null;
  title: string;
  note: string | null;
  tags: string[];
  priority: string;
  status: string;
  createdAt: string;
  _synced: boolean;
  _localId?: string;
}

interface LocalWorkspace {
  id: string;
  name: string;
  color: string;
  icon: string;
  platform: string;
  contentType: string;
}

interface LocalContent {
  id: string;
  workspaceId: string;
  title: string;
  stage: string;
  scheduledAt: string | null;
  updatedAt: string;
}

export class ContentFlowDB extends Dexie {
  ideas!: Table<LocalIdea>;
  workspaces!: Table<LocalWorkspace>;
  contents!: Table<LocalContent>;

  constructor() {
    super('contentflow');
    this.version(1).stores({
      ideas: 'id, workspaceId, status, _synced, createdAt',
      workspaces: 'id',
      contents: 'id, workspaceId, stage',
    });
  }
}

export const localDb = new ContentFlowDB();
