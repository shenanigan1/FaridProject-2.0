import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SkillQuestionsStore } from '@features/questions/services/skill-questions.store';
import { SkillQuestion, QuestionFormat, Difficulty } from '@features/questions/models/skill-question.model';

import { UiTabsComponent, UiTabItem } from '@lib-ui/tabs/tabs.component';
import { UiSelectComponent, UiSelectOption } from '@lib-ui/select/select.component';

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

const createDefaultFormValue = () => ({
  format: 'mcq' as QuestionFormat,
  title: '',
  text: '',
  explanation: '',
  rubric: createDefaultRubric(),
  choice_options_text: '',
  correct_answers_text: '',
  rating_min: 0,
  rating_max: 10,
  is_mandatory: false,
  points: 10,
  difficulty: 'intermediate' as Difficulty,
  order: 0,
});

const isQuestionFormat = (v: unknown): v is QuestionFormat =>
  v === 'mcq' ||
  v === 'true_false' ||
  v === 'yes_no' ||
  v === 'free_text' ||
  v === 'rating' ||
  v === 'practical';

const isDifficulty = (v: unknown): v is Difficulty =>
  v === 'easy' || v === 'intermediate' || v === 'hard';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rubricOptions(rubric: unknown): string[] {
  if (!isRecord(rubric)) return [];
  const options = rubric['options'];
  if (!Array.isArray(options)) return [];
  return options
    .map((option) => (typeof option === 'string' ? option : ''))
    .map((option) => option.trim())
    .filter(Boolean);
}

function rubricCorrectAnswers(rubric: unknown): string[] {
  if (!isRecord(rubric)) return [];
  const correctAnswers = rubric['correct_answers'];
  if (!Array.isArray(correctAnswers)) return [];
  return correctAnswers
    .map((answer) => (typeof answer === 'string' ? answer : ''))
    .map((answer) => answer.trim())
    .filter(Boolean);
}

