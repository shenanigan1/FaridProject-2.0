import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { AuthModalComponent } from '@core/auth/components/auth-modal/auth-modal.component';
import { AuthService } from '@core/auth/services/auth.service';
import { SessionExpiredService } from '@core/auth/services/session-expired.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    AuthModalComponent,
  ],
  templateUrl: './app.html',
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly sessionExpired = inject(SessionExpiredService);
  private readonly router = inject(Router);

  readonly appTitle = 'FleetFlow Candidate';

  authModalOpen = false;
  sessionExpiredMessage: string | null = null;

  readonly navItems = [
    { label: 'Offres', route: '/jobs' },
    { label: 'Candidatures', route: '/applications' },
    { label: 'Tests', route: '/tests' },
    { label: 'Profil', route: '/profile' },
  ];

  constructor() {
    const hadStoredSession = this.authService.hasStoredSession();
    this.authService.restoreSession().subscribe((candidate) => {
      this.authModalOpen = hadStoredSession && !candidate;
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.requireAuthForProtectedRoute(event.urlAfterRedirects));

    this.sessionExpired.expired$
      .pipe(takeUntilDestroyed())
      .subscribe((message) => {
        this.sessionExpiredMessage = message;
        this.authModalOpen = true;
        void this.router.navigateByUrl('/jobs');
      });
  }

  onProfileClicked(): void {
    if (!this.authService.isAuthenticated()) {
      this.authModalOpen = true;
      return;
    }

    void this.router.navigateByUrl('/profile');
  }

  onAuthSuccess(): void {
    this.authModalOpen = false;
    this.sessionExpiredMessage = null;
    void this.router.navigateByUrl('/dashboard');
  }

  openProtectedRoute(route: string): void {
    if (!this.authService.isAuthenticated()) {
      this.authModalOpen = true;
      return;
    }

    void this.router.navigateByUrl(route);
  }

  onLogoutClicked(): void {
    this.authService.logout();
  }

  get profileInitials(): string {
    const candidate = this.authService.getAuthenticatedCandidate();
    if (!candidate) {
      return 'GU';
    }

    return `${candidate.firstName.charAt(0)}${candidate.lastName.charAt(0)}`.toUpperCase();
  }

  get profileFullName(): string {
    const candidate = this.authService.getAuthenticatedCandidate();
    if (!candidate) {
      return 'Guest';
    }

    return `${candidate.firstName} ${candidate.lastName}`.trim();
  }

  private requireAuthForProtectedRoute(url: string): void {
    const isProtected =
      url.startsWith('/dashboard') ||
      url.startsWith('/applications') ||
      url.startsWith('/tests') ||
      url.startsWith('/profile');

    if (!isProtected || this.authService.isAuthenticated()) {
      return;
    }

    this.authModalOpen = true;
    void this.router.navigateByUrl('/jobs');
  }
}
