import { Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SkillQuestionsStore } from '@features/questions/services/skill-questions.store';
import { SkillQuestion, QuestionType } from '@features/questions/models/skill-question.model';

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

  readonly query = signal('');
  readonly items = this.store.items;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;

  // modal state
  readonly isEditOpen = signal(false);
  readonly editing = signal<SkillQuestion | null>(null);

  readonly form = this.fb.nonNullable.group({
    type: this.fb.nonNullable.control<QuestionType>('text', [Validators.required]),
    prompt: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(2000),
    ]),
    isMandatory: this.fb.nonNullable.control(false),
    minScore: this.fb.nonNullable.control(0, [Validators.min(0)]),
    maxScore: this.fb.nonNullable.control(5, [Validators.min(0)]),
  });

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.items();
    if (!q) return list;

    return list.filter(x =>
      x.prompt.toLowerCase().includes(q) ||
      x.type.toLowerCase().includes(q) ||
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
    alert('Add Question: next step');
  }

  openEdit(q: SkillQuestion): void {
    this.editing.set(q);
    this.form.reset({
      type: q.type,
      prompt: q.prompt,
      isMandatory: q.isMandatory,
      minScore: q.minScore,
      maxScore: q.maxScore,
    });
    this.isEditOpen.set(true);
  }

  closeEdit(): void {
    this.isEditOpen.set(false);
    this.editing.set(null);
  }

  saveEdit(): void {
    const q = this.editing();
    if (!q) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = {
      type: this.form.controls.type.value,
      prompt: this.form.controls.prompt.value.trim(),
      isMandatory: this.form.controls.isMandatory.value,
      minScore: this.form.controls.minScore.value,
      maxScore: this.form.controls.maxScore.value,
    };

    this.store.update(q.id, dto, () => this.closeEdit());
  }

  badgeLabel(type: QuestionType): string {
    if (type === 'multiple_choice') return 'MULTIPLE CHOICE';
    if (type === 'true_false') return 'TRUE/FALSE';
    return 'TEXT';
  }
}
