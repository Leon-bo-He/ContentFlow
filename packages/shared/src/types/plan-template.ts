import type { AudienceProfile, ContentGoal } from './content-plan.js';

export interface PlanTemplate {
  id: string;
  workspaceId: string;
  name: string;
  audience: AudienceProfile | null;
  goals: ContentGoal[];
  goalDescription: string | null;
  createdAt: Date;
}

export type CreatePlanTemplateInput = Pick<PlanTemplate, 'name'> & {
  audience?: AudienceProfile;
  goals?: ContentGoal[];
  goalDescription?: string;
};
