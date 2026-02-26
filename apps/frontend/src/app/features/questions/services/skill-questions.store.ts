import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import {
  SkillQuestionsApiService,
  CreateSkillQuestionDto,
  UpdateSkillQuestionDto,
} from './skill-questions-api.service';

import {
  SkillQuestion,
  SkillQuestionDto,
  QuestionType, // keep if other parts still use it
} from 'src/app/features/questions/models/skill-question.model';

@Injectable({ providedIn: 'root' })
export class SkillQuestionsStore {
  private readonly api = inject(SkillQuestionsApiService);

  private readonly _items = signal<SkillQuestion[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly items = computed(() => this._items());
  readonly isLoading = computed(() => this._isLoading());
  readonly error = computed(() => this._error());

  /**
   * Existing: list questions by pool
   */
  loadByPool(poolId: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .listByPool(poolId)
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: (rows) => this._items.set((rows ?? []).map((r) => this.mapApiToUi(r))),
        error: () => this._error.set('Failed to load questions.'),
      });
  }

  /**
   * NEW: load one question (used by edit page)
   * Does not replace list by default; returns mapped entity via callback.
   */
  loadOne(questionId: string, onSuccess: (row: SkillQuestion) => void): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .get(questionId)
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: (row) => onSuccess(this.mapApiToUi(row)),
        error: () => this._error.set('Failed to load question.'),
      });
  }

  /**
   * NEW: create question inside pool (nested endpoint)
   * Also pushes the created question into the local list.
   */
  createInPool(poolId: string, dto: CreateSkillQuestionDto, onSuccess?: (created: SkillQuestion) => void): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .createInPool(poolId, dto)
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: (row) => {
          const created = this.mapApiToUi(row);
          this._items.set([created, ...this._items()]);
          onSuccess?.(created);
        },
        error: () => this._error.set('Failed to create question.'),
      });
  }

  /**
   * Existing: update question
   * Updated to match new DTO/shape (format/text/points/difficulty/etc).
   */
  update(questionId: string, dto: UpdateSkillQuestionDto, onSuccess?: () => void): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .update(questionId, dto)
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: (row) => {
          const updated = this.mapApiToUi(row);
          const current = this._items();
          const idx = current.findIndex((x) => x.id === updated.id);

          if (idx >= 0) {
            const nextArr = current.slice();
            nextArr[idx] = updated;
            this._items.set(nextArr);
          } else {
            // In case list wasn't loaded, keep store consistent
            this._items.set([updated, ...current]);
          }

          onSuccess?.();
        },
        error: () => this._error.set('Failed to update question.'),
      });
  }

  /**
   * NEW: delete (optional, ready for later)
   * Keeps existing methods untouched.
   */
  delete(questionId: string, onSuccess?: () => void): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .delete(questionId)
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: () => {
          this._items.set(this._items().filter((x) => x.id !== questionId));
          onSuccess?.();
        },
        error: () => this._error.set('Failed to delete question.'),
      });
  }

  /**
   * Mapper: API -> UI model
   * Adapted to the new backend schema:
   * - format: mcq | true_false | practical
   * - text/title/explanation
   * - points/difficulty
   * - is_mandatory
   * - timestamps: created_at / updated_at
   *
   * NOTE: Your UI `SkillQuestion` model must contain these fields.
   * If it doesn't yet, update it accordingly.
   */
  private mapApiToUi(r: SkillQuestionDto): SkillQuestion {
    const updatedAt = (r as any).updated_at ?? (r as any).created_at ?? new Date().toISOString();

    // Backward compatibility (if old API fields still appear somewhere)
    const legacyPrompt = (r as any).prompt ?? (r as any).label ?? '';

    return {
      id: String((r as any).id),
      poolId: String((r as any).pool),

      // new core fields
      format: ((r as any).format ?? 'mcq') as SkillQuestion['format'],
      title: String((r as any).title ?? ''),
      text: String((r as any).text ?? legacyPrompt),
      explanation: String((r as any).explanation ?? ''),
      rubric: (r as any).rubric ?? {},

      // meta/scoring
      is_mandatory: Boolean((r as any).is_mandatory),
      points: Number((r as any).points ?? 10),
      difficulty: ((r as any).difficulty ?? 'intermediate') as SkillQuestion['difficulty'],

      // ordering + audit
      order: Number((r as any).order ?? 0),
      updatedAt,
      createdAt: (r as any).created_at ?? updatedAt,
    } as SkillQuestion;
  }
}
