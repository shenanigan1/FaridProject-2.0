import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MenuBarComponent, type MenuItem } from './layout/menu-bar/menu-bar';
import { TopBarComponent } from './layout/top-bar/top-bar';
import { AuthSessionService } from './core/auth/services/auth-session.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { buildAppNavigation } from '@shared/navigation/app-navigation';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopBarComponent, MenuBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  protected readonly title = signal('frontend');

  readonly me = signal<{ role?: string | null; first_name?: string; last_name?: string } | null>(
    null,
  );

  readonly currentUrl = signal(this.router.url);
  readonly showNavigationChrome = computed(() => !this.currentUrl().startsWith('/login'));
  readonly chromeTitle = computed(() => {
    const url = this.currentUrl();

    if (url.startsWith('/jobs') || url.startsWith('/positions')) {
      return 'RecruitTrack';
    }

    if (url.startsWith('/manager')) {
      return 'DriverRecruit';
    }

    if (url.startsWith('/dashboard')) {
      return 'RH_KINETIC_DASHBOARD';
    }

    return 'RecruitTrack';
  });
  readonly userFullName = computed(
    () =>
      `${this.me()?.first_name ?? ''} ${this.me()?.last_name ?? ''}`.trim() || 'User',
  );
  readonly menuItems = computed<MenuItem[]>(() => buildAppNavigation(this.me()?.role));

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));

    this.session.me$
      .pipe(takeUntilDestroyed())
      .subscribe((me) => this.me.set(me));

    this.session
      .loadMeOnce()
      .pipe(takeUntilDestroyed())
      .subscribe();
  }

  onEditProfile(): void {
    void this.router.navigateByUrl('/profile');
  }

  onLogout(): void {
    this.session.logout();
    void this.router.navigateByUrl('/login');
  }
}
