import { Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { SkillQuestionsStore } from '@features/questions/services/skill-questions.store';
import {
  SkillQuestion,
  QuestionFormat,
  Difficulty,
} from '@features/questions/models/skill-question.model';

@Component({
  selector: 'app-pool-questions-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pool-questions-panel.component.html',
})
export class PoolQuestionsPanelComponent {
  poolId = input.required<string>();

  private readonly store = inject(SkillQuestionsStore);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly query = signal('');
  readonly items = this.store.items;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;

  // (Optional) keep modal state if you still want inline edit later
  readonly isEditOpen = signal(false);
  readonly editing = signal<SkillQuestion | null>(null);

  // ✅ v2 form (matches backend fields)
  readonly form = this.fb.nonNullable.group({
    format: this.fb.nonNullable.control<QuestionFormat>('mcq', [Validators.required]),
    title: this.fb.nonNullable.control('', [Validators.maxLength(255)]),
    text: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(2500),
    ]),
    explanation: this.fb.nonNullable.control(''),
    is_mandatory: this.fb.nonNullable.control(false),

    points: this.fb.nonNullable.control(10, [Validators.required, Validators.min(1), Validators.max(1000)]),
    difficulty: this.fb.nonNullable.control<Difficulty>('intermediate', [Validators.required]),
    order: this.fb.nonNullable.control(0, [Validators.min(0)]),
  });

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.items();
    if (!q) return list;

    return list.filter((x) =>
      (x.title ?? '').toLowerCase().includes(q) ||
      (x.text ?? '').toLowerCase().includes(q) ||
      x.format.toLowerCase().includes(q) ||
      x.id.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.store.loadByPool(this.poolId());
  }

  trackById(_: number, item: SkillQuestion): string {
    return item.id;
  }

  onSearch(v: string): void {
    this.query.set(v);
  }

  addQuestion(): void {
    this.router.navigate(['/pools', this.poolId(), 'questions', 'new']);
  }

  openEdit(q: SkillQuestion): void {
    this.router.navigate(['/pools', this.poolId(), 'questions', q.id]);
  }

  // Optional: modal editing (if you ever reopen it)
  openInlineEdit(q: SkillQuestion): void {
    this.editing.set(q);
    this.isEditOpen.set(true);

    this.form.reset({
      format: q.format,
      title: q.title ?? '',
      text: q.text ?? '',
      explanation: q.explanation ?? '',
      is_mandatory: !!q.is_mandatory,
      points: q.points ?? 10,
      difficulty: q.difficulty ?? 'intermediate',
      order: q.order ?? 0,
    });
  }

  closeEdit(): void {
    this.isEditOpen.set(false);
    this.editing.set(null);
  }

  // ✅ v2 dto for PATCH /api/skillquestions/:id/
  saveEdit(): void {
    const q = this.editing();
    if (!q) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = {
      format: this.form.controls.format.value,
      title: this.form.controls.title.value.trim(),
      text: this.form.controls.text.value.trim(),
      explanation: this.form.controls.explanation.value.trim(),
      is_mandatory: this.form.controls.is_mandatory.value,
      points: this.form.controls.points.value,
      difficulty: this.form.controls.difficulty.value,
      order: this.form.controls.order.value,
    };

    this.store.update(q.id, dto, () => this.closeEdit());
  }

  badgeLabel(format: QuestionFormat): string {
    if (format === 'mcq') return 'MULTIPLE CHOICE';
    if (format === 'true_false') return 'TRUE/FALSE';
    return 'PRACTICAL';
  }
}
