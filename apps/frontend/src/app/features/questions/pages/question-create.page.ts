import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SkillQuestionsStore } from 'src/app/features/questions/services/skill-questions.store';
import { Difficulty, QuestionFormat } from 'src/app/features/questions/models/skill-question.model';

type TabKey = 'editor' | 'preview' | 'settings' | 'history';

@Component({
  selector: 'app-question-create-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './question-create.page.html',
})
export class QuestionCreatePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(SkillQuestionsStore);

  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;

  readonly poolId = signal<string>('');
  readonly tab = signal<TabKey>('editor');

  readonly form = this.fb.nonNullable.group({
    format: this.fb.nonNullable.control<QuestionFormat>('mcq', [Validators.required]),
    title: this.fb.nonNullable.control('', [Validators.maxLength(255)]),
    text: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(2500),
    ]),
    explanation: this.fb.nonNullable.control(''),
    rubric: this.fb.nonNullable.control<any>({}),

    is_mandatory: this.fb.nonNullable.control(false),

    points: this.fb.nonNullable.control(10, [
      Validators.required,
      Validators.min(1),
      Validators.max(1000),
    ]),
    difficulty: this.fb.nonNullable.control<Difficulty>('intermediate', [Validators.required]),
    order: this.fb.nonNullable.control(0, [Validators.min(0)]),
  });

  readonly textCount = computed(() => (this.form.controls.text.value ?? '').length);

  ngOnInit(): void {
    const poolId = this.route.snapshot.paramMap.get('poolId');
    if (!poolId) {
      this.router.navigateByUrl('/pools');
      return;
    }
    this.poolId.set(poolId);
  }

  back(): void {
    this.router.navigate(['/pools', this.poolId()]);
  }

  setTab(t: TabKey): void {
    this.tab.set(t);
  }

  setFormat(fmt: QuestionFormat): void {
    this.form.controls.format.setValue(fmt);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const poolId = this.poolId();

    const dto = {
      format: this.form.controls.format.value,
      title: this.form.controls.title.value.trim(),
      text: this.form.controls.text.value.trim(),
      explanation: this.form.controls.explanation.value.trim(),
      rubric: this.form.controls.rubric.value ?? {},
      is_mandatory: this.form.controls.is_mandatory.value,
      points: this.form.controls.points.value,
      difficulty: this.form.controls.difficulty.value,
      order: this.form.controls.order.value,
    };

    this.store.createInPool(poolId, dto, () => this.back());
  }
}
