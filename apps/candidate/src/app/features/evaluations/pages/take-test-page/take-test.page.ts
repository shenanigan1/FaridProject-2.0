import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  EvaluationAnswerInput,
  EvaluationQuestion,
  SubmitAnswersResponse,
} from '@features/evaluations/models/evaluation.model';
import { EvaluationApiService } from '@features/evaluations/services/evaluation-api.service';

@Component({
  selector: 'app-take-test-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './take-test.page.html',
})
export class TakeTestPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly evaluationApiService = inject(EvaluationApiService);

  evaluationId: number | null = null;
  questions: EvaluationQuestion[] = [];
  answers: Record<number, number> = {};
  loading = true;
  submitting = false;
  errorMessage: string | null = null;
  submitResult: SubmitAnswersResponse | null = null;

  ngOnInit(): void {
    const evaluationIdParam = this.route.snapshot.paramMap.get('id');
    const parsedId = evaluationIdParam ? Number(evaluationIdParam) : NaN;

    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      this.loading = false;
      this.errorMessage = 'Invalid evaluation identifier.';
      return;
    }

    this.evaluationId = parsedId;
    this.loadQuestions(parsedId);
  }

  onSubmit(): void {
    if (!this.evaluationId || this.submitting) {
      return;
    }

    const payload: EvaluationAnswerInput[] = this.questions
      .filter((question) => Number.isFinite(this.answers[question.evaluation_question_id]))
      .map((question) => ({
        evaluation_question_id: question.evaluation_question_id,
        value: this.answers[question.evaluation_question_id],
      }));

    if (payload.length === 0) {
      this.errorMessage = 'Please answer at least one question before submitting.';
      return;
    }

    this.submitting = true;
    this.errorMessage = null;

    this.evaluationApiService.submitAnswers(this.evaluationId, payload).subscribe({
      next: (result) => {
        this.submitResult = result;
        this.submitting = false;
      },
      error: () => {
        this.submitting = false;
        this.errorMessage = 'Unable to submit your answers at the moment.';
      },
    });
  }

  private loadQuestions(evaluationId: number): void {
    this.evaluationApiService.getEvaluationQuestions(evaluationId).subscribe({
      next: (questions) => {
        this.questions = questions;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to load this test.';
      },
    });
  }
}
