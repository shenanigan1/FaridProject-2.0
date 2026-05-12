/**
 * LEGACY (temporary)
 * Keep only while migrating old UI components that still use prompt/minScore/maxScore/type.
 * Keep until the v2 migration no longer references the old shape.
 */

/** eslint-disable @typescript-eslint/no-unused-vars */
export type QuestionType = 'multiple_choice' | 'true_false' | 'text';

export interface SkillQuestionLegacy {
  id: string; // normalized string
  poolId: string; // normalized string
  type: QuestionType;
  prompt: string;
  is_mandatory: boolean;
  minScore: number;
  maxScore: number;
  updatedAt: string;
}
/** eslint-enable @typescript-eslint/no-unused-vars */

/**
 * V2 (current)
 * Matches the new backend question authoring model.
 */
export type QuestionFormat = 'mcq' | 'true_false' | 'yes_no' | 'free_text' | 'rating' | 'practical';
export type Difficulty = 'easy' | 'intermediate' | 'hard';

/**
 * Practical rubric payload:
 * - backend can store structured JSON
 * - keep it flexible but typed (no `any`)
 */
export type PracticalRubric = Record<string, unknown> | null;

export interface SkillQuestion {
  id: string; // normalized string
  poolId: string; // normalized string

  format: QuestionFormat;

  // Authoring content
  title: string; // optional label (can be empty)
  text: string; // main question text (required)
  explanation: string; // optional explanation
  rubric: PracticalRubric;

  // Meta/scoring
  is_mandatory: boolean;
  is_eliminatory: boolean;
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
  rubric: PracticalRubric;

  is_mandatory: boolean;
  is_eliminatory: boolean;
  points: number;
  difficulty: Difficulty;

  order: number;

  created_at: string;
  updated_at: string;
}
