import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { PoolsStore } from '@features/pools/services/pools.store';
import { QuestionPool } from '@features/pools/models/question-pool.model';

// shared/ui
import { UiEmptyStateComponent } from '@lib-ui/empty-state/empty-state.component';
import { UiButtonPrimaryComponent } from '@lib-ui/button-primary/button-primary.component';
import { UiIconButtonComponent } from '@lib-ui/icon-button/icon-button.component';
import { UiAlertComponent } from '@lib-ui/alert/alert.component';
import { UiTextInputComponent } from '@lib-ui/text-input/text-input.component';

@Component({
  standalone: true,
  selector: 'app-pools-list-page',
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    ReactiveFormsModule,
    UiEmptyStateComponent,
    UiButtonPrimaryComponent,
    UiIconButtonComponent,
    UiAlertComponent,
    UiTextInputComponent
  ],
  templateUrl: './pools-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolsListPageComponent {
  private readonly store = inject(PoolsStore);
  private readonly router = inject(Router);

  readonly queryCtrl = new FormControl<string>('', { nonNullable: true });

  readonly pools = this.store.pools;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;

  readonly filtered = computed(() => {
    const q = this.queryCtrl.value.trim().toLowerCase();
    const items = this.pools();
    if (!q) return items;

    return items.filter((p) =>
      (p.name ?? '').toLowerCase().includes(q) ||
      (p.code ?? '').toLowerCase().includes(q)
    );
  });

  constructor() {
    this.store.loadAll();
  }

  trackById(_: number, item: QuestionPool): string {
    return item.id;
  }

  onRetry(): void {
    this.store.loadAll();
  }

  onCreate(): void {
    this.router.navigate(['/pools/new']);
  }
}
