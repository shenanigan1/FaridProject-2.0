import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { take } from 'rxjs';

import { AuthSessionService } from '@auth/services/auth-session.service';
import { AllowedRole } from '@auth/models/auth.models';

import {
  LucideDynamicIcon,
  LucideDownload,
  LucidePlus,
  LucideBriefcaseBusiness,
  LucideClipboardCheck,
  LucideFileText,
  LucideSettings,
  LucideClipboardList,
  LucideUsers,
  LucideTriangleAlert,
  LucideBuilding2,
  LucideInbox,
  LucideUser,
  LucideBadgeCheck,
  LucideShield,
  LucideTruck,
  LucideHistory,
} from '@lucide/angular';

type DashboardRole = AllowedRole | 'driver';
type RecruitmentCardTone = 'blue' | 'cyan' | 'rose';

type DashboardIcon =
  | typeof LucideDownload
  | typeof LucidePlus
  | typeof LucideBriefcaseBusiness
  | typeof LucideClipboardCheck
  | typeof LucideFileText
  | typeof LucideSettings
  | typeof LucideClipboardList
  | typeof LucideUsers
  | typeof LucideTriangleAlert
  | typeof LucideBuilding2
  | typeof LucideInbox
  | typeof LucideUser
  | typeof LucideBadgeCheck
  | typeof LucideShield
  | typeof LucideTruck
  | typeof LucideHistory;

interface QuickAccessItem {
  label: string;
  route: string | null;
  icon: DashboardIcon;
  enabled: boolean;
  testId: string;
}

interface RecruitmentCard {
  id: string;
  value: string;
  label: string;
  badge: string;
  cta: string | null;
  route: string | null;
  tone: RecruitmentCardTone;
  icon: DashboardIcon;
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

  readonly topIcons = {
    download: LucideDownload,
    plus: LucidePlus,
  } as const;

  readonly isRecruitmentRole = computed(() => {
    const currentRole = this.role();
    return currentRole === 'hr' || currentRole === 'admin' || currentRole === 'director';
  });

  readonly headlineStats = computed(() => {
    if (!this.isRecruitmentRole()) {
      return {
        totalCandidates: '{total_candidates}',
        activeOffers: '{active_offers}',
      };
    }

    return {
      totalCandidates: '428',
      activeOffers: '24',
    };
  });

  readonly recruitmentCards = computed<RecruitmentCard[]>(() => {
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
          icon: LucideBriefcaseBusiness,
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
        icon: LucideBriefcaseBusiness,
      },
      {
        id: 'pending',
        value: '12',
        label: 'EN VALIDATION',
        badge: '+10',
        cta: 'ASSIGNER NOUVEAUX TESTS',
        route: '/tests',
        tone: 'cyan',
        icon: LucideBadgeCheck,
      },
      {
        id: 'alerts',
        value: '08',
        label: 'ALERTES CONTACT',
        badge: 'ACTION REQUISE',
        cta: 'LANCER LA PRIORITÉ',
        route: '/contact',
        tone: 'rose',
        icon: LucideTriangleAlert,
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
            icon: LucideBriefcaseBusiness,
            route: '/jobs',
            enabled: true,
            testId: 'quick-jobs',
          },
          {
            label: 'ASSIGNER TEST',
            icon: LucideClipboardCheck,
            route: '/tests',
            enabled: true,
            testId: 'quick-tests',
          },
          {
            label: 'RAPPORTS',
            icon: LucideFileText,
            route: null,
            enabled: false,
            testId: 'quick-reports',
          },
          {
            label: 'PARAMÈTRES',
            icon: LucideSettings,
            route: null,
            enabled: false,
            testId: 'quick-settings',
          },
        ];

      case 'manager':
        return [
          {
            label: 'Assigned tests',
            icon: LucideClipboardList,
            route: '/tests',
            enabled: true,
            testId: 'quick-assigned-tests',
          },
          {
            label: 'Applicants',
            icon: LucideUsers,
            route: '/positions',
            enabled: true,
            testId: 'quick-applicants',
          },
          {
            label: 'Alerts',
            icon: LucideTriangleAlert,
            route: null,
            enabled: false,
            testId: 'quick-alerts',
          },
          {
            label: 'Local hub',
            icon: LucideBuilding2,
            route: null,
            enabled: false,
            testId: 'quick-local-hub',
          },
        ];

      case 'candidate':
        return [
          {
            label: 'My tests',
            icon: LucideClipboardCheck,
            route: null,
            enabled: false,
            testId: 'quick-my-tests',
          },
          {
            label: 'Applications',
            icon: LucideInbox,
            route: null,
            enabled: false,
            testId: 'quick-applications',
          },
          {
            label: 'Recommended jobs',
            icon: LucideBriefcaseBusiness,
            route: '/positions',
            enabled: true,
            testId: 'quick-jobs',
          },
          {
            label: 'Profile',
            icon: LucideUser,
            route: null,
            enabled: false,
            testId: 'quick-profile',
          },
        ];

      case 'driver':
      case 'employee':
      default:
        return [
          {
            label: 'Certifications',
            icon: LucideBadgeCheck,
            route: null,
            enabled: false,
            testId: 'quick-certifications',
          },
          {
            label: 'Security tests',
            icon: LucideShield,
            route: '/tests',
            enabled: true,
            testId: 'quick-security-tests',
          },
          {
            label: 'Fleet docs',
            icon: LucideTruck,
            route: null,
            enabled: false,
            testId: 'quick-fleet-docs',
          },
          {
            label: 'History',
            icon: LucideHistory,
            route: null,
            enabled: false,
            testId: 'quick-history',
          },
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

    void this.router.navigateByUrl(item.route);
  }

  openRecruitmentCard(route: string | null): void {
    if (!route) {
      return;
    }

    void this.router.navigateByUrl(route);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}