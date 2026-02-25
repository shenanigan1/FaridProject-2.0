import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { PoolsApiService } from './pools-api.service';
import { QuestionPool } from '../models/question-pool.model';

type PoolsApiItem = {
  id: number | string;
  code: string;
  name: string;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

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
          const mapped = ((items as unknown as PoolsApiItem[] | null | undefined) ?? []).map((p) =>
            this.mapApiToUi(p),
          );
          this._pools.set(mapped);
        },
        error: (err) => this._error.set(this.toMessage(err)),
      });
  }

  create(dto: { code: string; name: string; description?: string }, onSuccess?: () => void): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .create(dto)
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: () => {
          this.loadAll();
          onSuccess?.();
        },
        error: (err) => this._error.set(this.toMessage(err)),
      });
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
    if (typeof err === 'object' && err && 'status' in err) {
      const status = (err as any).status;
      if (status === 0) return 'Network error (API unreachable).';
      if (status === 401) return 'Unauthorized. Please login again.';
      if (status === 403) return 'Forbidden.';

      const apiErr = err as any;
      const detail =
        apiErr?.error?.detail ||
        apiErr?.error?.code?.[0] ||
        apiErr?.error?.name?.[0] ||
        apiErr?.error?.description?.[0];

      return detail ? String(detail) : `Request failed (status ${status}).`;
    }
    return 'Unexpected error.';
  }

  loadOne(id: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .get(id)
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: (item: any) => {
          const mapped = this.mapApiToUi(item);
          this._selectedPool.set(mapped);

          // Optional: keep list cache in sync
          const current = this._pools();
          const idx = current.findIndex((p) => p.id === mapped.id);
          if (idx >= 0) {
            const next = current.slice();
            next[idx] = mapped;
            this._pools.set(next);
          } else {
            this._pools.set([mapped, ...current]);
          }
        },
        error: (err) => this._error.set(this.toMessage(err)),
      });
  }

  clearSelected(): void {
    this._selectedPool.set(null);
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
      next: (item: any) => {
        const mapped = this.mapApiToUi(item);
        this._selectedPool.set(mapped);

        const current = this._pools();
        const idx = current.findIndex(p => p.id === mapped.id);
        if (idx >= 0) {
          const nextArr = current.slice();
          nextArr[idx] = mapped;
          this._pools.set(nextArr);
        } else {
          this._pools.set([mapped, ...current]);
        }

        onSuccess?.();
      },
      error: (err) => this._error.set(this.toMessage(err)),
    });
}
}
