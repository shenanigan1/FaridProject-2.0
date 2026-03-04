// import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { finalize } from 'rxjs';

// import { TemplatesApi } from '@features/test-templates/services/test-templates.api';
// import { PoolsStore } from '@features/pools/services/pools.store';
// import { QuestionPool } from '@features/pools/models/question-pool.model';

// import { UiIconButtonComponent } from '@shared/ui/icon-button/icon-button.component';
// import { UiButtonPrimaryComponent } from '@shared/ui/button-primary/button-primary.component';
// import { UiButtonSecondaryComponent } from '@shared/ui/button-secondary/button-secondary.component';
// import { UiProgressBarComponent } from '@shared/ui/progress-bar/progress-bar.component';

// interface QuestionVm {
//   id: number;
//   text: string;
//   points: number;
//   mandatory?: boolean;
// }

// interface SectionPoolRuleVm {
//   poolId: string;
//   randomCount: number;
//   mandatoryCount?: number;
// }

// interface SectionVm {
//   id: string;
//   title: string;
//   description?: string;
//   weight: number;
//   questions: QuestionVm[];
//   pools: SectionPoolRuleVm[];
// }

// function uid(): string {
//   return Math.random().toString(16).slice(2) + Date.now().toString(16);
// }

// @Component({
//   selector: 'app-templates-eval-create-page',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     UiIconButtonComponent,
//     UiButtonPrimaryComponent,
//     UiButtonSecondaryComponent,
//     UiProgressBarComponent,
//   ],
//   templateUrl: './test-templates-create.page.html',
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class TemplatesEvalCreatePage {
//   private readonly fb = inject(FormBuilder);
//   private readonly route = inject(ActivatedRoute);
//   private readonly router = inject(Router);
//   private readonly templatesApi = inject(TemplatesApi);
//   private readonly poolsStore = inject(PoolsStore);

//   readonly poolQuery = signal('');

//   readonly poolsLoading = this.poolsStore.isLoading;
//   readonly poolsError = this.poolsStore.error;
//   readonly pools = this.poolsStore.pools;

//   readonly isSaving = signal(false);
//   readonly apiError = signal<string | null>(null);

//   readonly form = this.fb.nonNullable.group({
//     name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
//     duration_minutes: [45, [Validators.required, Validators.min(1), Validators.max(600)]],
//     min_pass_score: [80, [Validators.required, Validators.min(0), Validators.max(100)]],
//   });

//   readonly sections = signal<SectionVm[]>([]);

//   readonly filteredPools = computed(() => {
//     const q = this.poolQuery().trim().toLowerCase();
//     const items = this.pools();
//     if (!q) return items;
//     return items.filter(
//       (p) => (p.name ?? '').toLowerCase().includes(q) || (p.code ?? '').toLowerCase().includes(q)
//     );
//   });

//   readonly totalWeight = computed(() =>
//     this.sections().reduce((acc, s) => acc + (Number.isFinite(s.weight) ? s.weight : 0), 0)
//   );

//   readonly totalQuestions = computed(() =>
//     this.sections().reduce((acc, s) => acc + s.questions.length, 0)
//   );

//   readonly totalPoints = computed(() =>
//     this.sections().reduce((acc, s) => acc + s.questions.reduce((a, q) => a + (q.points ?? 0), 0), 0)
//   );

//   readonly avgTimePerQuestion = computed(() => {
//     const totalQ = this.totalQuestions();
//     if (totalQ <= 0) return null;
//     const minutes = this.form.controls.duration_minutes.value || 0;
//     return minutes / totalQ;
//   });

//   readonly completion = computed(() => {
//     let score = 0;
//     if (this.form.controls.name.valid) score += 30;
//     if (this.form.controls.duration_minutes.valid) score += 15;
//     if (this.form.controls.min_pass_score.valid) score += 15;
//     if (this.sections().length > 0) score += 10;
//     if (this.totalWeight() === 100) score += 30;
//     return Math.min(100, Math.max(0, score));
//   });

//   constructor() {
//     this.poolsStore.loadAll();
//   }

//   trackByPoolId(_: number, item: QuestionPool): string {
//     return item.id;
//   }

//   setPoolSearch(value: string): void {
//     this.poolQuery.set(value ?? '');
//   }

//   addSection(): void {
//     const nextIndex = this.sections().length + 1;

//     this.sections.update((list) => [
//       ...list,
//       { id: uid(), title: `Section ${nextIndex}`, description: '', weight: 0, questions: [], pools: [] },
//     ]);
//   }

//   removeSection(sectionId: string): void {
//     this.sections.update((list) => list.filter((s) => s.id !== sectionId));
//   }

//   updateSectionTitle(sectionId: string, title: string): void {
//     this.sections.update((list) => list.map((s) => (s.id === sectionId ? { ...s, title: title ?? '' } : s)));
//   }

//   updateSectionWeight(sectionId: string, weight: number): void {
//     const w = Number.isFinite(weight) ? Math.max(0, Math.min(100, Math.floor(weight))) : 0;
//     this.sections.update((list) => list.map((s) => (s.id === sectionId ? { ...s, weight: w } : s)));
//   }

//   assignSection(sectionId: string): void {
//     void sectionId;
//   }

//   attachPoolToSection(sectionId: string, poolId: string): void {
//     if (!poolId) return;

//     this.sections.update((list) =>
//       list.map((s) => {
//         if (s.id !== sectionId) return s;
//         if (s.pools.some((p) => p.poolId === poolId)) return s;
//         return { ...s, pools: [...s.pools, { poolId, randomCount: 3 }] };
//       })
//     );
//   }

//   detachPool(sectionId: string, poolId: string): void {
//     this.sections.update((list) =>
//       list.map((s) => (s.id === sectionId ? { ...s, pools: s.pools.filter((p) => p.poolId !== poolId) } : s))
//     );
//   }

//   updatePoolRandomCount(sectionId: string, poolId: string, count: number): void {
//     const c = Math.max(0, Math.floor(Number(count) || 0));
//     this.sections.update((list) =>
//       list.map((s) => {
//         if (s.id !== sectionId) return s;
//         return { ...s, pools: s.pools.map((p) => (p.poolId === poolId ? { ...p, randomCount: c } : p)) };
//       })
//     );
//   }

//   poolName(poolId: string): string {
//     return this.pools().find((p) => p.id === poolId)?.name ?? `Pool #${poolId}`;
//   }

//   discard(): void {
//     void this.router.navigate(['/templates']);
//   }

//   weightSegments(): { label: string; weight: number }[] {
//     const items = this.sections();
//     const sum = items.reduce((acc, s) => acc + (Number(s.weight) || 0), 0);

//     return items.map((s) => {
//       const raw = Number(s.weight) || 0;
//       const pct = sum > 0 ? (raw / sum) * 100 : 0;
//       return { label: s.title || 'Untitled', weight: pct };
//     });
//   }

//   save(): void {
//     this.apiError.set(null);

//     if (this.form.invalid) {
//       this.form.markAllAsTouched();
//       return;
//     }

//     this.isSaving.set(true);

//     const payload = {
//       ...this.form.getRawValue(),
//       sections: this.sections(),
//     };

//     this.templatesApi
//       .create(payload as any)
//       .pipe(finalize(() => this.isSaving.set(false)))
//       .subscribe({
//         next: (saved: any) => {
//           if (saved?.id) void this.router.navigate(['/templates', saved.id]);
//           else void this.router.navigate(['/templates']);
//         },
//         error: (err) => {
//           this.apiError.set(err?.error?.detail ?? err?.error?.message ?? 'Save failed. Please try again.');
//         },
//       });
//   }
// }
