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
