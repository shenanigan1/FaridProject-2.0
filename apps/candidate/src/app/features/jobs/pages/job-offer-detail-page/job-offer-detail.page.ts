import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { JobOfferDetailCardComponent } from '@jobs/components/job-offer-detail-card/job-offer-detail-card.component';
import { JobOffer } from '@jobs/models/job-offer.model';
import { JobPublicApiService } from '@jobs/services/job-public-api.service';
import { UiButtonPrimaryComponent } from '@lib-ui/button-primary/button-primary.component';
import { UiButtonSecondaryComponent } from '@lib-ui/button-secondary/button-secondary.component';
import { UiBadgeComponent } from '@lib-ui/badge/badge.component';
import { UiAlertComponent } from '@lib-ui/alert/alert.component';
import { UiIconButtonComponent } from '@lib-ui/icon-button/icon-button.component';
import { UiCardComponent } from '@lib-ui/card/card.component';
import { UiSkeletonComponent } from '@lib-ui/skeleton/skeleton.component';
import { UiEmptyStateComponent } from '@lib-ui/empty-state/empty-state.component';
import { AuthService } from '@core/auth/services/auth.service';
import { AuthModalComponent } from '@core/auth/components/auth-modal/auth-modal.component';

type JobOfferDetailPageState = 'loading' | 'success' | 'not-found' | 'error';

@Component({
  selector: 'app-job-offer-detail-page',
  standalone: true,
  imports: [
    CommonModule,
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
  ],
  templateUrl: './job-offer-detail.page.html',
})
export class JobOfferDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly jobPublicApiService = inject(JobPublicApiService);
  private readonly authService = inject(AuthService);

  authModalOpen = false;
  offer: JobOffer | null = null;
  state: JobOfferDetailPageState = 'loading';

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


  private openAuthModal(): void {
    this.authModalOpen = true;
  }

  onAuthSuccess(): void {
    this.authModalOpen = false;

    // 🔥 KEY UX: resume flow
    this.openApplicationPreviewModal();
  }

  private openApplicationPreviewModal(): void {
    // temporary → next step
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
