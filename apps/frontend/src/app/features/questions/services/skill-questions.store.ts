import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { SkillQuestionsApiService, UpdateSkillQuestionDto } from './skill-questions-api.service';
import { SkillQuestion, QuestionType } from '../models/skill-question.model';

type SkillQuestionApi = {
  id: number | string;
  pool: number | string;
  type: string;
  prompt: string;
  is_mandatory?: boolean;
  min_score?: number;
  max_score?: number;
  updated_at?: string | null;
  created_at?: string | null;
};

@Injectable({ providedIn: 'root' })
export class SkillQuestionsStore {
  private readonly api = inject(SkillQuestionsApiService);

  private readonly _items = signal<SkillQuestion[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly items = computed(() => this._items());
  readonly isLoading = computed(() => this._isLoading());
  readonly error = computed(() => this._error());

  loadByPool(poolId: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .listByPool(poolId)
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: (rows) => this._items.set((rows ?? []).map(r => this.mapApiToUi(r))),
        error: () => this._error.set('Failed to load questions.'),
      });
  }

  update(questionId: string, dto: UpdateSkillQuestionDto, onSuccess?: () => void): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .update(questionId, dto)
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: (row) => {
          const updated = this.mapApiToUi(row as SkillQuestionApi);
          const current = this._items();
          const idx = current.findIndex(x => x.id === updated.id);
          if (idx >= 0) {
            const nextArr = current.slice();
            nextArr[idx] = updated;
            this._items.set(nextArr);
          }
          onSuccess?.();
        },
        error: () => this._error.set('Failed to update question.'),
      });
  }

  private mapApiToUi(r: SkillQuestionApi): SkillQuestion {
    const updatedAt = r.updated_at ?? r.created_at ?? new Date().toISOString();
    const type = (r.type ?? 'text').toLowerCase() as QuestionType;

    return {
      id: String(r.id),
      poolId: String(r.pool),
      type,
      prompt: r.prompt ?? '',
      isMandatory: Boolean(r.is_mandatory),
      minScore: Number(r.min_score ?? 0),
      maxScore: Number(r.max_score ?? 0),
      updatedAt,
    };
  }
}
