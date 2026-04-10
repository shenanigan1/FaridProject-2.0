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

  readonly pageTitle = computed(() => {
    switch (this.role()) {
      case 'hr':
      case 'admin':
      case 'director':
        return 'RH Dashboard';
      case 'manager':
        return 'Manager Dashboard';
      case 'candidate':
        return 'Candidate Dashboard';
      case 'driver':
      case 'employee':
      default:
        return 'Employee Dashboard';
    }
  });

  readonly subtitle = computed(() => {
    switch (this.role()) {
      case 'hr':
      case 'admin':
      case 'director':
        return 'Talent pipeline and logistics recruitment overview.';
      case 'manager':
        return 'Local terminal operations and assigned tests overview.';
      case 'candidate':
        return 'Follow your applications and pre-employment tests.';
      case 'driver':
      case 'employee':
      default:
        return 'Central operations hub and compliance monitoring.';
    }
  });

  readonly statCards = computed(() => {
    switch (this.role()) {
      case 'hr':
      case 'admin':
      case 'director':
        return [
          { label: 'Open offers', value: '24', accent: 'blue' },
          { label: 'Pending tests', value: '12', accent: 'cyan' },
          { label: 'Priority calls', value: '08', accent: 'rose' },
        ];
      case 'manager':
        return [
          { label: "Today's assigned tests", value: '03', accent: 'blue' },
          { label: 'Certification alerts', value: '02', accent: 'amber' },
          { label: 'Candidates in process', value: '03', accent: 'emerald' },
        ];
      case 'candidate':
        return [
          { label: 'In progress', value: '04', accent: 'blue' },
          { label: 'Tests to pass', value: '02', accent: 'cyan' },
          { label: 'Interviews', value: '01', accent: 'violet' },
        ];
      case 'driver':
      case 'employee':
      default:
        return [
          { label: 'Global safety score', value: '92', accent: 'blue' },
          { label: 'Active certifications', value: '04', accent: 'emerald' },
          { label: 'Alerts', value: '01', accent: 'amber' },
        ];
    }
  });

  readonly quickAccess = computed<QuickAccessItem[]>(() => {
    switch (this.role()) {
      case 'hr':
      case 'admin':
      case 'director':
        return [
          { label: 'Offers', icon: '📁', route: '/positions', enabled: true },
          { label: 'Candidates', icon: '👥', route: '/candidates', enabled: true },
          { label: 'Tests', icon: '🧪', route: '/tests', enabled: true },
          { label: 'Reports', icon: '📊', route: null, enabled: false }, // TODO: implement reports page
        ];
      case 'manager':
        return [
          { label: 'Assigned tests', icon: '🗂️', route: '/tests', enabled: true },
          { label: 'Applicants', icon: '🧑‍💼', route: '/positions', enabled: true },
          { label: 'Alerts', icon: '⚠️', route: null, enabled: false }, // TODO: manager alerts details page
          { label: 'Local hub', icon: '🏭', route: null, enabled: false }, // TODO: terminal map/details page
        ];
      case 'candidate':
        return [
          { label: 'My tests', icon: '🧪', route: null, enabled: false }, // TODO: candidate tests route in internal frontend
          { label: 'Applications', icon: '📨', route: null, enabled: false }, // TODO: candidate applications route in internal frontend
          { label: 'Recommended jobs', icon: '💼', route: '/positions', enabled: true },
          { label: 'Profile', icon: '🙍', route: null, enabled: false }, // TODO: candidate profile/settings route
        ];
      case 'driver':
      case 'employee':
      default:
        return [
          { label: 'Certifications', icon: '✅', route: null, enabled: false }, // TODO: certifications detailed route
          { label: 'Security tests', icon: '🛡️', route: '/tests', enabled: true },
          { label: 'Fleet docs', icon: '🚚', route: null, enabled: false }, // TODO: driver document center
          { label: 'History', icon: '🕘', route: null, enabled: false }, // TODO: historical reports page
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

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
