import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Observable } from 'rxjs';

import { TemplatesApi } from '@features/test-templates/services/test-templates.api';
import { PoolsStore } from '@features/pools/services/pools.store';
import { QuestionPool } from '@features/pools/models/question-pool.model';

import { UiIconButtonComponent } from '@lib-ui/icon-button/icon-button.component';
import { UiButtonPrimaryComponent } from '@lib-ui/button-primary/button-primary.component';
import { UiButtonSecondaryComponent } from '@lib-ui/button-secondary/button-secondary.component';
import { UiProgressBarComponent } from '@lib-ui/progress-bar/progress-bar.component';
import { APP_ICONS } from '@shared/icons/app-icons';
import { LucideDynamicIcon } from '@lucide/angular';

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

type Mode = 'create' | 'view' | 'edit';

interface TemplateFormValue {
  name: string;
  duration_minutes: number;
  min_pass_score: number;
  difficulty: Difficulty;
  is_active: boolean;
}

type TemplatePayload = TemplateFormValue & { sections: SectionVm[] };

// type TemplateSaved = { id: number | string };

function uid(): string {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/// ---- safe parsing helpers (0 any) ----
type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function asBoolean(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function pick(v: UnknownRecord, ...keys: string[]): unknown {
  for (const k of keys) {
    if (k in v) return v[k];
  }
  return undefined;
}

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
    LucideDynamicIcon
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

  readonly icons = APP_ICONS;

  // --- routing ---
  readonly templateId = computed<number | null>(() => {
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
  private snapshot: { formValue: TemplateFormValue; sections: SectionVm[] } | null = null;

  // pools sidebar
  readonly poolQuery = signal('');
  readonly pools = this.poolsStore.pools;
  readonly poolsLoading = this.poolsStore.isLoading;
  readonly poolsError = this.poolsStore.error;

  // optional: helps avoid “unused” for assignSection and is useful later
  readonly assigningSectionId = signal<string | null>(null);

  // form
  readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(120),
    ]),
    duration_minutes: this.fb.nonNullable.control(45, [
      Validators.required,
      Validators.min(1),
      Validators.max(600),
    ]),
    min_pass_score: this.fb.nonNullable.control(80, [
      Validators.required,
      Validators.min(0),
      Validators.max(100),
    ]),
    difficulty: this.fb.nonNullable.control<Difficulty>('medium', [Validators.required]),
    is_active: this.fb.nonNullable.control(true),
  });

  readonly sections = signal<SectionVm[]>([]);

  // ---- derived ----
  readonly isEditMode = computed(() => this.mode() === 'edit' || this.mode() === 'create');

  readonly filteredPools = computed(() => {
    const q = this.poolQuery().trim().toLowerCase();
    const items = this.pools();
    if (!q) return items;

    return items.filter(
      (p) => (p.name ?? '').toLowerCase().includes(q) || (p.code ?? '').toLowerCase().includes(q),
    );
  });

  readonly totalWeight = computed(() =>
    this.sections().reduce((acc, s) => acc + (Number.isFinite(s.weight) ? s.weight : 0), 0),
  );

  readonly totalQuestions = computed(() =>
    this.sections().reduce((acc, s) => acc + s.questions.length, 0),
  );

  readonly totalPoints = computed(() =>
    this.sections().reduce(
      (acc, s) => acc + s.questions.reduce((a, q) => a + (q.points ?? 0), 0),
      0,
    ),
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
      this.snapshot = {
        formValue: this.form.getRawValue(),
        sections: structuredClone(this.sections()),
      };
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
        next: (dtoUnknown: unknown) => {
          const dto = isRecord(dtoUnknown) ? dtoUnknown : {};

          this.form.patchValue({
            name: asString(dto['name'], ''),
            duration_minutes: asNumber(dto['duration_minutes'], 45),
            min_pass_score: asNumber(dto['min_pass_score'], 80),
            difficulty: (asString(dto['difficulty'], 'medium') as Difficulty) || 'medium',
            is_active: asBoolean(dto['is_active'], true),
          });

          const dtoSections = asArray(dto['sections']);
          const mapped: SectionVm[] = dtoSections.map((sUnknown) => this.mapSection(sUnknown));

          this.sections.set(mapped);

          this.snapshot = {
            formValue: this.form.getRawValue(),
            sections: structuredClone(this.sections()),
          };
        },
        error: (err: unknown) => {
          this.pageError.set(this.extractErrorMessage(err, 'Failed to load template.'));
        },
      });
  }

  private mapSection(sUnknown: unknown): SectionVm {
    const s = isRecord(sUnknown) ? sUnknown : {};

    const id = asString(pick(s, 'id'), uid());
    const title = asString(pick(s, 'title', 'name'), 'Untitled Section');
    const description = asString(pick(s, 'description'), '');
    const weight = Math.max(0, Math.min(100, Math.floor(asNumber(pick(s, 'weight'), 0))));

    const questions = asArray(pick(s, 'questions')).map((qUnknown): QuestionVm => {
      const q = isRecord(qUnknown) ? qUnknown : {};
      return {
        id: asNumber(pick(q, 'id'), 0),
        text: asString(pick(q, 'text', 'label'), 'Question'),
        points: asNumber(pick(q, 'points'), 0),
        mandatory: asBoolean(pick(q, 'mandatory'), false),
      };
    });

    const pools = asArray(pick(s, 'pools')).map((prUnknown): SectionPoolRuleVm => {
      const pr = isRecord(prUnknown) ? prUnknown : {};
      const poolId = asString(pick(pr, 'poolId', 'pool_id', 'pool'), '');
      const randomCount = Math.max(
        0,
        Math.floor(asNumber(pick(pr, 'randomCount', 'random_count'), 0)),
      );

      const mandatoryRaw = pick(pr, 'mandatoryCount', 'mandatory_count');
      const mandatoryCount =
        typeof mandatoryRaw === 'number' && Number.isFinite(mandatoryRaw)
          ? Math.max(0, Math.floor(mandatoryRaw))
          : undefined;

      return { poolId, randomCount, mandatoryCount };
    });

    return { id, title, description, weight, questions, pools };
  }

  private extractErrorMessage(err: unknown, fallback: string): string {
    if (!isRecord(err)) return fallback;
    const e = err['error'];
    if (!isRecord(e)) return fallback;
    const detail = e['detail'];
    const message = e['message'];
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (typeof message === 'string' && message.trim()) return message;
    return fallback;
  }

  // ---- header actions ----
  discard(): void {
    void this.router.navigate(['/templates']);
  }

  toggleEdit(): void {
    if (this.templateId() === null) return;

    if (this.mode() === 'view') {
      this.snapshot = {
        formValue: this.form.getRawValue(),
        sections: structuredClone(this.sections()),
      };
      this.mode.set('edit');
      this.form.enable({ emitEvent: false });
      return;
    }

    this.cancelEdit();
  }

  cancelEdit(): void {
    if (this.templateId() === null) {
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
    if (!this.isEditMode()) return;
    this.sections.update((list) => list.filter((s) => s.id !== sectionId));
  }

  updateSectionTitle(sectionId: string, title: string): void {
    if (!this.isEditMode()) return;
    this.sections.update((list) =>
      list.map((s) => (s.id === sectionId ? { ...s, title: title ?? '' } : s)),
    );
  }

  updateSectionWeight(sectionId: string, weight: number): void {
    if (!this.isEditMode()) return;
    const w = Number.isFinite(weight) ? Math.max(0, Math.min(100, Math.floor(weight))) : 0;

    this.sections.update((list) => list.map((s) => (s.id === sectionId ? { ...s, weight: w } : s)));
  }

  assignSection(sectionId: string): void {
    if (!this.isEditMode()) return;
    // Placeholder utile (et plus propre que "void sectionId")
    this.assigningSectionId.set(sectionId);
    this.apiError.set('Assign UI not implemented yet.');
  }

  attachPoolToSection(sectionId: string, poolId: string): void {
    if (!this.isEditMode()) return;
    if (!poolId) return;

    this.sections.update((list) =>
      list.map((s) => {
        if (s.id !== sectionId) return s;
        if (s.pools.some((p) => p.poolId === poolId)) return s;
        return { ...s, pools: [...s.pools, { poolId, randomCount: 3 }] };
      }),
    );
  }

  detachPool(sectionId: string, poolId: string): void {
    if (!this.isEditMode()) return;

    this.sections.update((list) =>
      list.map((s) =>
        s.id === sectionId ? { ...s, pools: s.pools.filter((p) => p.poolId !== poolId) } : s,
      ),
    );
  }

  updatePoolRandomCount(sectionId: string, poolId: string, count: number): void {
    if (!this.isEditMode()) return;
    const c = Math.max(0, Math.floor(Number(count) || 0));

    this.sections.update((list) =>
      list.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          pools: s.pools.map((p) => (p.poolId === poolId ? { ...p, randomCount: c } : p)),
        };
      }),
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

    const payload: TemplatePayload = {
      ...this.form.getRawValue(),
      sections: this.sections(),
    };

    const id = this.templateId();

    // Si tes méthodes API sont typées, enlève les casts.
    const req$: Observable<unknown> =
      id === null ? this.api.create(payload) : this.api.update(id, payload);

    req$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (savedUnknown: unknown) => {
        const saved = isRecord(savedUnknown) ? savedUnknown : {};
        const savedId = saved['id'];

        if (id === null) {
          if (typeof savedId === 'number' || typeof savedId === 'string') {
            void this.router.navigate(['/templates', savedId]);
          } else {
            // fallback si API ne renvoie pas l'id
            void this.router.navigate(['/templates']);
          }
          return;
        }

        this.mode.set('view');
        this.form.disable({ emitEvent: false });
        this.snapshot = {
          formValue: this.form.getRawValue(),
          sections: structuredClone(this.sections()),
        };
      },
      error: (err: unknown) => {
        this.apiError.set(this.extractErrorMessage(err, 'Save failed. Please try again.'));
      },
    });
  }
}
