import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
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

  isLoading = true;
  errorMessage: string | null = null;

  constructor() {
    this.loadTestsInProgress();
  }

  private loadTestsInProgress(): void {
    this.applicantsService
      .listInProgressTests()
      .pipe(takeUntilDestroyed())
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
}
