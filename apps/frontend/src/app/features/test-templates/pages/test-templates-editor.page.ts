import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { TemplatesApi } from '@features/test-templates/services/test-templates.api';
import { PoolsStore } from '@features/pools/services/pools.store';
import { QuestionPool } from '@features/pools/models/question-pool.model';

import { UiIconButtonComponent } from '@shared/ui/icon-button/icon-button.component';
import { UiButtonPrimaryComponent } from '@shared/ui/button-primary/button-primary.component';
import { UiButtonSecondaryComponent } from '@shared/ui/button-secondary/button-secondary.component';
import { UiProgressBarComponent } from '@shared/ui/progress-bar/progress-bar.component';

type Difficulty = 'easy' | 'medium' | 'hard';

interface QuestionVm {
  id: number;
  text: string;
  points: number;
  mandatory?: boolean;
}
interface SectionPoolRuleVm {
  poolId: string;
  randomCount: number;
  mandatoryCount?: number;
}
interface SectionVm {
  id: string;
  title: string;
  description?: string;
  weight: number;
  questions: QuestionVm[];
  pools: SectionPoolRuleVm[];
}

function uid(): string {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

type Mode = 'create' | 'view' | 'edit';

@Component({
  selector: 'app-test-template-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    UiIconButtonComponent,
    UiButtonPrimaryComponent,
    UiButtonSecondaryComponent,
    UiProgressBarComponent,
  ],
  templateUrl: './test-templates-editor.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestTemplateEditorPage {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(TemplatesApi);
  private readonly poolsStore = inject(PoolsStore);

  // --- routing ---
  readonly templateId = computed(() => {
    const raw = this.route.snapshot.paramMap.get('id');
    const id = raw ? Number(raw) : NaN;
    return Number.isFinite(id) ? id : null;
  });

  readonly mode = signal<Mode>('create'); // resolved in constructor

  // --- page state ---
  readonly pageLoading = signal(false);
  readonly pageError = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly apiError = signal<string | null>(null);

  // snapshot for cancel edit
  private snapshot: { formValue: any; sections: SectionVm[] } | null = null;

  // pools sidebar
  readonly poolQuery = signal('');
  readonly pools = this.poolsStore.pools;
  readonly poolsLoading = this.poolsStore.isLoading;
  readonly poolsError = this.poolsStore.error;

  // form
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    duration_minutes: [45, [Validators.required, Validators.min(1), Validators.max(600)]],
    min_pass_score: [80, [Validators.required, Validators.min(0), Validators.max(100)]],
    difficulty: ['medium' as Difficulty, [Validators.required]],
    is_active: [true],
  });

  readonly sections = signal<SectionVm[]>([]);

  // ---- derived ----
  readonly isEditMode = computed(() => this.mode() === 'edit' || this.mode() === 'create');

  readonly filteredPools = computed(() => {
    const q = this.poolQuery().trim().toLowerCase();
    const items = this.pools();
    if (!q) return items;
    return items.filter(p => (p.name ?? '').toLowerCase().includes(q) || (p.code ?? '').toLowerCase().includes(q));
  });

  readonly totalWeight = computed(() =>
    this.sections().reduce((acc, s) => acc + (Number.isFinite(s.weight) ? s.weight : 0), 0)
  );

  readonly totalQuestions = computed(() => this.sections().reduce((acc, s) => acc + s.questions.length, 0));

  readonly totalPoints = computed(() =>
    this.sections().reduce((acc, s) => acc + s.questions.reduce((a, q) => a + (q.points ?? 0), 0), 0)
  );

  readonly avgTimePerQuestion = computed(() => {
    const totalQ = this.totalQuestions();
    if (totalQ <= 0) return null;
    return (this.form.controls.duration_minutes.value || 0) / totalQ;
  });

  readonly completion = computed(() => {
    let score = 0;
    const v = this.form.getRawValue();

    if ((v.name ?? '').trim().length >= 3) score += 30;
    if (Number.isFinite(v.duration_minutes) && v.duration_minutes > 0) score += 15;
    if (Number.isFinite(v.min_pass_score) && v.min_pass_score >= 0) score += 15;
    if (this.sections().length > 0) score += 10;
    if (this.totalWeight() === 100) score += 30;

    return Math.min(100, Math.max(0, score));
  });

  constructor() {
    this.poolsStore.loadAll();

    const id = this.templateId();
    if (id === null) {
      // /templates/new
      this.mode.set('create');
      this.snapshot = { formValue: this.form.getRawValue(), sections: structuredClone(this.sections()) };
      return;
    }

    // /templates/:id
    this.mode.set('view');
    this.form.disable({ emitEvent: false });
    this.load(id);
  }

  // ---- page lifecycle helpers ----
  private load(id: number): void {
    this.pageLoading.set(true);
    this.pageError.set(null);

    this.api
      .get(id)
      .pipe(finalize(() => this.pageLoading.set(false)))
      .subscribe({
        next: (dto) => {
          this.form.patchValue({
            name: dto?.name ?? '',
            duration_minutes: dto?.duration_minutes ?? 45,
            min_pass_score: dto?.min_pass_score ?? 80,
            difficulty: (dto?.difficulty ?? 'medium') as Difficulty,
            is_active: dto?.is_active ?? true,
          });

          const dtoSections = Array.isArray(dto?.sections) ? dto.sections : [];
          const mapped: SectionVm[] = dtoSections.map((s: any) => ({
            id: String(s?.id ?? uid()),
            title: s?.title ?? s?.name ?? 'Untitled Section',
            description: s?.description ?? '',
            weight: Number.isFinite(s?.weight) ? s.weight : 0,
            questions: Array.isArray(s?.questions)
              ? s.questions.map((q: any) => ({
                  id: Number(q?.id ?? 0),
                  text: String(q?.text ?? q?.label ?? 'Question'),
                  points: Number(q?.points ?? 0),
                  mandatory: Boolean(q?.mandatory ?? false),
                }))
              : [],
            pools: Array.isArray(s?.pools)
              ? s.pools.map((pr: any) => ({
                  poolId: String(pr?.poolId ?? pr?.pool_id ?? pr?.pool ?? ''),
                  randomCount: Number(pr?.randomCount ?? pr?.random_count ?? 0),
                  mandatoryCount: pr?.mandatoryCount ?? pr?.mandatory_count ?? undefined,
                }))
              : [],
          }));

          this.sections.set(mapped);

          // snapshot for “cancel edit”
          this.snapshot = { formValue: this.form.getRawValue(), sections: structuredClone(this.sections()) };
        },
        error: (err) => {
          this.pageError.set(err?.error?.detail ?? err?.error?.message ?? 'Failed to load template.');
        },
      });
  }

  // ---- header actions ----
  discard(): void {
    void this.router.navigate(['/templates']);
  }

  toggleEdit(): void {
    if (this.templateId() === null) return; // create already editable

    if (this.mode() === 'view') {
      this.snapshot = { formValue: this.form.getRawValue(), sections: structuredClone(this.sections()) };
      this.mode.set('edit');
      this.form.enable({ emitEvent: false });
      return;
    }

    // if already edit -> go back to view
    this.cancelEdit();
  }

  cancelEdit(): void {
    if (this.templateId() === null) {
      // create mode: cancel just goes back to list
      this.discard();
      return;
    }

    if (this.snapshot) {
      this.form.reset(this.snapshot.formValue);
      this.sections.set(structuredClone(this.snapshot.sections));
    }
    this.mode.set('view');
    this.form.disable({ emitEvent: false });
  }

  // ---- sidebar ----
  trackByPoolId(_: number, item: QuestionPool): string {
    return item.id;
  }
  setPoolSearch(value: string): void {
    this.poolQuery.set(value ?? '');
  }
  poolName(poolId: string): string {
    return this.pools().find((p) => p.id === poolId)?.name ?? `Pool #${poolId}`;
  }

  // ---- sections actions ----
  addSection(): void {
    if (!this.isEditMode()) return;
    const nextIndex = this.sections().length + 1;

    this.sections.update((list) => [
      ...list,
      { id: uid(), title: `Section ${nextIndex}`, description: '', weight: 0, questions: [], pools: [] },
    ]);
  }

  removeSection(sectionId: string): void {
    if (!this.isEditMode()) return;
    this.sections.update((list) => list.filter((s) => s.id !== sectionId));
  }

  updateSectionTitle(sectionId: string, title: string): void {
    if (!this.isEditMode()) return;
    this.sections.update((list) => list.map((s) => (s.id === sectionId ? { ...s, title: title ?? '' } : s)));
  }

  updateSectionWeight(sectionId: string, weight: number): void {
    if (!this.isEditMode()) return;
    const w = Number.isFinite(weight) ? Math.max(0, Math.min(100, Math.floor(weight))) : 0;
    this.sections.update((list) => list.map((s) => (s.id === sectionId ? { ...s, weight: w } : s)));
  }

  assignSection(sectionId: string): void {
    if (!this.isEditMode()) return;
    void sectionId;
  }

  attachPoolToSection(sectionId: string, poolId: string): void {
    if (!this.isEditMode()) return;
    if (!poolId) return;

    this.sections.update((list) =>
      list.map((s) => {
        if (s.id !== sectionId) return s;
        if (s.pools.some((p) => p.poolId === poolId)) return s;
        return { ...s, pools: [...s.pools, { poolId, randomCount: 3 }] };
      })
    );
  }

  detachPool(sectionId: string, poolId: string): void {
    if (!this.isEditMode()) return;
    this.sections.update((list) =>
      list.map((s) => (s.id === sectionId ? { ...s, pools: s.pools.filter((p) => p.poolId !== poolId) } : s))
    );
  }

  updatePoolRandomCount(sectionId: string, poolId: string, count: number): void {
    if (!this.isEditMode()) return;
    const c = Math.max(0, Math.floor(Number(count) || 0));
    this.sections.update((list) =>
      list.map((s) => {
        if (s.id !== sectionId) return s;
        return { ...s, pools: s.pools.map((p) => (p.poolId === poolId ? { ...p, randomCount: c } : p)) };
      })
    );
  }

  // ---- right preview ----
  weightSegments(): { label: string; weight: number }[] {
    const items = this.sections();
    const sum = items.reduce((acc, s) => acc + (Number(s.weight) || 0), 0);

    return items.map((s) => {
      const raw = Number(s.weight) || 0;
      const pct = sum > 0 ? (raw / sum) * 100 : 0;
      return { label: s.title || 'Untitled', weight: pct };
    });
  }

  // ---- save ----
  save(): void {
    this.apiError.set(null);

    if (!this.isEditMode()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    const payload = {
      ...this.form.getRawValue(),
      sections: this.sections(),
    };

    const id = this.templateId();
    const req$ = id === null ? this.api.create(payload as any) : this.api.update(id, payload as any);

    req$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (saved: any) => {
        // after save:
        if (id === null) {
          // created => redirect to view
          void this.router.navigate(['/templates', saved?.id]);
          return;
        }

        // edit => lock + refresh snapshot
        this.mode.set('view');
        this.form.disable({ emitEvent: false });
        this.snapshot = { formValue: this.form.getRawValue(), sections: structuredClone(this.sections()) };
      },
      error: (err) => {
        this.apiError.set(err?.error?.detail ?? err?.error?.message ?? 'Save failed. Please try again.');
      },
    });
  }
}
