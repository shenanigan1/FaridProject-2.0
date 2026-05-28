import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { MeResponse } from '@auth/models/auth.models';
import { AuthSessionService } from '@auth/services/auth-session.service';
import { ManagerTestItem, ManagerTestsService } from '@features/manager/services/manager-tests.service';

@Component({
  standalone: true,
  selector: 'app-employee-dashboard-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="ff-app-screen">
      <div class="ff-app-container ff-app-stack">
        <header class="ff-page-header">
          <p class="ff-kicker">EMPLOYEE PORTAL</p>
          <h1 class="ff-page-title">Bonjour {{ displayName() }}</h1>
          <p class="ff-app-subtitle">Profil et évaluations liées à votre compte.</p>
        </header>

        <section class="ff-grid ff-grid--cards" aria-label="Résumé employé">
          <article class="ff-app-panel ff-stat-card">
            <span class="ff-kicker">Tests accessibles</span>
            <strong class="ff-score-value">{{ tests().length }}</strong>
            <span class="ff-muted">issus de l'API évaluations</span>
          </article>

          <article class="ff-app-panel ff-stat-card">
            <span class="ff-kicker">Profil</span>
            <strong class="ff-profile-email">{{ me()?.email ?? 'Non connecté' }}</strong>
            <a routerLink="/profile" class="ff-btn ff-btn-secondary">Modifier le profil</a>
          </article>
        </section>

        <section class="ff-app-panel ff-app-stack" aria-labelledby="employee-tests-title">
          <div class="ff-section-header">
            <div>
              <p class="ff-kicker">EVALUATIONS</p>
              <h2 id="employee-tests-title" class="ff-section-title">Tests et historique</h2>
            </div>
          </div>

          @if (isLoading()) {
            <p class="ff-empty">Chargement des évaluations...</p>
          } @else if (tests().length === 0) {
            <p class="ff-empty">Aucun test n'est rattaché à votre compte pour le moment.</p>
          } @else {
            <div class="ff-list">
              @for (test of tests(); track test.id) {
                <article class="ff-list-row">
                  <span>
                    <strong>{{ test.templateName }}</strong>
                    <small>{{ test.positionTitle || 'Poste non renseigné' }}</small>
                  </span>
                  <span class="ff-chip" [class.ff-chip-success]="test.status !== 'in_progress'">
                    {{ test.status }}
                  </span>
                </article>
              }
            </div>
          }
        </section>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .ff-score-value { color: var(--ff-text, #f8fbff); font-size: clamp(2.5rem, 6vw, 4rem); line-height: 1; }
    .ff-profile-email { color: var(--ff-text, #f8fbff); font-size: 1.125rem; overflow-wrap: anywhere; }
    .ff-stat-card { min-height: 9rem; justify-content: space-between; }
    .ff-list { display: grid; gap: 0.75rem; }
    .ff-list-row { align-items: center; border: 1px solid var(--ff-border, #3b4352); border-radius: 16px; display: flex; gap: 1rem; justify-content: space-between; padding: 1rem; }
    .ff-list-row small { color: var(--ff-text-muted, #a9b4c6); display: block; margin-top: 0.25rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeDashboardPage {
  private readonly session = inject(AuthSessionService);
  private readonly testsService = inject(ManagerTestsService);

  readonly me = signal<MeResponse | null>(null);
  readonly tests = signal<ManagerTestItem[]>([]);
  readonly isLoading = signal(true);

  readonly displayName = computed(() => {
    const me = this.me();
    return `${me?.first_name ?? ''} ${me?.last_name ?? ''}`.trim() || me?.email || '';
  });

  constructor() {
    forkJoin({
      me: this.session.loadMeOnce(),
      tests: this.testsService.listAssignedTests(),
    })
      .pipe(catchError(() => of({ me: null, tests: [] as ManagerTestItem[] })))
      .subscribe(({ me, tests }) => {
        this.me.set(me);
        this.tests.set(tests);
        this.isLoading.set(false);
      });
  }
}
