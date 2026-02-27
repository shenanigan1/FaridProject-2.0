import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PoolsStore } from '@features/pools/services/pools.store';
import { PoolQuestionsPanelComponent } from '@features/questions/components/pool-questions-panel.component';

import { POOL_CODE_PATTERN, normalizePoolCode } from '@features/pools/models/pool-code';
import { PoolFormComponent, PoolFormMode } from '@features/pools/components/pool-form.component';

import { UiTabsComponent, UiTabItem } from '@shared/ui/tabs/tabs.component';
import { UiIconButtonComponent } from '@shared/ui/icon-button/icon-button.component';
import { UiButtonPrimaryComponent } from '@shared/ui/button-primary/button-primary.component';
import { UiButtonSecondaryComponent } from '@shared/ui/button-secondary/button-secondary.component';
import { UiCardComponent } from '@shared/ui/card/card.component';
import { UiAlertComponent } from '@shared/ui/alert/alert.component';
import { UiSpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { UiEmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';

type TabKey = 'questions' | 'settings';
type EditorMode = 'create' | 'detail';

@Component({
  selector: 'app-pool-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    ReactiveFormsModule,

    PoolQuestionsPanelComponent,
    PoolFormComponent,

    UiTabsComponent,
    UiIconButtonComponent,
    UiButtonPrimaryComponent,
    UiButtonSecondaryComponent,
    UiCardComponent,
    UiAlertComponent,
    UiSpinnerComponent,
    UiEmptyStateComponent,
  ],
  templateUrl: './pool-editor.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolEditorPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(PoolsStore);
  private readonly fb = inject(FormBuilder);

  // store bindings
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;
  readonly pool = this.store.selectedPool;

  // UI state
  readonly tab = signal<TabKey>('questions');
  readonly isEditing = signal(false);

  // route-derived
  readonly poolId = signal<string | null>(null);
  readonly pageMode = computed<EditorMode>(() => (this.poolId() ? 'detail' : 'create'));

  // tabs only relevant in detail mode
  readonly tabs = computed<UiTabItem<TabKey>[]>(() => [
    { key: 'questions', label: 'Questions' },
    { key: 'settings', label: 'Settings' },
  ]);

  // Shared form (create + edit)
  readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    code: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.pattern(POOL_CODE_PATTERN),
      Validators.minLength(3),
      Validators.maxLength(50),
    ]),
    description: this.fb.nonNullable.control('', [Validators.maxLength(500)]),
  });

  // app-pool-form mode
  readonly formMode = computed<PoolFormMode>(() => {
    if (this.pageMode() === 'create') return 'create';
    return this.isEditing() ? 'edit' : 'view';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.poolId.set(id);

    if (!id) {
      // create page
      this.isEditing.set(true);       // create == editing
      this.tab.set('settings');       // single content, reuse settings form
      return;
    }

    // detail page
    this.store.loadOne(id);
    this.isEditing.set(false);
    this.tab.set('questions');
  }

  back(): void {
    void this.router.navigateByUrl('/pools');
  }

  retry(): void {
    const id = this.poolId();
    if (id) this.store.loadOne(id);
  }

  setTab(key: TabKey): void {
    this.tab.set(key);
  }

  // ---- edit lifecycle (detail mode only) ----
  startEdit(): void {
    const p = this.pool();
    if (!p) return;

    this.form.reset({
      name: p.name ?? '',
      code: p.code ?? '',
      description: p.description ?? '',
    });

    this.isEditing.set(true);
    this.tab.set('settings');
  }

  cancelEdit(): void {
    if (this.pageMode() === 'create') {
      this.back();
      return;
    }
    this.isEditing.set(false);
  }

  normalizeCode(): void {
    this.form.controls.code.setValue(normalizePoolCode(this.form.controls.code.value));
  }

  // ---- submit ----
  submit(): void {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = {
      name: this.form.controls.name.value.trim(),
      code: this.form.controls.code.value.trim(),
      description: this.form.controls.description.value.trim(),
    };

    if (this.pageMode() === 'create') {
      this.store.create(dto, () => this.back());
      return;
    }

    const p = this.pool();
    if (!p) return;

    this.store.update(p.id, dto, () => this.isEditing.set(false));
  }
}
