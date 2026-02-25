export interface QuestionPool {
  id: string;           // UUID string
  code: string;         // unique
  name: string;
  description?: string;
  updatedAt: string;    // ISO string for now
}
