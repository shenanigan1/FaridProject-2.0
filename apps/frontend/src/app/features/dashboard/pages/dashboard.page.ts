import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, take } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';

import { AuthSessionService } from '@auth/services/auth-session.service';
import { AllowedRole } from '@auth/models/auth.models';
import { APP_ICONS } from '@shared/icons/app-icons';
import { CandidateDto } from '@features/candidates/services/candidates-api.service';
import { PositionDto } from '@features/positions/services/positions-api.service';
import {
  DashboardApplicationDto,
  DashboardDataService,
  DashboardSnapshot,
} from '@features/dashboard/services/dashboard-data.service';

type DashboardRole = AllowedRole | 'driver';
type DashboardTone = 'blue' | 'cyan' | 'neutral';
type DashboardIconKey = keyof typeof APP_ICONS;

interface DashboardStatCard {
  id: string;
  value: string;
  label: string;
  badge: string;
  route: string | null;
  tone: DashboardTone;
  icon: string;
}

interface DashboardActivityItem {
  id: string;
  name: string;
  role: string;
  timeLabel: string;
  route: string | null;
}

interface DashboardMetricItem {
  id: string;
  name: string;
  label: string;
  score: string;
  route: string | null;
}

interface DashboardFeedItem {
  id: string;
  name: string;
  label: string;
  valueLabel: string;
  route: string | null;
}

interface DashboardNavItem {
  label: string;
  icon: string;
  route: string | null;
  enabled: boolean;
  active?: boolean;
  testId: string;
}

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [CommonModule, LucideDynamicIcon],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  private readonly auth = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly dashboardData = inject(DashboardDataService);

  readonly role = signal<DashboardRole>('employee');
  readonly dataLoading = signal(true);
  readonly snapshot = signal<DashboardSnapshot>({
    positions: [],
    candidates: [],
    applications: [],
    inProgressTests: [],
  });
  readonly icons = APP_ICONS;

  readonly isRecruitmentRole = computed(() => {
    const currentRole = this.role();
    return currentRole === 'hr' || currentRole === 'admin' || currentRole === 'director';
  });

  readonly pageTitle = computed(() => (this.isRecruitmentRole() ? 'SYSTEM_CORE' : 'FLEET OPERATIONS'));

  readonly recruitmentCards = computed<DashboardStatCard[]>(() => {
    const snapshot = this.snapshot();
    const activePositions = snapshot.positions.filter((position) => position.is_active !== false).length;
    const totalApplications = snapshot.applications.length;
    const activeCandidates = snapshot.candidates.filter((candidate) => candidate.status !== 'archived').length;

    return [
      {
        id: 'openings',
        value: String(activePositions),
        label: 'ACTIVE REQUISITIONS',
        badge: `${totalApplications} APPLICATIONS`,
        route: '/jobs',
        tone: 'blue',
        icon: 'jobs',
      },
      {
        id: 'pending',
        value: String(activeCandidates),
        label: 'GLOBAL PIPELINE',
        badge: `${snapshot.candidates.length} CANDIDATES`,
        route: '/candidates',
        tone: 'cyan',
        icon: 'clipboard_list',
      },
    ];
  });

  readonly recentInflow = computed<DashboardActivityItem[]>(() => {
    const snapshot = this.snapshot();
    const candidateById = new Map(snapshot.candidates.map((candidate) => [candidate.id, candidate]));
    const positionById = new Map(snapshot.positions.map((position) => [position.id, position]));

    return [...snapshot.applications]
      .sort((left, right) => right.created_at.localeCompare(left.created_at))
      .slice(0, 3)
      .map((application) => this.toActivityItem(application, candidateById, positionById));
  });

  readonly testMetrics = computed<DashboardMetricItem[]>(() =>
    this.snapshot().inProgressTests.slice(0, 3).map((test) => ({
      id: `metric-${test.evaluationId}`,
      name: test.candidateName,
      label: test.positionTitle,
      score: test.templateName,
      route: '/tests',
    })),
  );

  readonly liveFeeds = computed<DashboardFeedItem[]>(() =>
    this.snapshot().inProgressTests.slice(0, 3).map((test) => ({
      id: `feed-${test.evaluationId}`,
      name: test.candidateName,
      label: test.templateName,
      valueLabel: this.formatDate(test.updatedAt),
      route: '/tests',
    })),
  );

  readonly sidebarNav = computed<DashboardNavItem[]>(() => [
    { label: 'Accueil', icon: 'home', route: '/dashboard', enabled: true, active: true, testId: 'sidebar-home' },
    { label: 'Contacts', icon: 'users', route: '/contact', enabled: true, testId: 'sidebar-contact' },
    { label: 'Tests', icon: 'clipboard_check', route: '/tests', enabled: true, testId: 'sidebar-tests' },
    { label: 'Jobs', icon: 'jobs', route: '/jobs', enabled: this.isRecruitmentRole(), testId: 'sidebar-jobs' },
  ]);

  readonly bottomNav = computed<DashboardNavItem[]>(() => [
    { label: 'Home', icon: 'home', route: '/dashboard', enabled: true, active: true, testId: 'nav-home' },
    { label: 'Contacts', icon: 'users', route: '/contact', enabled: true, testId: 'nav-contact' },
    { label: 'Tests', icon: 'clipboard_check', route: '/tests', enabled: true, testId: 'nav-tests' },
    { label: 'Jobs', icon: 'jobs', route: '/jobs', enabled: this.isRecruitmentRole(), testId: 'nav-jobs' },
  ]);

  ngOnInit(): void {
    forkJoin({
      me: this.auth.loadMeOnce().pipe(take(1)),
      snapshot: this.dashboardData.loadRecruitmentSnapshot(),
    }).subscribe({
      next: ({ me, snapshot }) => {
        this.role.set(this.normalizeRole(me?.role));
        this.snapshot.set(snapshot);
        this.dataLoading.set(false);
      },
      error: () => {
        this.dataLoading.set(false);
      },
    });
  }

  getIcon(icon: string) {
    const key = icon as DashboardIconKey;
    return this.icons[key] ?? this.icons.home;
  }

  openRecruitmentCard(route: string | null): void {
    if (!route) {
      return;
    }

    void this.router.navigateByUrl(route);
  }

  openNavItem(item: DashboardNavItem): void {
    if (!item.enabled || !item.route) {
      return;
    }

    void this.router.navigateByUrl(item.route);
  }

  openPanelItem(route: string | null): void {
    if (!route) {
      return;
    }

    void this.router.navigateByUrl(route);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  private normalizeRole(role: AllowedRole | null | undefined): DashboardRole {
    return role ?? 'employee';
  }

  private toActivityItem(
    application: DashboardApplicationDto,
    candidateById: Map<number, CandidateDto>,
    positionById: Map<number, PositionDto>,
  ): DashboardActivityItem {
    const candidate = candidateById.get(application.candidate);
    const position = positionById.get(application.position);
    const fullName = candidate
      ? `${candidate.user.first_name} ${candidate.user.last_name}`.trim()
      : `#${application.candidate}`;

    return {
      id: `inflow-${application.id}`,
      name: fullName || candidate?.user.email || `#${application.candidate}`,
      role: position?.title ?? application.status,
      timeLabel: this.formatDate(application.created_at),
      route: '/contact',
    };
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
    }).format(date);
  }
}
