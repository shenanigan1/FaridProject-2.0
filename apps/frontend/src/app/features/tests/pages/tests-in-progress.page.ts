import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  EvaluationQuestionnaire,
  InProgressTestItem,
  PositionApplicantsService,
} from '@features/positions/services/position-applicants.service';

@Component({
  standalone: true,
  selector: 'app-tests-in-progress-page',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './tests-in-progress.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestsInProgressPage {
  private readonly applicantsService = inject(PositionApplicantsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchControl = new FormControl('', { nonNullable: true });

  private readonly testsSubject = new BehaviorSubject<InProgressTestItem[]>([]);
  readonly tests$ = this.testsSubject.asObservable();

  readonly filteredTests$ = combineLatest([
    this.tests$,
    this.searchControl.valueChanges.pipe(startWith(this.searchControl.value)),
  ]).pipe(
    map(([testsInProgress, query]) => {
      const normalized = query.trim().toLowerCase();
      if (!normalized) {
        return testsInProgress;
      }

      return testsInProgress.filter((item) => {
        return (
          item.candidateName.toLowerCase().includes(normalized) ||
          item.candidateEmail.toLowerCase().includes(normalized) ||
          item.positionTitle.toLowerCase().includes(normalized)
        );
      });
    }),
  );
  readonly groupedTests$ = this.filteredTests$.pipe(
    map((testsInProgress) => {
      const mapByApplication = new Map<number, InProgressTestItem[]>();
      for (const item of testsInProgress) {
        const existing = mapByApplication.get(item.applicationId) ?? [];
        existing.push(item);
        mapByApplication.set(item.applicationId, existing);
      }

      return Array.from(mapByApplication.entries()).map(([applicationId, items]) => ({
        applicationId,
        candidateName: items[0].candidateName,
        candidateEmail: items[0].candidateEmail,
        positionTitle: items[0].positionTitle,
        evaluations: items,
      }));
    }),
  );

  isLoading = true;
  errorMessage: string | null = null;
  assignmentMessage: string | null = null;
  selectedApplicationId: number | null = null;
  selectedEvaluationId: number | null = null;
  questionnaire: EvaluationQuestionnaire | null = null;
  questionnaireMessage: string | null = null;
  questionnaireSaving = false;

  constructor() {
    this.loadTestsInProgress();
  }

  private loadTestsInProgress(): void {
    this.applicantsService
      .listInProgressTests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (testsInProgress) => {
          this.testsSubject.next(testsInProgress);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load ongoing tests.';
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  assignManager(testItem: InProgressTestItem, managerIdRaw: string): void {
    const managerId = Number(managerIdRaw);
    if (!Number.isInteger(managerId) || managerId <= 0) {
      this.assignmentMessage = 'Please enter a valid manager ID.';
      this.cdr.markForCheck();
      return;
    }

    this.assignmentMessage = null;
    this.applicantsService
      .assignManagerToEvaluation(testItem.evaluationId, managerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.assignmentMessage = `Manager #${managerId} assigned to evaluation #${testItem.evaluationId}.`;
          this.loadTestsInProgress();
          this.cdr.markForCheck();
        },
        error: () => {
          this.assignmentMessage = `Unable to assign manager #${managerId} to evaluation #${testItem.evaluationId}.`;
          this.cdr.markForCheck();
        },
      });
  }

  openApplication(applicationId: number): void {
    this.selectedApplicationId = applicationId;
    this.selectedEvaluationId = null;
    this.questionnaire = null;
    this.questionnaireMessage = null;
  }

  openEvaluation(evaluationId: number): void {
    this.selectedEvaluationId = evaluationId;
    this.questionnaire = null;
    this.questionnaireMessage = null;
    this.applicantsService
      .getEvaluationQuestionnaire(evaluationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (questionnaire) => {
          this.questionnaire = questionnaire;
          this.cdr.markForCheck();
        },
        error: () => {
          this.questionnaireMessage = 'Unable to load template questions.';
          this.cdr.markForCheck();
        },
      });
  }

  updateQuestionAnswer(index: number, value: string): void {
    if (!this.questionnaire) return;
    this.questionnaire.questions[index].candidate_answer = value;
  }

  updateQuestionComment(index: number, value: string): void {
    if (!this.questionnaire) return;
    this.questionnaire.questions[index].manager_comment = value;
  }

  onQuestionAnswerInput(index: number, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) {
      return;
    }
    this.updateQuestionAnswer(index, target.value);
  }

  onQuestionCommentInput(index: number, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) {
      return;
    }
    this.updateQuestionComment(index, target.value);
  }

  saveQuestionnaire(): void {
    if (!this.questionnaire || this.selectedEvaluationId === null) return;

    this.questionnaireSaving = true;
    this.questionnaireMessage = null;
    const answers = this.questionnaire.questions.map((question) => ({
      question_id: question.question_id,
      candidate_answer: question.candidate_answer,
      manager_comment: question.manager_comment,
      score: question.score,
    }));

    this.applicantsService
      .saveEvaluationQuestionnaire(this.selectedEvaluationId, answers)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payload) => {
          this.questionnaire = payload;
          this.questionnaireSaving = false;
          this.questionnaireMessage = 'Questionnaire saved.';
          this.cdr.markForCheck();
        },
        error: () => {
          this.questionnaireSaving = false;
          this.questionnaireMessage = 'Unable to save questionnaire.';
          this.cdr.markForCheck();
        },
      });
  }
}
