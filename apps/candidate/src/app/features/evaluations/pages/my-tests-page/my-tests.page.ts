import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EvaluationSummary } from '@features/evaluations/models/evaluation.model';
import { EvaluationApiService } from '@features/evaluations/services/evaluation-api.service';

@Component({
  selector: 'app-my-tests-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-tests.page.html',
})
export class MyTestsPageComponent implements OnInit {
  private readonly evaluationApiService = inject(EvaluationApiService);

  evaluations: EvaluationSummary[] = [];
  loading = true;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.evaluationApiService.listMyEvaluations().subscribe({
      next: (evaluations) => {
        this.evaluations = evaluations;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to load your evaluations for now.';
      },
    });
  }

  trackByEvaluationId(index: number, evaluation: EvaluationSummary): number {
    return evaluation.id;
  }
}
