import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, take } from 'rxjs';

import {
  DashboardDataService,
  DashboardSnapshot,
} from '@features/dashboard/services/dashboard-data.service';

type ExecutiveMode = 'admin' | 'direction';
type StatAccent = 'blue' | 'green' | 'orange' | 'violet';

interface ApplicationRow {
  id: number;
  candidateName: string;
  positionTitle: string;
  status: string;
  createdAt: string;
}

function formatStatus(status: string): string {
  return status
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (char) => char.toUpperCase());
}

@Component({
  standalone: true,
  selector: 'app-executive-dashboard-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="exec-dashboard">
      <div class="exec-dashboard__inner">
        <header class="exec-hero">
          <div class="exec-hero__copy">
            <p class="exec-kicker">{{ mode() === 'admin' ? 'ADMIN_COMMAND' : 'DIRECTION_CORE' }}</p>
            <h1>{{ mode() === 'admin' ? 'Pilotage FleetFlow' : 'Vue direction' }}</h1>
            <p>Supervision temps reel du recrutement, des tests et des contacts issus de l'API.</p>
            <span class="exec-live-status">
              <span class="exec-live-dot" aria-hidden="true"></span>
              Donnees API connectees
            </span>
          </div>
        </header>

        <section class="exec-stats" aria-label="Indicateurs globaux">
          @for (card of statCards(); track card.label) {
            <article class="exec-stat exec-stat--{{ card.accent }}">
              <span>{{ card.label }}</span>
              <strong>{{ card.value }}</strong>
              <small>{{ card.meta }}</small>
            </article>
          }
        </section>

        <section class="exec-tables" aria-label="Activite administrative">
          <article class="exec-panel" aria-labelledby="recent-title">
            <div class="exec-panel__header">
              <div>
                <p class="exec-kicker">RECENT INFLOW</p>
                <h2 id="recent-title">Flux candidats</h2>
              </div>
            </div>

            @if (recentApplications().length === 0) {
              <p class="exec-empty">Aucun dossier recent.</p>
            } @else {
              <div class="exec-mini-list">
                @for (application of recentApplications(); track application.id) {
                  <div class="exec-mini-row">
                    <span class="exec-mini-row__main">
                      <strong>{{ application.candidateName }}</strong>
                      <small>{{ application.positionTitle }}</small>
                    </span>
                    <span class="exec-mini-row__meta">
                      <small>{{ application.status }}</small>
                      <time [attr.datetime]="application.createdAt">
                        {{ application.createdAt | date: 'dd/MM' }}
                      </time>
                    </span>
                  </div>
                }
              </div>
            }
          </article>

          <article class="exec-panel" aria-labelledby="tests-title">
            <div class="exec-panel__header">
              <div>
                <p class="exec-kicker">TEST OPS</p>
                <h2 id="tests-title">Evaluations en cours</h2>
              </div>
              <a routerLink="/tests" class="exec-link">Voir tout</a>
            </div>

            @if (isLoading()) {
              <p class="exec-empty">Chargement des evaluations...</p>
            } @else if (visibleTests().length === 0) {
              <p class="exec-empty">Aucun test en cours en base.</p>
            } @else {
              <div class="exec-test-list">
                @for (test of visibleTests(); track test.evaluationId) {
                  <a class="exec-test-row" [routerLink]="['/tests', test.evaluationId]">
                    <span class="exec-avatar" aria-hidden="true">{{ initials(test.candidateName) }}</span>
                    <span class="exec-test-row__body">
                      <strong>{{ test.candidateName }}</strong>
                      <small>{{ test.positionTitle }} - {{ test.templateName }}</small>
                    </span>
                    <span class="exec-chip">En cours</span>
                  </a>
                }
              </div>
            }
          </article>
        </section>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }

    .exec-dashboard {
      background:
        radial-gradient(circle at 92% 0%, rgba(74, 142, 255, 0.1), transparent 18rem),
        linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px),
        var(--ff-color-background, #0f141c);
      background-size: auto, 24px 24px, 24px 24px, auto;
      color: var(--ff-text, #f8fbff);
      min-height: 100%;
      padding: 0.85rem;
    }

    .exec-dashboard__inner {
      display: grid;
      gap: 0.75rem;
      margin: 0 auto;
      max-width: 92rem;
      width: 100%;
    }

    .exec-hero,
    .exec-panel,
    .exec-stat {
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.008)),
        var(--ff-color-surface-1, #1a202a);
      border: 1px solid var(--ff-color-border-soft, rgba(135, 157, 190, 0.18));
      box-shadow: var(--ff-shadow-card, 0 20px 48px rgba(0, 0, 0, 0.28)), var(--ff-shadow-inset, inset 0 1px 0 rgba(255, 255, 255, 0.055));
    }

    .exec-hero {
      border-radius: 24px;
      overflow: hidden;
      padding: 0.9rem 1rem;
      position: relative;
    }

    .exec-hero::after {
      background:
        radial-gradient(circle at 10% 0%, rgba(74, 142, 255, 0.18), transparent 18rem),
        linear-gradient(90deg, transparent, rgba(74, 142, 255, 0.16));
      content: '';
      inset: 0;
      pointer-events: none;
      position: absolute;
    }

    .exec-hero__copy,
    .exec-live-status {
      position: relative;
      z-index: 1;
    }

    .exec-kicker {
      color: var(--ff-accent, #4a8eff);
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      line-height: 1.2;
      margin: 0 0 0.32rem;
      text-transform: uppercase;
    }

    .exec-hero h1,
    .exec-panel h2 {
      margin: 0;
      text-shadow: 0 2px 0 rgba(0, 0, 0, 0.45);
    }

    .exec-hero h1 {
      font-size: clamp(1.35rem, 2.2vw, 2rem);
      line-height: 1.02;
    }

    .exec-hero p {
      color: var(--ff-text-muted, #a9b4c6);
      font-size: 0.9rem;
      margin: 0.4rem 0 0;
      max-width: 44rem;
    }

    .exec-live-status {
      align-items: center;
      background: rgba(3, 8, 22, 0.44);
      border: 1px solid rgba(74, 142, 255, 0.28);
      border-radius: 999px;
      color: #cfe0ff;
      display: inline-flex;
      font-size: 0.76rem;
      font-weight: 800;
      gap: 0.6rem;
      margin-top: 0.7rem;
      padding: 0.42rem 0.65rem;
    }

    .exec-live-dot {
      background: #28d17c;
      border-radius: 999px;
      box-shadow: 0 0 0 6px rgba(40, 209, 124, 0.12);
      height: 0.62rem;
      width: 0.62rem;
    }

    .exec-stats,
    .exec-tables {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: 1fr;
    }

    .exec-stat {
      border-radius: var(--ff-radius-card, 18px);
      display: grid;
      gap: 0.2rem;
      min-height: 5.7rem;
      padding: 0.8rem 0.9rem;
      position: relative;
    }

    .exec-stat::before {
      border-radius: 999px;
      content: '';
      height: 0.18rem;
      left: 0.9rem;
      position: absolute;
      right: 0.9rem;
      top: 0;
    }

    .exec-stat--blue::before { background: #4a8eff; }
    .exec-stat--green::before { background: #28d17c; }
    .exec-stat--orange::before { background: #ff9f6e; }
    .exec-stat--violet::before { background: #9ab7ff; }

    .exec-stat span,
    .exec-stat small {
      color: var(--ff-text-muted, #a9b4c6);
      font-size: 0.8rem;
      font-weight: 700;
    }

    .exec-stat span {
      text-transform: uppercase;
    }

    .exec-stat strong {
      font-size: clamp(1.75rem, 3vw, 2.45rem);
      line-height: 0.95;
    }

    .exec-panel {
      border-radius: var(--ff-radius-panel, 23px);
      min-width: 0;
      padding: 0.85rem;
    }

    .exec-panel__header {
      align-items: center;
      display: flex;
      gap: 1rem;
      justify-content: space-between;
      margin-bottom: 0.65rem;
    }

    .exec-panel h2 {
      font-size: 0.98rem;
      line-height: 1.15;
    }

    .exec-link,
    .exec-test-row {
      color: inherit;
      text-decoration: none;
    }

    .exec-link {
      color: var(--ff-accent, #4a8eff);
      font-size: 0.82rem;
      font-weight: 800;
    }

    .exec-empty {
      border: 1px dashed rgba(169, 180, 198, 0.28);
      border-radius: 14px;
      color: var(--ff-text-muted, #a9b4c6);
      margin: 0;
      padding: 0.8rem;
      text-align: center;
    }

    .exec-test-list,
    .exec-mini-list {
      display: grid;
      gap: 0.55rem;
    }

    .exec-test-row,
    .exec-mini-row {
      align-items: center;
      background:
        linear-gradient(90deg, rgba(74, 142, 255, 0.045), transparent 58%),
        #171d27;
      border: 1px solid rgba(135, 157, 190, 0.18);
      border-radius: 16px;
      display: flex;
      gap: 0.65rem;
      justify-content: space-between;
      min-height: 3.5rem;
      padding: 0.62rem 0.7rem;
    }

    .exec-test-row:hover {
      border-color: rgba(74, 142, 255, 0.68);
      transform: translateY(-1px);
    }

    .exec-avatar {
      align-items: center;
      background: rgba(74, 142, 255, 0.22);
      border: 1px solid rgba(74, 142, 255, 0.44);
      border-radius: 13px;
      color: #cfe0ff;
      display: inline-flex;
      flex: 0 0 2.25rem;
      font-weight: 900;
      height: 2.25rem;
      justify-content: center;
    }

    .exec-test-row__body,
    .exec-mini-row span {
      min-width: 0;
    }

    .exec-test-row strong,
    .exec-mini-row strong {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .exec-test-row small,
    .exec-mini-row small,
    .exec-mini-row time {
      color: var(--ff-text-muted, #a9b4c6);
      display: block;
      font-size: 0.78rem;
      margin-top: 0.1rem;
    }

    .exec-chip {
      background: rgba(74, 142, 255, 0.22);
      border: 1px solid rgba(74, 142, 255, 0.38);
      border-radius: 999px;
      color: #cfe0ff;
      flex: 0 0 auto;
      font-size: 0.72rem;
      font-weight: 850;
      padding: 0.28rem 0.55rem;
    }

    .exec-mini-row {
      align-items: start;
    }

    .exec-mini-row__meta {
      flex: 0 0 auto;
      text-align: right;
    }

    @media (min-width: 720px) {
      .exec-dashboard {
        padding: 0.95rem 1.1rem;
      }

      .exec-stats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (min-width: 1024px) {
      .exec-dashboard {
        min-height: calc(100dvh - 3.6rem);
      }

      .exec-stats {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .exec-tables {
        align-items: start;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 720px) {
      .exec-test-row {
        align-items: flex-start;
      }

      .exec-chip {
        display: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutiveDashboardPage {
  private readonly route = inject(ActivatedRoute);
  private readonly dashboardData = inject(DashboardDataService);

  readonly mode = signal<ExecutiveMode>(
    this.route.snapshot.data['mode'] === 'direction' ? 'direction' : 'admin',
  );
  readonly isLoading = signal(true);
  readonly snapshot = signal<DashboardSnapshot>({
    positions: [],
    candidates: [],
    applications: [],
    inProgressTests: [],
  });

  readonly statCards = computed(() => {
    const snapshot = this.snapshot();
    const activePositions = snapshot.positions.filter((position) => position.is_active !== false).length;
    const activeCandidates = snapshot.candidates.filter((candidate) => candidate.status !== 'archived').length;

    return [
      {
        accent: 'blue' as StatAccent,
        label: 'Postes ouverts',
        value: String(activePositions),
        meta: 'positions actives',
      },
      {
        accent: 'green' as StatAccent,
        label: 'Candidatures',
        value: String(snapshot.applications.length),
        meta: 'dossiers actifs',
      },
      {
        accent: 'violet' as StatAccent,
        label: 'Talents actifs',
        value: String(activeCandidates),
        meta: 'contacts candidats',
      },
      {
        accent: 'orange' as StatAccent,
        label: 'Tests en cours',
        value: String(snapshot.inProgressTests.length),
        meta: 'evaluations ouvertes',
      },
    ];
  });

  readonly recentApplications = computed<ApplicationRow[]>(() =>
    [...this.snapshot().applications]
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .slice(0, 5)
      .map((application) => ({
        id: application.id,
        candidateName: this.candidateName(application.candidate),
        positionTitle: this.positionTitle(application.position),
        status: formatStatus(application.status || 'unknown'),
        createdAt: application.created_at,
      })),
  );

  readonly visibleTests = computed(() => this.snapshot().inProgressTests.slice(0, 5));

  constructor() {
    this.dashboardData
      .loadRecruitmentSnapshot()
      .pipe(
        take(1),
        catchError(() => of(this.snapshot())),
      )
      .subscribe((snapshot) => {
        this.snapshot.set(snapshot);
        this.isLoading.set(false);
      });
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'FF';
  }

  private candidateName(candidateId: number): string {
    const candidate = this.snapshot().candidates.find((item) => item.id === candidateId);
    if (!candidate) {
      return `Candidat #${candidateId}`;
    }

    return [candidate.user.first_name, candidate.user.last_name].filter(Boolean).join(' ')
      || candidate.user.email
      || `Candidat #${candidateId}`;
  }

  private positionTitle(positionId: number): string {
    return this.snapshot().positions.find((position) => position.id === positionId)?.title
      || `Poste #${positionId}`;
  }
}
