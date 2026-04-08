import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest, map, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  PositionApplicant,
  PositionApplicantsService,
} from '@features/positions/services/position-applicants.service';

@Component({
  standalone: true,
  selector: 'app-position-applicants-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './position-applicants.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionApplicantsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly applicantsService = inject(PositionApplicantsService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly positionId = Number(this.route.snapshot.paramMap.get('id'));
  readonly searchControl = new FormControl('', { nonNullable: true });

  private readonly applicantsSubject = new BehaviorSubject<PositionApplicant[]>([]);
  readonly applicants$ = this.applicantsSubject.asObservable();

  readonly filteredApplicants$ = combineLatest([
    this.applicants$,
    this.searchControl.valueChanges.pipe(startWith(this.searchControl.value)),
  ]).pipe(
    map(([applicants, query]) => {
      const normalized = query.trim().toLowerCase();
      if (!normalized) {
        return applicants;
      }

      return applicants.filter((applicant) => {
        return (
          applicant.fullName.toLowerCase().includes(normalized) ||
          applicant.email.toLowerCase().includes(normalized) ||
          applicant.status.toLowerCase().includes(normalized)
        );
      });
    }),
  );

  isLoading = true;
  errorMessage: string | null = null;
  tests: { id: number; name: string }[] = [];
  selectedTestByApplicationId: Record<number, number | null> = {};
  assigningByApplicationId: Record<number, boolean> = {};
  assignFeedbackByApplicationId: Record<number, string | null> = {};

  constructor() {
    this.loadTests();
    this.loadApplicants();
  }

  onSelectTest(applicationId: number, value: string): void {
    this.selectedTestByApplicationId[applicationId] = value ? Number(value) : null;
  }

  assignTest(applicant: PositionApplicant): void {
    const selectedTemplateId =
      this.selectedTestByApplicationId[applicant.applicationId] ?? applicant.assignedTemplateId;

    if (!selectedTemplateId) {
      this.assignFeedbackByApplicationId[applicant.applicationId] =
        'Please select a test first.';
      return;
    }

    this.assigningByApplicationId[applicant.applicationId] = true;
    this.assignFeedbackByApplicationId[applicant.applicationId] = null;

    this.applicantsService
      .assignTestToApplicant(applicant.applicationId, { templateId: selectedTemplateId })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          const updated = this.applicantsSubject.value.map((item) => {
            if (item.applicationId !== applicant.applicationId) {
              return item;
            }

            const testName =
              this.tests.find((test) => test.id === selectedTemplateId)?.name ?? null;

            return {
              ...item,
              assignedTemplateId: selectedTemplateId,
              assignedTemplateName: testName,
            };
          });

          this.applicantsSubject.next(updated);
          this.assigningByApplicationId[applicant.applicationId] = false;
          this.assignFeedbackByApplicationId[applicant.applicationId] = 'Test assigned.';
          this.cdr.markForCheck();
        },
        error: () => {
          this.assigningByApplicationId[applicant.applicationId] = false;
          this.assignFeedbackByApplicationId[applicant.applicationId] =
            'Unable to assign test.';
          this.cdr.markForCheck();
        },
      });
  }

  private loadApplicants(): void {
    if (!Number.isInteger(this.positionId) || this.positionId <= 0) {
      this.errorMessage = 'Invalid position identifier.';
      this.isLoading = false;
      return;
    }

    this.applicantsService
      .listByPosition(this.positionId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (applicants) => {
          this.applicantsSubject.next(applicants);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load applicants for this position.';
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private loadTests(): void {
    this.applicantsService
      .listTests()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (tests) => {
          this.tests = tests;
          this.cdr.markForCheck();
        },
        error: () => {
          this.tests = [];
          this.cdr.markForCheck();
        },
      });
  }
}
