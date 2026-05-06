import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  styleUrl: './position-applicants.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionApplicantsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly applicantsService = inject(PositionApplicantsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly positionId = Number(this.route.snapshot.paramMap.get('id'));
  readonly searchControl = new FormControl('', { nonNullable: true });

  private readonly applicantsSubject = new BehaviorSubject<PositionApplicant[]>([]);
  readonly applicants$ = this.applicantsSubject.asObservable();
  readonly launchingByApplication = new BehaviorSubject<Record<number, boolean>>({});
  readonly rejectingByApplication = new BehaviorSubject<Record<number, boolean>>({});

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
  launchMessage: string | null = null;

  constructor() {
    this.loadApplicants();
  }

  private loadApplicants(): void {
    if (!Number.isInteger(this.positionId) || this.positionId <= 0) {
      this.errorMessage = 'Invalid position identifier.';
      this.isLoading = false;
      return;
    }

    this.applicantsService
      .listByPosition(this.positionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
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

  launchTest(applicant: PositionApplicant): void {
    if (applicant.ongoingTestsCount > 0) {
      this.launchMessage = `${applicant.fullName} already has an ongoing test.`;
      this.cdr.markForCheck();
      return;
    }

    this.launchMessage = null;
    void this.router.navigate(['/tests/relaunch', applicant.candidateId], {
      queryParams: { applicationId: applicant.applicationId },
    });
  }

  completedTestsQuery(applicant: PositionApplicant): {
    q: string;
    status: 'done';
    applicationId: number;
  } {
    return {
      q: applicant.email || applicant.fullName,
      status: 'done',
      applicationId: applicant.applicationId,
    };
  }

  rejectApplicant(applicant: PositionApplicant): void {
    this.launchMessage = null;
    this.setRejecting(applicant.applicationId, true);
    this.applicantsService
      .rejectApplication(applicant.applicationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.launchMessage = `${applicant.fullName} has been rejected.`;
          this.loadApplicants();
          this.setRejecting(applicant.applicationId, false);
        },
        error: () => {
          this.launchMessage = `Unable to reject ${applicant.fullName}.`;
          this.setRejecting(applicant.applicationId, false);
          this.cdr.markForCheck();
        },
      });
  }

  isLaunching(applicationId: number): boolean {
    return this.launchingByApplication.value[applicationId] ?? false;
  }

  isRejecting(applicationId: number): boolean {
    return this.rejectingByApplication.value[applicationId] ?? false;
  }

  private setLaunching(applicationId: number, value: boolean): void {
    const next = {
      ...this.launchingByApplication.value,
      [applicationId]: value,
    };
    this.launchingByApplication.next(next);
    this.cdr.markForCheck();
  }

  private setRejecting(applicationId: number, value: boolean): void {
    const next = {
      ...this.rejectingByApplication.value,
      [applicationId]: value,
    };
    this.rejectingByApplication.next(next);
    this.cdr.markForCheck();
  }
}
