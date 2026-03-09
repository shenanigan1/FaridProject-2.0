import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { CandidatePortalService } from '../../core/services/candidate-portal.service';

@Component({
  selector: 'app-offer-detail-page',
  templateUrl: './offer-detail.page.html',
  styleUrl: './offer-detail.page.scss',
})
export class OfferDetailPage {
  readonly offerId = input.required<number>();

  private readonly portalService = inject(CandidatePortalService);
  private readonly router = inject(Router);

  feedbackMessage = '';

  readonly offer = computed(() => this.portalService.getOfferById(this.offerId()));

  async apply(): Promise<void> {
    const result = await this.portalService.applyToOffer(
      this.offerId(),
      'Je candidate via la plateforme candidat.',
    );

    if (result === 'auth_required') {
      this.feedbackMessage = 'Veuillez créer un compte et vous connecter avant de postuler.';
      this.router.navigateByUrl('/account');
      return;
    }

    if (result === 'duplicate') {
      this.feedbackMessage = 'Vous avez déjà postulé à cette offre.';
      return;
    }

    if (result === 'applied') {
      this.feedbackMessage = 'Votre candidature a bien été envoyée.';
    }
  }
}
