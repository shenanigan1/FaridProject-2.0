// templates_eval-editor.page.ts (your file)
// ✅ Changes only where needed

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { TemplatesApi } from 'src/app/features/test-templates/services/test-templates.api';
import { PoolsStore } from 'src/app/features/pools/services/pools.store';
import { QuestionPool } from 'src/app/features/pools/models/question-pool.model';

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

@Component({
  selector: 'app-templates-eval-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './test-templates-create.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesEvalCreatePage {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly templatesApi = inject(TemplatesApi);

  private readonly poolsStore = inject(PoolsStore);

  readonly poolQuery = signal('');

  readonly poolsLoading = this.poolsStore.isLoading;
  readonly poolsError = this.poolsStore.error;

  // ✅ keep pools from store (QuestionPool has string id)
  readonly pools = this.poolsStore.pools;

  readonly isSaving = signal(false);
  readonly apiError = signal<string | null>(null);

  constructor() {
    this.poolsStore.loadAll();
  }

  // ✅ track pools by QuestionPool id (string)
  trackByPoolId(_: number, item: QuestionPool): string {
    return item.id;
  }

  // Template form (top “Basic Information”)
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    duration_minutes: [45, [Validators.required, Validators.min(1), Validators.max(600)]],
    min_pass_score: [80, [Validators.required, Validators.min(0), Validators.max(100)]],
    difficulty: ['medium' as Difficulty],
    is_active: [true],
  });

  // ✅ Workspace (sections) — EMPTY, no hardcoded values
  readonly sections = signal<SectionVm[]>([]);

  // Derived state
  readonly filteredPools = computed(() => {
    const q = this.poolQuery().trim().toLowerCase();
    const items = this.pools();
    if (!q) return items;

    return items.filter(p =>
      (p.name ?? '').toLowerCase().includes(q) ||
      (p.code ?? '').toLowerCase().includes(q)
    );
  });

  readonly totalWeight = computed(() =>
    this.sections().reduce((acc, s) => acc + (Number.isFinite(s.weight) ? s.weight : 0), 0)
  );

  readonly totalQuestions = computed(() =>
    this.sections().reduce((acc, s) => acc + s.questions.length, 0)
  );

  readonly totalPoints = computed(() =>
    this.sections().reduce((acc, s) => acc + s.questions.reduce((a, q) => a + (q.points ?? 0), 0), 0)
  );

  readonly avgTimePerQuestion = computed(() => {
    const totalQ = this.totalQuestions();
    if (totalQ <= 0) return null;
    const minutes = this.form.controls.duration_minutes.value || 0;
    return minutes / totalQ;
  });

  readonly completion = computed(() => {
    let score = 0;
    if (this.form.controls.name.valid) score += 30;
    if (this.form.controls.duration_minutes.valid) score += 15;
    if (this.form.controls.min_pass_score.valid) score += 15;
    if (this.sections().length > 0) score += 10;
    if (this.totalWeight() === 100) score += 30;
    return Math.min(100, Math.max(0, score));
  });

  // ---- Actions ----

  setPoolSearch(value: string): void {
    this.poolQuery.set(value ?? '');
  }

  addSection(): void {
    const nextIndex = this.sections().length + 1;

    this.sections.update(list => [
      ...list,
      {
        id: uid(),
        title: `Section ${nextIndex}`,
        description: '',
        weight: 0,
        questions: [],
        pools: [],
      },
    ]);
  }

  removeSection(sectionId: string): void {
    this.sections.update(list => list.filter(s => s.id !== sectionId));
  }

  updateSectionWeight(sectionId: string, weight: number): void {
    const w = Number.isFinite(weight) ? Math.max(0, Math.min(100, Math.floor(weight))) : 0;
    this.sections.update(list => list.map(s => (s.id === sectionId ? { ...s, weight: w } : s)));
  }

  updateSectionTitle(sectionId: string, title: string): void {
    this.sections.update(list => list.map(s => (s.id === sectionId ? { ...s, title: title ?? '' } : s)));
  }

  // ✅ NEW: Assign button handler (does nothing for now)
  assignSection(sectionId: string): void {
    // TODO: Button for assign à manager to the section
    void sectionId;
  }

  attachPoolToSection(sectionId: string, poolId: string): void {
    this.sections.update(list =>
      list.map(s => {
        if (s.id !== sectionId) return s;

        const exists = s.pools.some(p => p.poolId === poolId);
        if (exists) return s;

        return { ...s, pools: [...s.pools, { poolId, randomCount: 3 }] };
      })
    );
  }

  detachPool(sectionId: string, poolId: string): void {
    this.sections.update(list =>
      list.map(s => (s.id === sectionId ? { ...s, pools: s.pools.filter(p => p.poolId !== poolId) } : s))
    );
  }

  updatePoolRandomCount(sectionId: string, poolId: string, count: number): void {
    const c = Math.max(0, Math.floor(Number(count) || 0));
    this.sections.update(list =>
      list.map(s => {
        if (s.id !== sectionId) return s;
        return { ...s, pools: s.pools.map(p => (p.poolId === poolId ? { ...p, randomCount: c } : p)) };
      })
    );
  }

  discard(): void {
    void this.router.navigate(['/templates']);
  }

  save(): void {
    this.apiError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    const payload = {
      ...this.form.getRawValue(),
      sections: this.sections(),
    };

    const templateId = Number(this.route.snapshot.paramMap.get('id') || 0);

    const req$ = templateId
      ? this.templatesApi.update(templateId, payload as any)
      : this.templatesApi.create(payload as any);

    req$
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (saved: any) => {
          if (!templateId && saved?.id) {
            void this.router.navigate(['/templates', saved.id]);
          }
        },
        error: (err) => {
          this.apiError.set(err?.error?.detail ?? err?.error?.message ?? 'Save failed. Please try again.');
        },
      });
  }

  weightSegments(): { label: string; weight: number }[] {
    return this.sections().map(s => ({ label: s.title || 'Untitled', weight: s.weight || 0 }));
  }

  poolName(poolId: string): string {
    return this.pools().find(p => p.id === poolId)?.name ?? `Pool #${poolId}`;
  }
}
