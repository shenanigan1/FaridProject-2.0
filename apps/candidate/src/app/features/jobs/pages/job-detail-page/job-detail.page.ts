import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap, tap } from 'rxjs';

import { CandidateAuthService } from '@auth/services/candidate-auth.service';
import { JobApplicationModalComponent } from '@jobs/components/job-application-modal/job-application-modal.component';
import { AuthModalComponent } from '@jobs/components/auth-modal/auth-modal.component';
import { JobOffer } from '@jobs/models/job-offer.model';
import { JobApplicationPayload } from '@jobs/models/job-application.model';
import { JobApplicationService } from '@jobs/services/job-application.service';
import { JobPublicApiService } from '@jobs/services/job-public-api.service';

type JobDetailState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; job: JobOffer };

@Component({
  selector: 'app-job-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    CurrencyPipe,
    JobApplicationModalComponent,
    AuthModalComponent,
  ],
  templateUrl: './job-detail.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly jobsApiService = inject(JobPublicApiService);
  private readonly authService = inject(CandidateAuthService);
  private readonly applicationService = inject(JobApplicationService);

  readonly state = signal<JobDetailState>({ kind: 'loading' });
  readonly showAuthModal = signal(false);
  readonly showApplyModal = signal(false);
  readonly feedbackMessage = signal<string | null>(null);
  readonly currentUser = this.authService.currentUser;
  readonly canOpenApplication = computed(() => this.authService.isAuthenticated());
  readonly loadedJob = computed(() => {
    const currentState = this.state();
    return currentState.kind === 'loaded' ? currentState.job : null;
  });

  readonly errorMessage = computed(() => {
    const currentState = this.state();
    return currentState.kind === 'error' ? currentState.message : null;
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('id'))),
        switchMap((id) => {
          if (Number.isNaN(id) || id < 1) {
            return of({
              kind: 'error',
              message: 'Invalid job identifier.',
            } as JobDetailState);
          }

          this.state.set({ kind: 'loading' });
          return this.jobsApiService.getJobOfferById(id).pipe(
            map((job) => ({ kind: 'loaded', job }) as JobDetailState),
            catchError(() =>
              of({
                kind: 'error',
                message: 'Unable to load this job offer right now.',
              } as JobDetailState),
            ),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((nextState) => {
        this.state.set(nextState);
      });
  }

  openApplyFlow(): void {
    this.feedbackMessage.set(null);

    if (this.canOpenApplication()) {
      this.showApplyModal.set(true);
      return;
    }

    this.showAuthModal.set(true);
  }

  onAuthenticated(): void {
    this.showAuthModal.set(false);
    this.showApplyModal.set(true);
  }

  submitApplication(payload: JobApplicationPayload): void {
    const currentState = this.state();
    if (currentState.kind !== 'loaded') {
      return;
    }

    this.applicationService
      .submitApplication(currentState.job.id, payload)
      .pipe(
        tap(() => {
          this.feedbackMessage.set('Votre candidature a bien été envoyée.');
          this.showApplyModal.set(false);
        }),
        catchError(() => {
          this.feedbackMessage.set("Impossible d'envoyer la candidature pour le moment.");
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
