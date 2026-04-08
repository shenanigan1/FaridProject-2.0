import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { AuthModalComponent } from '@core/auth/components/auth-modal/auth-modal.component';
import { AuthService } from '@core/auth/services/auth.service';
import { JobOfferDetailCardComponent } from '@jobs/components/job-offer-detail-card/job-offer-detail-card.component';
import { JobOffer } from '@jobs/models/job-offer.model';
import { JobApplicationService } from '@jobs/services/job-application.service';
import { JobPublicApiService } from '@jobs/services/job-public-api.service';
import { UiAlertComponent } from '@lib-ui/alert/alert.component';
import { UiBadgeComponent } from '@lib-ui/badge/badge.component';
import { UiButtonPrimaryComponent } from '@lib-ui/button-primary/button-primary.component';
import { UiButtonSecondaryComponent } from '@lib-ui/button-secondary/button-secondary.component';
import { UiCardComponent } from '@lib-ui/card/card.component';
import { UiEmptyStateComponent } from '@lib-ui/empty-state/empty-state.component';
import { UiIconButtonComponent } from '@lib-ui/icon-button/icon-button.component';
import { UiModalComponent } from '@lib-ui/modal/modal.component';
import { UiSkeletonComponent } from '@lib-ui/skeleton/skeleton.component';
import { UiTextareaComponent } from '@lib-ui/textarea/textarea.component';
import { UiTextInputComponent } from '@lib-ui/text-input/text-input.component';

type JobOfferDetailPageState = 'loading' | 'success' | 'not-found' | 'error';

@Component({
  selector: 'app-job-offer-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthModalComponent,
    JobOfferDetailCardComponent,
    UiButtonPrimaryComponent,
    UiButtonSecondaryComponent,
    UiBadgeComponent,
    UiAlertComponent,
    UiIconButtonComponent,
    UiCardComponent,
    UiSkeletonComponent,
    UiEmptyStateComponent,
    UiModalComponent,
    UiTextInputComponent,
    UiTextareaComponent,
  ],
  templateUrl: './job-offer-detail.page.html',
})
export class JobOfferDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly jobPublicApiService = inject(JobPublicApiService);
  private readonly jobApplicationService = inject(JobApplicationService);
  private readonly authService = inject(AuthService);

  authModalOpen = false;
  applicationModalOpen = false;
  applicationSubmitted = false;
  applicationSubmitting = false;
  applicationErrorMessage: string | null = null;

  offer: JobOffer | null = null;
  state: JobOfferDetailPageState = 'loading';

  readonly applicationForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    motivation: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  ngOnInit(): void {
    const offerId = this.getOfferIdFromRoute();

    if (offerId === null) {
      this.state = 'not-found';
      return;
    }

    this.loadOffer(offerId);
  }

  onApplyClicked(): void {
    if (!this.authService.isAuthenticated()) {
      this.openAuthModal();
      return;
    }

    this.openApplicationPreviewModal();
  }

  onApplicationSubmitted(): void {
    if (!this.offer) {
      return;
    }

    const currentCandidate = this.authService.getAuthenticatedCandidate();
    if (!currentCandidate) {
      this.applicationErrorMessage = 'Please sign in again before applying.';
      this.authModalOpen = true;
      this.applicationModalOpen = false;
      return;
    }

    this.applicationForm.markAllAsTouched();
    if (this.applicationForm.invalid) {
      return;
    }

    const formValue = this.applicationForm.getRawValue();
    this.applicationSubmitting = true;
    this.applicationErrorMessage = null;

    this.jobApplicationService
      .applyToOffer({
        positionId: this.offer.id,
        candidateId: currentCandidate.candidateId,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phone: formValue.phone,
        motivation: formValue.motivation,
      })
      .subscribe({
        next: () => {
          this.applicationSubmitting = false;
          this.applicationSubmitted = true;
          this.applicationModalOpen = false;
        },
        error: (errorResponse: HttpErrorResponse) => {
          this.applicationSubmitting = false;
          this.applicationErrorMessage =
            errorResponse.status === 400
              ? 'Your application is invalid or already submitted for this offer.'
              : 'Unable to submit your application right now. Please retry.';
        },
      });
  }

  onApplicationModalOpenChanged(isOpen: boolean): void {
    this.applicationModalOpen = isOpen;
    if (!isOpen) {
      this.applicationSubmitting = false;
    }
  }

  private openAuthModal(): void {
    this.authModalOpen = true;
  }

  onAuthSuccess(): void {
    this.authModalOpen = false;
    this.openApplicationPreviewModal();
  }

  private openApplicationPreviewModal(): void {
    const currentCandidate = this.authService.getAuthenticatedCandidate();

    this.applicationForm.patchValue({
      firstName: currentCandidate?.firstName ?? '',
      lastName: currentCandidate?.lastName ?? '',
      email: currentCandidate?.email ?? '',
      phone: currentCandidate?.phone ?? '',
      motivation: '',
    });

    this.applicationErrorMessage = null;
    this.applicationModalOpen = true;
  }

  private getOfferIdFromRoute(): number | null {
    const rawId = this.route.snapshot.paramMap.get('id');

    if (rawId === null) {
      return null;
    }

    const parsedId = Number(rawId);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return null;
    }

    return parsedId;
  }

  private loadOffer(offerId: number): void {
    this.state = 'loading';
    this.offer = null;

    this.jobPublicApiService.getOfferById(offerId).subscribe({
      next: (offer: JobOffer) => {
        this.offer = offer;
        this.state = 'success';
      },
      error: (error: HttpErrorResponse) => {
        this.offer = null;
        this.state = error.status === 404 ? 'not-found' : 'error';
      },
    });
  }

  onBackClicked(): void {
    window.history.back();
  }

  onShareClicked(): void {
    // placeholder for future share implementation
  }

  onRetryClicked(): void {
    const offerId = this.getOfferIdFromRoute();

    if (offerId === null) {
      this.state = 'not-found';
      return;
    }

    this.loadOffer(offerId);
  }

  onSaveClicked(): void {
    // placeholder for future save implementation
  }
}
