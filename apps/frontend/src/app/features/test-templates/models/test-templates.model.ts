export type TemplateDifficulty = 'easy' | 'medium' | 'hard';

export interface TemplateListItem {
  id: number;
  name: string;

  // Optional if backend provides it, otherwise computed client-side / default
  difficulty?: TemplateDifficulty;

  // Stats (as shown in the card). If backend doesn’t provide them yet, keep optional.
  points_total?: number;
  duration_minutes?: number;

  created_at: string;
  updated_at?: string;
  is_active: boolean;
}

export interface TemplateSectionPoolRuleDto {
  poolId: string;
  randomCount: number;
  mandatoryCount?: number;
}

export interface TemplateQuestionDto {
  id: number;
  title?: string;
  format?: string;
  poolId?: string;
  text: string;
  points: number;
  mandatory?: boolean;
}

export interface TemplateSectionDto {
  id: string;            // backend might be number; we normalize to string in UI
  title: string;
  description?: string;
  weight: number;
  questions: TemplateQuestionDto[];
  pools: TemplateSectionPoolRuleDto[];
}

export interface TemplateDetailDto {
  id: number;
  name: string;
  duration_minutes: number;
  min_pass_score: number;
  difficulty: TemplateDifficulty;
  is_active: boolean;
  sections: TemplateSectionDto[];
  created_at?: string;
  updated_at?: string;
}

export interface TemplateUpsertPayload {
  name: string;
  duration_minutes: number;
  min_pass_score: number;
  difficulty?: TemplateDifficulty;
  is_active?: boolean;
  sections: TemplateSectionDto[];
}
