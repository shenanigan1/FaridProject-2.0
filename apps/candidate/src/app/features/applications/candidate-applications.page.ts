import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { CandidateWorkspaceService } from '@features/candidate-workspace/candidate-workspace.service';

@Component({
  standalone: true,
  selector: 'app-candidate-applications-page',
  imports: [AsyncPipe, DatePipe, RouterLink],
  template: `
    <section class="ff-app-screen">
      <main class="ff-app-container ff-app-container--compact ff-app-stack">
        <header class="ff-workflow-hero">
          <p class="ff-app-kicker">Mes candidatures</p>
          <h1 class="ff-workflow-hero__title">Suivi candidat</h1>
          <p class="ff-app-subtitle">Suivez les candidatures rattachees a votre compte.</p>
        </header>

        @if (errorMessage()) {
          <p class="ff-alert ff-alert-error" role="alert">
            {{ errorMessage() }}
          </p>
        }

        @if (applications$ | async; as applications) {
          @if (applications.length) {
            <div class="ff-list">
              @for (application of applications; track application.id) {
                <article class="ff-data-card">
                  <div class="ff-card-head">
                    <div>
                      <p class="ff-app-kicker">Candidature #{{ application.id }}</p>
                      <h2 class="ff-row-title ff-row-title--lg">{{ application.title }}</h2>
                      @if (application.location) {
                        <p class="ff-row-meta">{{ application.location }}</p>
                      }
                    </div>
                    <span class="ff-status-pill">{{ application.status }}</span>
                  </div>

                  <dl class="ff-detail-grid ff-u-mt-md">
                    <div class="ff-detail-item">
                      <dt class="ff-detail-label">Creee</dt>
                      <dd class="ff-detail-value">
                        {{ application.createdAt | date: 'dd/MM/yyyy' }}
                      </dd>
                    </div>
                    <div class="ff-detail-item">
                      <dt class="ff-detail-label">Mise a jour</dt>
                      <dd class="ff-detail-value">
                        {{ application.updatedAt | date: 'dd/MM/yyyy' }}
                      </dd>
                    </div>
                  </dl>
                </article>
              }
            </div>
          } @else {
            <article class="ff-empty">
              Aucune candidature disponible pour ce compte.
              <a routerLink="/jobs" class="ff-btn ff-btn-secondary ff-u-mt-md">
                Voir les offres publiques
              </a>
            </article>
          }
        }
      </main>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidateApplicationsPage {
  private readonly workspace = inject(CandidateWorkspaceService);

  readonly errorMessage = signal<string | null>(null);
  readonly applications$ = this.workspace.listApplications().pipe(
    catchError(() => {
      this.errorMessage.set('Impossible de charger vos candidatures pour le moment.');
      return of([]);
    }),
  );
}
