import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  ManagerQuestionnaire,
  ManagerQuestionnaireQuestion,
  ManagerQuestionRubric,
  ManagerTestItem,
  ManagerTestsService,
} from '../services/manager-tests.service';

interface RubricEntry {
  label: string;
  value: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringifyRubricValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => stringifyRubricValue(item)).filter(Boolean).join(', ');
  }
  if (isRecord(value)) {
    return Object.entries(value)
      .map(([key, entryValue]) => `${key}: ${stringifyRubricValue(entryValue)}`)
      .filter((entry) => !entry.endsWith(': '))
      .join(', ');
  }
  return '';
}

function optionLabel(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (!isRecord(value)) {
    return '';
  }

  return stringifyRubricValue(value['label'] ?? value['text'] ?? value['value'] ?? value['answer']);
}

@Component({
  standalone: true,
  selector: 'app-manager-test-detail-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './manager-test-detail.page.html',
  styleUrl: './manager-tests.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerTestDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly testsService = inject(ManagerTestsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly test = signal<ManagerTestItem | null>(null);
  readonly questionnaire = signal<ManagerQuestionnaire | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly saving = signal(false);
  readonly questionCount = computed(() => this.questionnaire()?.questions.length ?? 0);
  readonly answeredCount = computed(
    () => this.questionnaire()?.questions.filter((question) => this.isAnswered(question)).length ?? 0,
  );
  readonly progressPercent = computed(() => {
    const total = this.questionCount();
    return total === 0 ? 0 : Math.round((this.answeredCount() / total) * 100);
  });
  readonly totalScore = computed(() =>
    this.questionnaire()?.questions.reduce((sum, question) => sum + (question.score ?? 0), 0) ?? 0,
  );
  readonly maxScore = computed(
    () => this.questionnaire()?.questions.reduce((sum, question) => sum + question.points, 0) ?? 0,
  );

  private readonly evaluationId = Number(this.route.snapshot.paramMap.get('id'));

  constructor() {
    if (!Number.isInteger(this.evaluationId) || this.evaluationId <= 0) {
      this.error.set('Test introuvable.');
      this.isLoading.set(false);
      return;
    }

    this.load();
  }

  updateAnswer(index: number, field: 'candidate_answer' | 'manager_comment', value: string): void {
    this.questionnaire.update((current) => {
      if (!current) return current;
      return {
        ...current,
        questions: current.questions.map((question, questionIndex) =>
          questionIndex === index ? { ...question, [field]: value } : question,
        ),
      };
    });
  }

  updateScore(index: number, value: string): void {
    this.questionnaire.update((current) => {
      if (!current) return current;
      return {
        ...current,
        questions: current.questions.map((question, questionIndex) => {
          if (questionIndex !== index) return question;
          if (value.trim() === '') {
            return { ...question, score: null };
          }
          const score = Number(value);
          if (!Number.isFinite(score)) {
            return { ...question, score: null };
          }
          const boundedScore = Math.min(Math.max(Math.round(score), 0), question.points);
          return { ...question, score: boundedScore };
        }),
      };
    });
  }

  setChoice(index: number, value: string): void {
    this.updateAnswer(index, 'candidate_answer', value);
  }

  saveQuestionnaire(): void {
    const questionnaire = this.questionnaire();
    const test = this.test();
    if (!questionnaire || !test || test.status !== 'in_progress') {
      return;
    }

    const invalidMessage = this.validateQuestionnaire(questionnaire);
    if (invalidMessage) {
      this.message.set(invalidMessage);
      return;
    }

    this.saving.set(true);
    this.message.set(null);

    const answers = questionnaire.questions.map((question) => ({
      question_id: question.question_id,
      candidate_answer: question.candidate_answer,
      manager_comment: question.manager_comment,
      score: question.score,
    }));

    this.testsService
      .saveQuestionnaire(test.id, answers)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.questionnaire.set(saved);
          this.message.set('Questionnaire enregistre.');
          this.saving.set(false);
        },
        error: () => {
          this.message.set('Impossible d enregistrer le questionnaire.');
          this.saving.set(false);
        },
      });
  }

  initials(test: ManagerTestItem): string {
    const source = test.candidateName || test.candidateEmail;
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  isAnswered(question: ManagerQuestionnaireQuestion): boolean {
    return question.candidate_answer.trim().length > 0;
  }

  isQuestionComplete(question: ManagerQuestionnaireQuestion): boolean {
    return this.isAnswered(question) && question.score !== null;
  }

  questionState(question: ManagerQuestionnaireQuestion): 'complete' | 'missing' | 'draft' {
    if (this.isQuestionComplete(question)) return 'complete';
    if (question.is_mandatory && !this.isAnswered(question)) return 'missing';
    return 'draft';
  }

  formatLabel(format: string): string {
    const labels: Record<string, string> = {
      mcq: 'QCM',
      true_false: 'Vrai / Faux',
      practical: 'Pratique',
    };
    return labels[format] ?? format;
  }

  difficultyLabel(difficulty: string): string {
    const labels: Record<string, string> = {
      easy: 'Facile',
      intermediate: 'Intermediaire',
      hard: 'Difficile',
    };
    return labels[difficulty] ?? difficulty;
  }

  choiceOptions(question: ManagerQuestionnaireQuestion): string[] {
    if (question.format === 'true_false') {
      return ['Vrai', 'Faux'];
    }

    const candidates = this.rubricOptionCandidates(question.rubric);
    for (const candidate of candidates) {
      if (!Array.isArray(candidate)) continue;
      const options = candidate.map((option) => optionLabel(option)).filter(Boolean);
      if (options.length > 0) {
        return options;
      }
    }

    return [];
  }

  rubricEntries(question: ManagerQuestionnaireQuestion): RubricEntry[] {
    const rubric = question.rubric;
    if (!isRecord(rubric)) {
      return [];
    }

    return Object.entries(rubric)
      .filter(([key]) => !['options', 'choices', 'answers'].includes(key))
      .map(([key, value]) => ({ label: key, value: stringifyRubricValue(value) }))
      .filter((entry) => entry.value.length > 0);
  }

  private load(): void {
    forkJoin({
      test: this.testsService.getAssignedTest(this.evaluationId),
      questionnaire: this.testsService.getQuestionnaire(this.evaluationId),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ test, questionnaire }) => {
          this.test.set(test);
          this.questionnaire.set(questionnaire);
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger ce test.');
          this.isLoading.set(false);
        },
      });
  }

  private rubricOptionCandidates(rubric: ManagerQuestionRubric): unknown[] {
    if (Array.isArray(rubric)) {
      return [rubric];
    }
    if (!isRecord(rubric)) {
      return [];
    }
    return [rubric['options'], rubric['choices'], rubric['answers']];
  }

  private validateQuestionnaire(questionnaire: ManagerQuestionnaire): string | null {
    const missingQuestion = questionnaire.questions.find(
      (question) => question.is_mandatory && !this.isAnswered(question),
    );
    if (missingQuestion) {
      return `Reponse obligatoire manquante : ${missingQuestion.title || missingQuestion.text}`;
    }

    const invalidScore = questionnaire.questions.find(
      (question) => question.score !== null && (question.score < 0 || question.score > question.points),
    );
    if (invalidScore) {
      return `Score invalide : ${invalidScore.title || invalidScore.text}`;
    }

    return null;
  }
}
