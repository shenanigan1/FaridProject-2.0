import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { PoolsApiService } from './pools-api.service';
import { QuestionPool } from '@pools/models/question-pool.model';

interface PoolsApiItem {
  id: number | string;
  code: string;
  name: string;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PoolsStore {
  private readonly api = inject(PoolsApiService);

  private readonly _pools = signal<QuestionPool[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedPool = signal<QuestionPool | null>(null);

  readonly pools = computed(() => this._pools());
  readonly isLoading = computed(() => this._isLoading());
  readonly error = computed(() => this._error());
  readonly selectedPool = computed(() => this._selectedPool());

  loadAll(): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .list()
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: (items) => {
          const list = (items ?? []) as unknown as PoolsApiItem[];
          this._pools.set(list.map((p) => this.mapApiToUi(p)));
        },
        error: (err: unknown) => this._error.set(this.toMessage(err)),
      });
  }

  loadOne(id: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .get(id)
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: (item) => {
          const mapped = this.mapApiToUi(item as unknown as PoolsApiItem);
          this._selectedPool.set(mapped);

          // keep list cache in sync
          const current = this._pools();
          const idx = current.findIndex((p) => p.id === mapped.id);

          if (idx >= 0) {
            const nextArr = current.slice();
            nextArr[idx] = mapped;
            this._pools.set(nextArr);
          } else {
            this._pools.set([mapped, ...current]);
          }
        },
        error: (err: unknown) => this._error.set(this.toMessage(err)),
      });
  }

  create(
    dto: { code: string; name: string; description?: string },
    onSuccess?: (created: QuestionPool) => void
  ): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .create(dto)
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: (item) => {
          const created = this.mapApiToUi(item as unknown as PoolsApiItem);
          this._selectedPool.set(created);
          this.loadAll();
          onSuccess?.(created);
        },
        error: (err: unknown) => this._error.set(this.toMessage(err)),
      });
  }

  update(
    id: string,
    dto: { name?: string; code?: string; description?: string },
    onSuccess?: () => void
  ): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .update(id, dto)
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: (item) => {
          const mapped = this.mapApiToUi(item as unknown as PoolsApiItem);
          this._selectedPool.set(mapped);

          const current = this._pools();
          const idx = current.findIndex((p) => p.id === mapped.id);

          if (idx >= 0) {
            const nextArr = current.slice();
            nextArr[idx] = mapped;
            this._pools.set(nextArr);
          } else {
            this._pools.set([mapped, ...current]);
          }

          onSuccess?.();
        },
        error: (err: unknown) => this._error.set(this.toMessage(err)),
      });
  }

  clearSelected(): void {
    this._selectedPool.set(null);
  }

  private mapApiToUi(p: PoolsApiItem): QuestionPool {
    const updatedAt = p.updated_at ?? p.created_at ?? new Date().toISOString();

    return {
      id: String(p.id),
      code: p.code ?? '',
      name: p.name ?? '',
      description: (p.description ?? '').trim(),
      updatedAt,
    };
  }

  private toMessage(err: unknown): string {
    if (!(err instanceof HttpErrorResponse)) return 'Unexpected error.';

    if (err.status === 0) return 'Network error (API unreachable).';
    if (err.status === 401) return 'Unauthorized. Please login again.';
    if (err.status === 403) return 'Forbidden.';

    const payload = this.asRecord(err.error);

    const detail =
      this.pickFirstString(payload?.['detail']) ??
      this.pickFirstString(this.asRecord(payload?.['error'])?.['detail']) ??
      this.pickFirstString(this.asRecord(payload?.['code'])?.[0]) ??
      this.pickFirstString(this.asRecord(payload?.['name'])?.[0]) ??
      this.pickFirstString(this.asRecord(payload?.['description'])?.[0]);

    return detail ?? `Request failed (status ${err.status}).`;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  }

  private pickFirstString(value: unknown): string | null {
    if (typeof value === 'string') return value;

    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      return typeof first === 'string' ? first : null;
    }

    return null;
  }
}
