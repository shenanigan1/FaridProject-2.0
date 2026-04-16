import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthSessionService } from '@auth/services/auth-session.service';
import { take } from 'rxjs';
import { AllowedRole } from '@auth/models/auth.models';
import { APP_ICONS } from '@shared/icons/app-icons';
import { LucideDynamicIcon } from '@lucide/angular';

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
  imports: [CommonModule, LucideDynamicIcon],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage {
  private readonly auth = inject(AuthSessionService);
  private readonly router = inject(Router);
  readonly role = signal<DashboardRole>('employee');

  readonly icons = APP_ICONS;

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
          icon: 'briefcase',
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
        icon: 'briefcase',
      },
      {
        id: 'pending',
        value: '12',
        label: 'EN VALIDATION',
        badge: '+10',
        cta: 'ASSIGNER NOUVEAUX TESTS',
        route: '/tests',
        tone: 'cyan',
        icon: 'clipboard-list',
      },
      {
        id: 'alerts',
        value: '08',
        label: 'ALERTES CONTACT',
        badge: 'ACTION REQUISE',
        cta: 'LANCER LA PRIORITÉ',
        route: '/contact',
        tone: 'rose',
        icon: 'alert-triangle',
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

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
