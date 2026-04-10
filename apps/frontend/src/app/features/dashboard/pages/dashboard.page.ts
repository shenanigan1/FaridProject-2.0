import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthSessionService } from '@auth/services/auth-session.service';
import { take } from 'rxjs';
import { AllowedRole } from '@auth/models/auth.models';

type DashboardRole = AllowedRole | 'driver';

interface QuickAccessItem {
  label: string;
  route: string | null;
  icon: string;
  enabled: boolean;
  testId: string;
}

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [CommonModule],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage {
  private readonly auth = inject(AuthSessionService);
  private readonly router = inject(Router);
  readonly role = signal<DashboardRole>('employee');

  readonly isRecruitmentRole = computed(() => {
    const currentRole = this.role();
    return currentRole === 'hr' || currentRole === 'admin' || currentRole === 'director';
  });

  readonly headlineStats = computed(() => {
    if (!this.isRecruitmentRole()) {
      return { totalCandidates: '{total_candidates}', activeOffers: '{active_offers}' };
    }
    return { totalCandidates: '428', activeOffers: '24' };
  });

  readonly recruitmentCards = computed(() => {
    if (!this.isRecruitmentRole()) {
      return [
        {
          id: 'openings',
          value: '{openings_count}',
          label: '{openings_label}',
          badge: '{trend_badge}',
          cta: '{openings_cta}',
          route: '/jobs',
          tone: 'blue',
        },
      ];
    }

    return [
      {
        id: 'openings',
        value: '24',
        label: 'POSTES OUVERTS',
        badge: '+12%',
        cta: null,
        route: '/jobs',
        tone: 'blue',
      },
      {
        id: 'pending',
        value: '12',
        label: 'EN VALIDATION',
        badge: '+10',
        cta: 'ASSIGNER NOUVEAUX TESTS',
        route: '/tests',
        tone: 'cyan',
      },
      {
        id: 'alerts',
        value: '08',
        label: 'ALERTES CONTACT',
        badge: 'ACTION REQUISE',
        cta: 'LANCER LA PRIORITÉ',
        route: '/contact',
        tone: 'rose',
      },
    ];
  });

  readonly quickAccess = computed<QuickAccessItem[]>(() => {
    switch (this.role()) {
      case 'hr':
      case 'admin':
      case 'director':
        return [
          {
            label: 'NOUV. OFFRE',
            icon: 'briefcase',
            route: '/jobs',
            enabled: true,
            testId: 'quick-jobs',
          },
          {
            label: 'ASSIGNER TEST',
            icon: 'clipboard-check',
            route: '/tests',
            enabled: true,
            testId: 'quick-tests',
          },
          {
            label: 'RAPPORTS',
            icon: 'file-text',
            route: null,
            enabled: false,
            testId: 'quick-reports',
          }, // TODO: connect reports module when API is ready.
          {
            label: 'PARAMÈTRES',
            icon: 'settings',
            route: null,
            enabled: false,
            testId: 'quick-settings',
          }, // TODO: connect settings module when access rules are finalized.
        ];
      case 'manager':
        return [
          {
            label: 'Assigned tests',
            icon: 'clipboard-list',
            route: '/tests',
            enabled: true,
            testId: 'quick-assigned-tests',
          },
          {
            label: 'Applicants',
            icon: 'users',
            route: '/positions',
            enabled: true,
            testId: 'quick-applicants',
          },
          {
            label: 'Alerts',
            icon: 'alert-triangle',
            route: null,
            enabled: false,
            testId: 'quick-alerts',
          }, // TODO: manager alerts details page
          {
            label: 'Local hub',
            icon: 'building',
            route: null,
            enabled: false,
            testId: 'quick-local-hub',
          }, // TODO: terminal map/details page
        ];
      case 'candidate':
        return [
          {
            label: 'My tests',
            icon: 'clipboard-check',
            route: null,
            enabled: false,
            testId: 'quick-my-tests',
          }, // TODO: candidate tests route in internal frontend
          {
            label: 'Applications',
            icon: 'inbox',
            route: null,
            enabled: false,
            testId: 'quick-applications',
          }, // TODO: candidate applications route in internal frontend
          {
            label: 'Recommended jobs',
            icon: 'briefcase',
            route: '/positions',
            enabled: true,
            testId: 'quick-jobs',
          },
          { label: 'Profile', icon: 'user', route: null, enabled: false, testId: 'quick-profile' }, // TODO: candidate profile/settings route
        ];
      case 'driver':
      case 'employee':
      default:
        return [
          {
            label: 'Certifications',
            icon: 'badge-check',
            route: null,
            enabled: false,
            testId: 'quick-certifications',
          }, // TODO: certifications detailed route
          {
            label: 'Security tests',
            icon: 'shield',
            route: '/tests',
            enabled: true,
            testId: 'quick-security-tests',
          },
          {
            label: 'Fleet docs',
            icon: 'truck',
            route: null,
            enabled: false,
            testId: 'quick-fleet-docs',
          }, // TODO: driver document center
          {
            label: 'History',
            icon: 'history',
            route: null,
            enabled: false,
            testId: 'quick-history',
          }, // TODO: historical reports page
        ];
    }
  });

  constructor() {
    this.auth
      .loadMeOnce()
      .pipe(take(1))
      .subscribe((me) => {
        const normalizedRole = (me?.role ?? 'employee') as DashboardRole;
        this.role.set(normalizedRole);
      });
  }

  openQuickAccess(item: QuickAccessItem): void {
    if (!item.enabled || !item.route) {
      return;
    }
    this.router.navigateByUrl(item.route);
  }

  openRecruitmentCard(route: string | null): void {
    if (!route) {
      return;
    }
    void this.router.navigateByUrl(route);
  }

  quickActionIconPath(icon: string): string {
    const paths: Record<string, string> = {
      briefcase:
        'M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m5 3H3v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9ZM3 10l9 4 9-4',
      'clipboard-check':
        'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a3 3 0 1 0 6 0m-7 9 2 2 4-4',
      'file-text':
        'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 1v5h5M8 13h8M8 17h8M8 9h3',
      settings:
        'm12 15.5 2-1.1 2 .2 1-1.8-1.2-1.6.2-2 1.7-1-1-1.8-2 .2L12 4.5 10 3.4l-2 .2-1 1.8 1.7 1-.2 2-1.2 1.6 1 1.8 2-.2L12 15.5Zm0-2.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z',
      'clipboard-list':
        'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a3 3 0 0 0 6 0M9 12h6M9 16h6',
      users:
        'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M15 7a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6 14v-2a4 4 0 0 0-3-3.87M16.5 3.13a4 4 0 0 1 0 7.75',
      'alert-triangle':
        'M10.3 3.9 1.8 18A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4m0 4h.01',
      building: 'M3 21h18M6 21V7l6-4 6 4v14M9 10h.01M15 10h.01M9 14h.01M15 14h.01',
      inbox: 'M3 12h5l2 3h4l2-3h5M5 3h14a2 2 0 0 1 2 2v14H3V5a2 2 0 0 1 2-2Z',
      user: 'M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
      'badge-check':
        'M9 11 11 13 15 9M12 3l2.5 2 3.5.5.5 3.5L20 12l-1.5 3-.5 3.5-3.5.5L12 21l-2.5-2-3.5-.5-.5-3.5L4 12l1.5-3 .5-3.5 3.5-.5L12 3Z',
      shield: 'M12 2 4 6v6c0 5.5 3.8 9.7 8 10 4.2-.3 8-4.5 8-10V6l-8-4Z',
      truck:
        'M10 17h4M3 5h11v9H3V5Zm11 3h4l3 3v3h-7V8Zm-7 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
      history: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v6l4 2',
    };
    return paths[icon] ?? paths.briefcase;
  }

  cardIconPath(tone: string): string {
    if (tone === 'cyan') {
      return 'M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm-1 5h2v5h-2Zm0 7h2v2h-2Z';
    }
    if (tone === 'rose') {
      return 'M10.3 3.9 1.8 18A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4m0 4h.01';
    }
    return 'M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m5 3H3v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9ZM3 10l9 4 9-4';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
