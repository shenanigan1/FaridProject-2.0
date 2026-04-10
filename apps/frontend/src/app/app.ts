import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MenuBarComponent } from './layout/menu-bar/menu-bar';
import { TopBarComponent } from './layout/top-bar/top-bar';
import { AuthSessionService } from './core/auth/services/auth-session.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

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
  readonly me = signal<{ role?: string | null; first_name?: string; last_name?: string } | null>(null);
  readonly currentUrl = signal(this.router.url);
  readonly showNavigationChrome = computed(() => !this.currentUrl().startsWith('/login'));

  readonly menuItems = computed(() => {
    const role = this.me()?.role;
    const common = [{ label: 'Dashboard', icon: '📊', route: '/dashboard' }];

    if (role === 'hr' || role === 'director') {
      return [
        ...common,
        { label: 'Candidates', icon: '👥', route: '/candidates' },
        { label: 'Tests', icon: '🧪', route: '/tests' },
        { label: 'Templates', icon: '📐', route: '/templates' },
        { label: 'Positions', icon: '📋', route: '/positions' },
        { label: 'Pools', icon: '🗂️', route: '/pools' },
      ];
    }

    if (role === 'admin') {
      return [
        { label: 'Home', icon: '🏠', route: '/dashboard' },
        { label: 'Contact', icon: '👥', route: '/contact' },
        { label: 'Tests', icon: '🧪', route: '/tests' },
        { label: 'Jobs', icon: '📋', route: '/jobs' },
      ];
    }

    if (role === 'manager') {
      return [
        ...common,
        { label: 'Tests', icon: '🧪', route: '/tests' },
        { label: 'Positions', icon: '📋', route: '/positions' },
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
