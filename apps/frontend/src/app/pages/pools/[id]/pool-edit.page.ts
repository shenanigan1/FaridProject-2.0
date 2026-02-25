import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PoolsStore } from '@features/pools/services/pools.store';
import {PoolQuestionsPanelComponent} from "@features/questions/components/pool-questions-panel.component";

type TabKey = 'questions' | 'settings';
const CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;

@Component({
  selector: 'app-pool-edit-page',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, ReactiveFormsModule, PoolQuestionsPanelComponent],
  templateUrl: './pool-edit.page.html',
})
export class PoolEditPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(PoolsStore);
  private readonly fb = inject(FormBuilder);

  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;
  readonly pool = this.store.selectedPool;

  readonly tab = signal<TabKey>('questions');

  readonly isEditing = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    code: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.pattern(CODE_PATTERN),
      Validators.minLength(3),
      Validators.maxLength(50),
    ]),
    description: this.fb.nonNullable.control('', [Validators.maxLength(500)]),
  });

  readonly hasDescription = computed(() => {
    const p = this.pool();
    return !!(p?.description && p.description.trim().length > 0);
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigateByUrl('/pools');
      return;
    }
    this.store.loadOne(id);
  }

  back(): void {
    this.router.navigateByUrl('/pools');
  }

  retry(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.store.loadOne(id);
  }

  setTab(key: TabKey): void {
    this.tab.set(key);
  }

  startEdit(): void {
    const p = this.pool();
    if (!p) return;

    this.form.reset({
      name: p.name ?? '',
      code: p.code ?? '',
      description: p.description ?? '',
    });

    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
  }

  normalizeCode(): void {
    const raw = this.form.controls.code.value ?? '';
    const normalized = raw
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '');
    this.form.controls.code.setValue(normalized);
  }

  save(): void {
    const p = this.pool();
    if (!p) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = {
      name: this.form.controls.name.value.trim(),
      code: this.form.controls.code.value.trim(),
      description: this.form.controls.description.value.trim(),
    };

    this.store.update(p.id, dto, () => {
      this.isEditing.set(false);
    });
  }
}
