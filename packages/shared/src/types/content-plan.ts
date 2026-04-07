export interface FormatConfig {
  duration?: number;
  aspectRatio?: string;
  [key: string]: unknown;
}

export interface AudienceProfile {
  ageRange: string;
  personaTags: string[];
  painPoints: string;
  reachScenario: string;
}

export interface KpiTargets {
  likes?: number;
  comments?: number;
  shares?: number;
  followers?: number;
  [key: string]: number | undefined;
}

export interface HookAnalysis {
  coreHook: string;
  conflict: string;
  goldenOpening: string;
  memoryPoint: string;
}

export interface TitleCandidate {
  text: string;
  isPrimary: boolean;
  usedOnPlatforms: string[];
}

export interface OutlineItem {
  order: number;
  section: string;
  timeMark?: string;
  note?: string;
}

export type ContentGoal = 'grow_followers' | 'convert' | 'traffic' | 'branding';

export interface ContentPlan {
  id: string;
  contentId: string;
  formatConfig: FormatConfig;
  audience: AudienceProfile | null;
  audienceTemplateId: string | null;
  goals: ContentGoal[];
  goalDescription: string | null;
  kpiTargets: KpiTargets;
  hooks: HookAnalysis | null;
  titleCandidates: TitleCandidate[];
  outline: OutlineItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type UpsertContentPlanInput = Partial<
  Pick<
    ContentPlan,
    | 'formatConfig'
    | 'audience'
    | 'audienceTemplateId'
    | 'goals'
    | 'goalDescription'
    | 'kpiTargets'
    | 'hooks'
    | 'titleCandidates'
    | 'outline'
  >
>;
