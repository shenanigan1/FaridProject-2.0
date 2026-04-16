import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MenuBarComponent, type MenuItem } from './layout/menu-bar/menu-bar';
import { TopBarComponent } from './layout/top-bar/top-bar';
import { AuthSessionService } from './core/auth/services/auth-session.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { APP_ICONS } from '@shared/icons/app-icons';

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
  readonly icons = APP_ICONS;

  readonly me = signal<{ role?: string | null; first_name?: string; last_name?: string } | null>(
    null,
  );

  readonly currentUrl = signal(this.router.url);
  readonly showNavigationChrome = computed(() => !this.currentUrl().startsWith('/login'));

  readonly menuItems = computed<MenuItem[]>(() => {
    const role = this.me()?.role;

    const common: MenuItem[] = [
      { label: 'Home', icon: this.icons.home, route: '/dashboard' },
    ];

    if (role === 'hr' || role === 'director') {
      return [
        ...common,
        { label: 'Contact', icon: this.icons.users, route: '/candidates' },
        { label: 'Tests', icon: this.icons.clipboard_check, route: '/tests' },
        { label: 'Jobs', icon: this.icons.positions, route: '/positions' },
        { label: 'Dashboard', icon: this.icons.dashboard, route: '/' },
      ];
    }

    if (role === 'admin') {
      return [
        { label: 'Dashboard', icon: this.icons.dashboard, route: '/' },
        { label: 'Contact', icon: this.icons.users, route: '/candidates' },
        { label: 'Tests', icon: this.icons.clipboard_check, route: '/tests' },
        { label: 'Jobs', icon: this.icons.positions, route: '/positions' },
      ];
    }

    if (role === 'manager') {
      return [
        ...common,
        { label: 'Tests', icon: this.icons.clipboard_check, route: '/tests' },
        { label: 'Jobs', icon: this.icons.positions, route: '/positions' },
      ];
    }

    if (role === 'candidate' || role === 'employee') {
      return [...common];
    }

    return [...common];
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));

    this.session
      .loadMeOnce()
      .pipe(takeUntilDestroyed())
      .subscribe((me) => this.me.set(me));
  }

  onEditProfile(): void {
    void this.router.navigateByUrl('/profile');
  }

  onLogout(): void {
    this.session.logout();
    void this.router.navigateByUrl('/login');
  }
}