function rubricNumber(rubric: unknown, key: string, fallback: number): number {
  if (!isRecord(rubric)) return fallback;
  const value = rubric[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function parseChoiceOptions(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((option) => option.trim())
    .filter(Boolean);
}

@Component({
  selector: 'app-question-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,

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

  readonly formatOptions: { value: QuestionFormat; label: string; hint: string }[] = [
    { value: 'free_text', label: 'Libre', hint: 'Reponse texte avec note manuelle' },
    { value: 'yes_no', label: 'Oui/Non', hint: 'Choix binaire rapide' },
    { value: 'true_false', label: 'Vrai/Faux', hint: 'Correction automatique binaire' },
    { value: 'rating', label: 'Note', hint: 'Notation directe par points' },
    { value: 'mcq', label: 'QCM', hint: 'Choix depuis une liste' },
    { value: 'practical', label: 'Pratique', hint: 'Observation avec grille' },
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
    choice_options_text: this.fb.nonNullable.control(''),
    correct_answers_text: this.fb.nonNullable.control(''),
    rating_min: this.fb.nonNullable.control(0, [Validators.min(0)]),
    rating_max: this.fb.nonNullable.control(10, [Validators.min(1)]),

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
    this.clearRequiredError(this.form.controls.choice_options_text);
    this.clearRequiredError(this.form.controls.correct_answers_text);
    if (fmt === 'true_false' && !this.form.controls.correct_answers_text.value.trim()) {
      this.form.controls.correct_answers_text.setValue('Vrai');
    }
    if (fmt === 'yes_no' && !this.form.controls.correct_answers_text.value.trim()) {
      this.form.controls.correct_answers_text.setValue('Oui');
    }
  }

  choiceOptions(): string[] {
    return parseChoiceOptions(this.form.controls.choice_options_text.value);
  }

  selectedCorrectAnswers(): string[] {
    return parseChoiceOptions(this.form.controls.correct_answers_text.value);
  }

  isCorrectAnswer(option: string): boolean {
    return this.selectedCorrectAnswers().includes(option);
  }

  toggleCorrectAnswer(option: string, checked: boolean): void {
    const cleanOption = option.trim();
    if (!cleanOption) return;

    const selected = new Set(this.selectedCorrectAnswers());
    if (checked) {
      selected.add(cleanOption);
    } else {
      selected.delete(cleanOption);
    }
    this.form.controls.correct_answers_text.setValue([...selected].join('\n'));
    this.clearRequiredError(this.form.controls.correct_answers_text);
  }

  setSingleCorrectAnswer(answer: string): void {
    this.form.controls.correct_answers_text.setValue((answer ?? '').trim());
    this.clearRequiredError(this.form.controls.correct_answers_text);
  }

  save(): void {
    if (!this.canSubmit()) {
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

  saveAndAddAnother(): void {
    if (this.isEditMode()) {
      this.save();
      return;
    }

    if (!this.canSubmit()) {
      return;
    }

    this.store.createInPool(this.poolId(), this.toDto(), () => {
      this.form.reset(createDefaultFormValue());
      this.tab.set('editor');
    });
  }

  private toFormValue(row: SkillQuestion) {
    return {
      format: isQuestionFormat(row.format) ? row.format : 'mcq',
      title: row.title ?? '',
      text: row.text ?? '',
      explanation: row.explanation ?? '',
      rubric: (row.rubric && typeof row.rubric === 'object' ? row.rubric : createDefaultRubric()) as Rubric,
      choice_options_text: rubricOptions(row.rubric).join('\n'),
      correct_answers_text: rubricCorrectAnswers(row.rubric).join('\n'),
      rating_min: rubricNumber(row.rubric, 'min', 0),
      rating_max: rubricNumber(row.rubric, 'max', row.points ?? 10),

      is_mandatory: !!row.is_mandatory,

      points: typeof row.points === 'number' ? row.points : 10,
      difficulty: isDifficulty(row.difficulty) ? row.difficulty : 'intermediate',
      order: typeof row.order === 'number' ? row.order : 0,
    };
  }

  private toDto(): SkillQuestionUpsertDto {
    const format = this.form.controls.format.value;
    return {
      format,
      title: this.form.controls.title.value.trim(),
      text: this.form.controls.text.value.trim(),
      explanation: this.explanationForFormat(format),
      rubric: this.rubricForFormat(format),

      is_mandatory: this.form.controls.is_mandatory.value,

      points: format === 'rating' ? this.form.controls.rating_max.value : this.form.controls.points.value,
      difficulty: this.form.controls.difficulty.value,
      order: this.form.controls.order.value,
    };
  }

  private rubricForFormat(format: QuestionFormat): Rubric {
    const current = this.form.controls.rubric.value ?? createDefaultRubric();

    if (format === 'mcq') {
      const options = parseChoiceOptions(this.form.controls.choice_options_text.value);
      const correctAnswers = this.correctAnswersForCurrentOptions(options);
      return options.length > 0 ? { options, correct_answers: correctAnswers } : current;
    }

    if (format === 'free_text') {
      return {
        scoring: 'manual',
        expected_answer: this.form.controls.explanation.value.trim(),
      };
    }

    if (format === 'yes_no') {
      return { options: ['Oui', 'Non'], correct_answers: this.selectedCorrectAnswers() };
    }

    if (format === 'true_false') {
      return { options: ['Vrai', 'Faux'], correct_answers: this.selectedCorrectAnswers() };
    }

    if (format === 'rating') {
      return {
        scoring: 'rating',
        min: this.form.controls.rating_min.value,
        max: this.form.controls.rating_max.value,
      };
    }

    if (format === 'practical') {
      return { scoring: 'practical' };
    }

    return current;
  }

  private explanationForFormat(format: QuestionFormat): string {
    if (format === 'mcq' || format === 'yes_no' || format === 'true_false') {
      return this.selectedCorrectAnswers().join('; ');
    }
    return this.form.controls.explanation.value.trim();
  }

  private correctAnswersForCurrentOptions(options: string[]): string[] {
    const optionSet = new Set(options);
    return this.selectedCorrectAnswers().filter((answer) => optionSet.has(answer));
  }

  private canSubmit(): boolean {
    this.applyFormatSpecificValidation();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return false;
    }

    return true;
  }

  private applyFormatSpecificValidation(): void {
    const format = this.form.controls.format.value;
    const choiceOptions = this.form.controls.choice_options_text;
    const correctAnswers = this.form.controls.correct_answers_text;

    this.clearRequiredError(choiceOptions);
    this.clearRequiredError(correctAnswers);

    if (format === 'mcq') {
      const options = parseChoiceOptions(choiceOptions.value);
      if (options.length === 0) {
        this.setRequiredError(choiceOptions);
      }

      if (this.correctAnswersForCurrentOptions(options).length === 0) {
        this.setRequiredError(correctAnswers);
      }
      return;
    }

    if ((format === 'yes_no' || format === 'true_false') && this.selectedCorrectAnswers().length === 0) {
      this.setRequiredError(correctAnswers);
    }
  }

  private setRequiredError(control: AbstractControl): void {
    control.setErrors({ ...(control.errors ?? {}), required: true });
    control.markAsTouched();
  }

  private clearRequiredError(control: AbstractControl): void {
    const errors = control.errors;
    if (!errors?.['required']) {
      return;
    }

    const { required: _required, ...remaining } = errors;
    void _required;
    control.setErrors(Object.keys(remaining).length > 0 ? remaining : null);
  }
}
