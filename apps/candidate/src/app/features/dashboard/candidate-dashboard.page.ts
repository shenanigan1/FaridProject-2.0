import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '@core/auth/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-candidate-dashboard-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="ff-app-screen">
      <main class="ff-app-container ff-app-container--compact ff-app-stack">
        <header class="ff-workflow-hero">
        <p class="ff-app-kicker">DriverRecruit</p>
        <h1 class="ff-workflow-hero__title">Bonjour {{ fullName }}</h1>
        <p class="ff-app-subtitle">
          Suivez vos candidatures, vos tests et votre profil candidat.
        </p>
      </header>

      <div class="ff-card-grid">
        <a routerLink="/jobs" class="ff-data-card">
          <span class="ff-detail-label">Offres</span>
          <strong class="ff-row-title ff-u-block ff-u-mt-sm">Voir les postes</strong>
        </a>
        <a routerLink="/applications" class="ff-data-card">
          <span class="ff-detail-label">Candidatures</span>
          <strong class="ff-row-title ff-u-block ff-u-mt-sm">Suivre le statut</strong>
        </a>
        <a routerLink="/tests" class="ff-data-card">
          <span class="ff-detail-label">Tests</span>
          <strong class="ff-row-title ff-u-block ff-u-mt-sm">Evaluations</strong>
        </a>
      </div>
      </main>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidateDashboardPage {
  private readonly auth = inject(AuthService);
  private readonly candidate = this.auth.getAuthenticatedCandidate();

  get fullName(): string {
    if (!this.candidate) {
      return 'candidat';
    }

    return `${this.candidate.firstName} ${this.candidate.lastName}`.trim() || this.candidate.email;
  }
}
