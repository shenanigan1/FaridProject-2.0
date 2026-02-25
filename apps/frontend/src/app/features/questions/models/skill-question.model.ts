export type QuestionType = 'multiple_choice' | 'true_false' | 'text';

export interface SkillQuestion {
  id: string;          // normalized string
  poolId: string;      // normalized string
  type: QuestionType;
  prompt: string;
  isMandatory: boolean;
  minScore: number;
  maxScore: number;
  updatedAt: string;
}
