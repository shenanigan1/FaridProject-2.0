import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { PoolsStore } from '@features/pools/services/pools.store';
import { QuestionPool } from '@features/pools/models/question-pool.model';

@Component({
  selector: 'app-pools-list-page',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './pools-list.page.html',
})
export class PoolsListPageComponent {
  private readonly store = inject(PoolsStore);

  readonly query = signal('');

  private readonly router = inject(Router);
  readonly pools = this.store.pools;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const items = this.pools();
    if (!q) return items;

    return items.filter(p =>
      (p.name ?? '').toLowerCase().includes(q) ||
      (p.code ?? '').toLowerCase().includes(q)
    );
  });

  constructor() {
    this.store.loadAll();
  }

  trackById(_: number, item: QuestionPool) {
    return item.id;
  }

  onSearch(value: string) {
    this.query.set(value);
  }

  onRetry() {
    this.store.loadAll();
  }

  onCreate() {
    this.router.navigate(['/pools/new']);
  }
}
