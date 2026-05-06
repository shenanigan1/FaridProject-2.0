// import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { finalize } from 'rxjs';

// import { TemplatesApi } from '@features/test-templates/services/test-templates.api';
// import { PoolsStore } from '@features/pools/services/pools.store';
// import { QuestionPool } from '@features/pools/models/question-pool.model';

// import { UiIconButtonComponent } from '@lib-ui/icon-button/icon-button.component';
// import { UiButtonPrimaryComponent } from '@lib-ui/button-primary/button-primary.component';
// import { UiButtonSecondaryComponent } from '@lib-ui/button-secondary/button-secondary.component';
// import { UiProgressBarComponent } from '@lib-ui/progress-bar/progress-bar.component';

// type Difficulty = 'easy' | 'medium' | 'hard';

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
//   selector: 'app-test-templates-edit-page',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     UiIconButtonComponent,
//     UiButtonPrimaryComponent,
//     UiButtonSecondaryComponent,
//     UiProgressBarComponent,
//   ],
//   templateUrl: './test-templates-edit.page.html',
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class TemplatesEvalEditPage {
//   private readonly fb = inject(FormBuilder);
//   private readonly route = inject(ActivatedRoute);
//   private readonly router = inject(Router);

//   private readonly templatesApi = inject(TemplatesApi);
//   private readonly poolsStore = inject(PoolsStore);

//   readonly pageLoading = signal(true);
//   readonly pageError = signal<string | null>(null);

//   readonly isSaving = signal(false);
//   readonly apiError = signal<string | null>(null);

//   /** View-first: starts locked */
//   readonly isEditMode = signal(false);

//   private templateSnapshot: { formValue: any; sections: SectionVm[] } | null = null;

//   readonly poolQuery = signal('');

//   // Pools (left sidebar)
//   readonly poolsLoading = this.poolsStore.isLoading;
//   readonly poolsError = this.poolsStore.error;
//   readonly pools = this.poolsStore.pools;

//   readonly form = this.fb.nonNullable.group({
//     name: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
//     duration_minutes: [{ value: 45, disabled: true }, [Validators.required, Validators.min(1), Validators.max(600)]],
//     min_pass_score: [{ value: 80, disabled: true }, [Validators.required, Validators.min(0), Validators.max(100)]],
//     difficulty: [{ value: 'medium' as Difficulty, disabled: true }],
//     is_active: [{ value: true, disabled: true }],
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
//     const minutes = this.form.controls.duration_minutes.getRawValue() || 0;
//     return minutes / totalQ;
//   });

//   readonly completion = computed(() => {
//     let score = 0;
//     const v = this.form.getRawValue();

//     if ((v.name ?? '').trim().length >= 3) score += 30;
//     if (Number.isFinite(v.duration_minutes) && v.duration_minutes > 0) score += 15;
//     if (Number.isFinite(v.min_pass_score) && v.min_pass_score >= 0) score += 15;
//     if (this.sections().length > 0) score += 10;
//     if (this.totalWeight() === 100) score += 30;

//     return Math.min(100, Math.max(0, score));
//   });

//   constructor() {
//     this.poolsStore.loadAll();
//     this.loadTemplate();
//   }

//   private get templateId(): string {
//     return this.route.snapshot.paramMap.get('id') ?? '';
//   }

//   private loadTemplate(): void {
//     this.pageLoading.set(true);
//     this.pageError.set(null);

//     this.templatesApi
//       .get(this.templateId as any)
//       .pipe(finalize(() => this.pageLoading.set(false)))
//       .subscribe({
//         next: (dto: any) => {
//           this.form.patchValue({
//             name: dto?.name ?? '',
//             duration_minutes: dto?.duration_minutes ?? 45,
//             min_pass_score: dto?.min_pass_score ?? 80,
//             difficulty: (dto?.difficulty ?? 'medium') as Difficulty,
//             is_active: dto?.is_active ?? true,
//           });

//           const dtoSections = Array.isArray(dto?.sections) ? dto.sections : [];
//           const mapped: SectionVm[] = dtoSections.map((s: any) => ({
//             id: String(s?.id ?? uid()),
//             title: s?.title ?? s?.name ?? 'Untitled Section',
//             description: s?.description ?? '',
//             weight: Number.isFinite(s?.weight) ? s.weight : 0,
//             questions: Array.isArray(s?.questions)
//               ? s.questions.map((q: any) => ({
//                   id: Number(q?.id ?? 0),
//                   text: String(q?.text ?? q?.label ?? 'Question'),
//                   points: Number(q?.points ?? 0),
//                   mandatory: Boolean(q?.mandatory ?? false),
//                 }))
//               : [],
//             pools: Array.isArray(s?.pools)
//               ? s.pools.map((pr: any) => ({
//                   poolId: String(pr?.poolId ?? pr?.pool_id ?? pr?.pool ?? ''),
//                   randomCount: Number(pr?.randomCount ?? pr?.random_count ?? 0),
//                   mandatoryCount: pr?.mandatoryCount ?? pr?.mandatory_count ?? undefined,
//                 }))
//               : [],
//           }));

//           this.sections.set(mapped);
//           this.setEditMode(false, true);
//         },
//         error: (err) => {
//           this.pageError.set(err?.error?.detail ?? err?.error?.message ?? 'Failed to load template.');
//         },
//       });
//   }

//   // ---- view/edit mode ----

//   toggleEdit(): void {
//     this.setEditMode(!this.isEditMode(), true);
//   }

//   cancelEdit(): void {
//     if (!this.templateSnapshot) {
//       this.setEditMode(false, false);
//       return;
//     }

//     this.form.reset(this.templateSnapshot.formValue);
//     this.sections.set(structuredClone(this.templateSnapshot.sections));
//     this.setEditMode(false, false);
//   }

//   private setEditMode(enabled: boolean, takeSnapshot: boolean): void {
//     this.isEditMode.set(enabled);

//     if (enabled) {
//       if (takeSnapshot) {
//         this.templateSnapshot = {
//           formValue: this.form.getRawValue(),
//           sections: structuredClone(this.sections()),
//         };
//       }
//       this.form.enable({ emitEvent: false });
//     } else {
//       this.form.disable({ emitEvent: false });
//     }
//   }

//   // ---- UI helpers ----

//   trackByPoolId(_: number, item: QuestionPool): string {
//     return item.id;
//   }

//   setPoolSearch(value: string): void {
//     this.poolQuery.set(value ?? '');
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

//   poolName(poolId: string): string {
//     return this.pools().find((p) => p.id === poolId)?.name ?? `Pool #${poolId}`;
//   }

//   // ---- sections actions ----

//   addSection(): void {
//     if (!this.isEditMode()) return;

//     const nextIndex = this.sections().length + 1;
//     this.sections.update((list) => [
//       ...list,
//       { id: uid(), title: `Section ${nextIndex}`, description: '', weight: 0, questions: [], pools: [] },
//     ]);
//   }

//   removeSection(sectionId: string): void {
//     if (!this.isEditMode()) return;
//     this.sections.update((list) => list.filter((s) => s.id !== sectionId));
//   }

//   updateSectionTitle(sectionId: string, title: string): void {
//     if (!this.isEditMode()) return;
//     this.sections.update((list) => list.map((s) => (s.id === sectionId ? { ...s, title: title ?? '' } : s)));
//   }

//   updateSectionWeight(sectionId: string, weight: number): void {
//     if (!this.isEditMode()) return;

//     const w = Number.isFinite(weight) ? Math.max(0, Math.min(100, Math.floor(weight))) : 0;
//     this.sections.update((list) => list.map((s) => (s.id === sectionId ? { ...s, weight: w } : s)));
//   }

//   assignSection(sectionId: string): void {
//     if (!this.isEditMode()) return;
//     void sectionId;
//   }

//   attachPoolToSection(sectionId: string, poolId: string): void {
//     if (!this.isEditMode()) return;
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
//     if (!this.isEditMode()) return;

//     this.sections.update((list) =>
//       list.map((s) => (s.id === sectionId ? { ...s, pools: s.pools.filter((p) => p.poolId !== poolId) } : s))
//     );
//   }

//   updatePoolRandomCount(sectionId: string, poolId: string, count: number): void {
//     if (!this.isEditMode()) return;

//     const c = Math.max(0, Math.floor(Number(count) || 0));
//     this.sections.update((list) =>
//       list.map((s) => {
//         if (s.id !== sectionId) return s;
//         return { ...s, pools: s.pools.map((p) => (p.poolId === poolId ? { ...p, randomCount: c } : p)) };
//       })
//     );
//   }

//   // ---- navigation ----

//   discard(): void {
//     void this.router.navigate(['/templates']);
//   }

//   // ---- save ----

//   save(): void {
//     if (!this.isEditMode()) return;

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
//       .update(this.templateId as any, payload as any)
//       .pipe(finalize(() => this.isSaving.set(false)))
//       .subscribe({
//         next: () => {
//           this.setEditMode(false, true);
//         },
//         error: (err) => {
//           this.apiError.set(err?.error?.detail ?? err?.error?.message ?? 'Save failed. Please try again.');
//         },
//       });
//   }
// }
