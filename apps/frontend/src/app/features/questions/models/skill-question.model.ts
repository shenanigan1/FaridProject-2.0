/**
 * LEGACY (temporary)
 * Keep only while migrating old UI components that still use prompt/minScore/maxScore/type.
 * TODO: remove after migration to v2 is complete.
 */
export type QuestionType = 'multiple_choice' | 'true_false' | 'text';

export interface SkillQuestionLegacy {
  id: string;          // normalized string
  poolId: string;      // normalized string
  type: QuestionType;
  prompt: string;
  is_mandatory: boolean;
  minScore: number;
  maxScore: number;
  updatedAt: string;
}

/**
 * V2 (current)
 * Matches the new backend question authoring model.
 */
export type QuestionFormat = 'mcq' | 'true_false' | 'practical';
export type Difficulty = 'easy' | 'intermediate' | 'hard';

export interface SkillQuestion {
  id: string;          // normalized string
  poolId: string;      // normalized string

  format: QuestionFormat;

  // Authoring content
  title: string;       // optional label (can be empty)
  text: string;        // main question text (required)
  explanation: string; // optional explanation
  rubric: any;         // practical grading rubric / structured content

  // Meta/scoring
  is_mandatory: boolean;
  points: number;
  difficulty: Difficulty;

  // Ordering
  order: number;

  // Audit
  createdAt: string;
  updatedAt: string;
}

/**
 * API DTO (unchanged)
 */
export interface SkillQuestionDto {
  id: string;
  pool: string | number;

  format: QuestionFormat;

  title: string;
  text: string;
  explanation: string;
  rubric: any;

  is_mandatory: boolean;
  points: number;
  difficulty: Difficulty;

  order: number;

  created_at: string;
  updated_at: string;
}
