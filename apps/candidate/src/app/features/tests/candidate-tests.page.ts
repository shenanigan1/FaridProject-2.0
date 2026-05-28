import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';

import { CandidateWorkspaceService } from '@features/candidate-workspace/candidate-workspace.service';

@Component({
  standalone: true,
  selector: 'app-candidate-tests-page',
  imports: [AsyncPipe, DatePipe],
  template: `
    <section class="ff-app-screen">
      <main class="ff-app-container ff-app-container--compact ff-app-stack">
        <header class="ff-workflow-hero">
          <p class="ff-app-kicker">Tests candidat</p>
          <h1 class="ff-workflow-hero__title">Evaluations assignees</h1>
          <p class="ff-app-subtitle">Retrouvez vos tests lances par l'equipe recrutement.</p>
        </header>

        @if (errorMessage()) {
          <p class="ff-alert ff-alert-error" role="alert">
            {{ errorMessage() }}
          </p>
        }

        @if (tests$ | async; as tests) {
          @if (tests.length) {
            <div class="ff-list">
              @for (test of tests; track test.id) {
                <article class="ff-data-card">
                  <div class="ff-card-head">
                    <div>
                      <p class="ff-app-kicker">Test #{{ test.id }}</p>
                      <h2 class="ff-row-title ff-row-title--lg">{{ test.title }}</h2>
                      @if (test.positionTitle) {
                        <p class="ff-row-meta">{{ test.positionTitle }}</p>
                      }
                    </div>
                    <span class="ff-status-pill">{{ test.status }}</span>
                  </div>

                  <dl class="ff-detail-grid ff-u-mt-md">
                    <div class="ff-detail-item">
                      <dt class="ff-detail-label">Cree</dt>
                      <dd class="ff-detail-value">{{ test.createdAt | date: 'dd/MM/yyyy' }}</dd>
                    </div>
                    <div class="ff-detail-item">
                      <dt class="ff-detail-label">Complete</dt>
                      <dd class="ff-detail-value">
                        {{ test.completedAt ? (test.completedAt | date: 'dd/MM/yyyy') : 'En cours' }}
                      </dd>
                    </div>
                  </dl>
                </article>
              }
            </div>
          } @else {
            <article class="ff-empty">
              Aucun test candidat disponible pour ce compte.
            </article>
          }
        }
      </main>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidateTestsPage {
  private readonly workspace = inject(CandidateWorkspaceService);

  readonly errorMessage = signal<string | null>(null);
  readonly tests$ = this.workspace.listTests().pipe(
    catchError(() => {
      this.errorMessage.set('Impossible de charger vos tests pour le moment.');
      return of([]);
    }),
  );
}
