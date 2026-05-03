import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AdminAssessment, TestsAdminBffService } from '../services/tests-admin-bff.service';

@Component({
  standalone: true,
  selector: 'app-test-assessment-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './test-assessment.page.html',
  styleUrl: './tests-workflow.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestAssessmentPage {
  private readonly route = inject(ActivatedRoute);
  private readonly bff = inject(TestsAdminBffService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly evaluationId = Number(this.route.snapshot.paramMap.get('id'));

  readonly assessment = signal<AdminAssessment | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  constructor() {
    this.load();
  }

  validateResults(): void {
    if (!Number.isInteger(this.evaluationId) || this.evaluationId <= 0) {
      return;
    }

    this.bff
      .validateAssessment(this.evaluationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.message.set('Resultats valides.'),
        error: () => this.message.set('Impossible de valider les resultats.'),
      });
  }

  private load(): void {
    if (!Number.isInteger(this.evaluationId) || this.evaluationId <= 0) {
      this.error.set('Evaluation introuvable.');
      this.isLoading.set(false);
      return;
    }

    this.bff
      .getAssessment(this.evaluationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (assessment) => {
          this.assessment.set(assessment);
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger cette evaluation.');
          this.isLoading.set(false);
        },
      });
  }
}
