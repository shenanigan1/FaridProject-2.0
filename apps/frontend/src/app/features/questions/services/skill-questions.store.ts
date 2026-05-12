import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import {
  SkillQuestionsApiService,
  CreateSkillQuestionDto,
  UpdateSkillQuestionDto,
} from './skill-questions-api.service';

import {
  SkillQuestion,
  SkillQuestionDto,
  // QuestionType, // ❌ unused here → remove to satisfy no-unused-vars
} from 'src/app/features/questions/models/skill-question.model';

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function pickString(obj: UnknownRecord, key: string): string | null {
  const v = obj[key];
  return typeof v === 'string' ? v : null;
}

// function pickNumber(obj: UnknownRecord, key: string): number | null {
//   const v = obj[key];
//   return typeof v === 'number' && Number.isFinite(v) ? v : null;
// }

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
        next: (rows) => this._items.set((rows ?? []).map((r) => this.mapApiToUi(r))),
        error: (err: unknown) => this._error.set(this.toMessage(err, 'Failed to load questions.')),
      });
  }

  loadOne(questionId: string, onSuccess: (row: SkillQuestion) => void): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .get(questionId)
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: (row) => onSuccess(this.mapApiToUi(row)),
        error: (err: unknown) => this._error.set(this.toMessage(err, 'Failed to load question.')),
      });
  }

  createInPool(
    poolId: string,
    dto: CreateSkillQuestionDto,
    onSuccess?: (created: SkillQuestion) => void
  ): void {
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
        error: (err: unknown) => this._error.set(this.toMessage(err, 'Failed to create question.')),
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
          const updated = this.mapApiToUi(row);
          const current = this._items();
          const idx = current.findIndex((x) => x.id === updated.id);

          if (idx >= 0) {
            const nextArr = current.slice();
            nextArr[idx] = updated;
            this._items.set(nextArr);
          } else {
            this._items.set([updated, ...current]);
          }

          onSuccess?.();
        },
        error: (err: unknown) => this._error.set(this.toMessage(err, 'Failed to update question.')),
      });
  }

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
        error: (err: unknown) => this._error.set(this.toMessage(err, 'Failed to delete question.')),
      });
  }

  private mapApiToUi(r: SkillQuestionDto): SkillQuestion {
    // ✅ SkillQuestionDto already defines these keys → no need for "any"
    const updatedAt = r.updated_at ?? r.created_at ?? new Date().toISOString();
    const createdAt = r.created_at ?? updatedAt;

    // ✅ Legacy fallback (no any): only if backend sometimes returns old shape
    let legacyPrompt = '';
    const maybeLegacy: unknown = r;
    if (isRecord(maybeLegacy)) {
      legacyPrompt = pickString(maybeLegacy, 'prompt') ?? pickString(maybeLegacy, 'label') ?? '';
    }

    // rubric is typed as `any` in your model currently.
    // Here we keep it safe without any: accept object, otherwise default {}
    const rubricSafe = isRecord(r.rubric) ? r.rubric : {};

    return {
      id: String(r.id),
      poolId: String(r.pool),

      format: r.format ?? 'mcq',
      title: r.title ?? '',
      text: (r.text ?? '').trim() || legacyPrompt,
      explanation: r.explanation ?? '',
      rubric: rubricSafe,

      is_mandatory: !!r.is_mandatory,
      is_eliminatory: !!r.is_eliminatory,
      points: typeof r.points === 'number' ? r.points : 10,
      difficulty: r.difficulty ?? 'intermediate',

      order: typeof r.order === 'number' ? r.order : 0,

      createdAt,
      updatedAt,
    };
  }

  private toMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return 'Network error (API unreachable).';
      if (err.status === 401) return 'Unauthorized. Please login again.';
      if (err.status === 403) return 'Forbidden.';

      const data = err.error;
      if (isRecord(data)) {
        const detail = pickString(data, 'detail');
        if (detail) return detail;
      }

      return fallback;
    }

    return fallback;
  }
}
