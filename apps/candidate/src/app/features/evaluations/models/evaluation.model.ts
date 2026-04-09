export interface EvaluationSummary {
  id: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: number | null;
  subject: number;
  position: number | null;
}

export interface EvaluationQuestion {
  evaluation_question_id: number;
  order: number;
  is_mandatory: boolean;
  section: string;
  question_label: string;
  question_type: string;
  min_score: number;
  max_score: number;
  answer: number | null;
}

export interface EvaluationAnswerInput {
  evaluation_question_id: number;
  value: number;
}

export interface SubmitAnswersResponse {
  updated_answers: number;
  answered_questions: number;
  total_questions: number;
  status: string;
}
