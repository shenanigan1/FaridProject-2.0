import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SkillQuestionsStore } from '@features/questions/services/skill-questions.store';
import { SkillQuestion, QuestionFormat, Difficulty } from '@features/questions/models/skill-question.model';

import { UiTabsComponent, UiTabItem } from '@shared/ui/tabs/tabs.component';
import { UiButtonPrimaryComponent } from '@shared/ui/button-primary/button-primary.component';
import { UiButtonSecondaryComponent } from '@shared/ui/button-secondary/button-secondary.component';
import { UiIconButtonComponent } from '@shared/ui/icon-button/icon-button.component';
import { UiSelectComponent, UiSelectOption } from '@shared/ui/select/select.component';

type TabKey = 'editor' | 'preview' | 'settings' | 'history';
type Rubric = Record<string, unknown>;

interface SkillQuestionUpsertDto {
  format: QuestionFormat;
  title: string;
  text: string;
  explanation: string;
  rubric: Rubric;
  is_mandatory: boolean;
  points: number;
  difficulty: Difficulty;
  order: number;
}

const createDefaultRubric = (): Rubric => ({});

const isQuestionFormat = (v: unknown): v is QuestionFormat =>
  v === 'mcq' || v === 'true_false' || v === 'practical';

const isDifficulty = (v: unknown): v is Difficulty =>
  v === 'easy' || v === 'intermediate' || v === 'hard';

@Component({
  selector: 'app-question-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    
    UiIconButtonComponent,
    UiButtonPrimaryComponent,
    UiButtonSecondaryComponent,
    UiTabsComponent,
    UiSelectComponent,
  ],
  templateUrl: './question-editor.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionEditorPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(SkillQuestionsStore);

  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;

  readonly tab = signal<TabKey>('editor');

  readonly poolId = signal<string>('');
  readonly questionId = signal<string | null>(null);

  /** Create vs Edit */
  readonly isEditMode = computed(() => this.questionId() !== null);

  readonly tabs: UiTabItem<TabKey>[] = [
    { key: 'editor', label: 'Editor' },
    { key: 'preview', label: 'Preview' },
    { key: 'settings', label: 'Settings' },
    { key: 'history', label: 'History' },
  ];

  readonly difficultyOptions: UiSelectOption<Difficulty>[] = [
    { value: 'easy', label: 'Easy' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'hard', label: 'Hard' },
  ];

  readonly form = this.fb.nonNullable.group({
    format: this.fb.nonNullable.control<QuestionFormat>('mcq', [Validators.required]),
    title: this.fb.nonNullable.control('', [Validators.maxLength(255)]),
    text: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(2500),
    ]),
    explanation: this.fb.nonNullable.control(''),
    rubric: this.fb.nonNullable.control<Rubric>(createDefaultRubric()),

    is_mandatory: this.fb.nonNullable.control(false),

    points: this.fb.nonNullable.control(10, [Validators.required, Validators.min(1), Validators.max(1000)]),
    difficulty: this.fb.nonNullable.control<Difficulty>('intermediate', [Validators.required]),
    order: this.fb.nonNullable.control(0, [Validators.min(0)]),
  });

  readonly textCount = computed(() => this.form.controls.text.value.length);

  ngOnInit(): void {
    const poolId = this.route.snapshot.paramMap.get('poolId');
    const qid = this.route.snapshot.paramMap.get('questionId'); // optional

    if (!poolId) {
      void this.router.navigateByUrl('/pools');
      return;
    }

    this.poolId.set(poolId);
    this.questionId.set(qid);

    if (!qid) return;

    // Edit mode → load + patch
    this.store.loadOne(qid, (row: SkillQuestion | null) => {
      if (!row) return;

      this.form.reset(this.toFormValue(row));
    });
  }

  back(): void {
    void this.router.navigate(['/pools', this.poolId()]);
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

    const dto = this.toDto();

    const qid = this.questionId();
    if (!qid) {
      this.store.createInPool(this.poolId(), dto, () => this.back());
      return;
    }

    this.store.update(qid, dto, () => this.back());
  }

  private toFormValue(row: SkillQuestion) {
    return {
      format: isQuestionFormat(row.format) ? row.format : 'mcq',
      title: row.title ?? '',
      text: row.text ?? '',
      explanation: row.explanation ?? '',
      rubric: (row.rubric && typeof row.rubric === 'object' ? row.rubric : createDefaultRubric()) as Rubric,

      is_mandatory: !!row.is_mandatory,

      points: typeof row.points === 'number' ? row.points : 10,
      difficulty: isDifficulty(row.difficulty) ? row.difficulty : 'intermediate',
      order: typeof row.order === 'number' ? row.order : 0,
    };
  }

  private toDto(): SkillQuestionUpsertDto {
    return {
      format: this.form.controls.format.value,
      title: this.form.controls.title.value.trim(),
      text: this.form.controls.text.value.trim(),
      explanation: this.form.controls.explanation.value.trim(),
      rubric: this.form.controls.rubric.value ?? createDefaultRubric(),

      is_mandatory: this.form.controls.is_mandatory.value,

      points: this.form.controls.points.value,
      difficulty: this.form.controls.difficulty.value,
      order: this.form.controls.order.value,
    };
  }
}
