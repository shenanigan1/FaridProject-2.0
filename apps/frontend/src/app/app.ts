import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MenuBarComponent, type MenuItem } from './layout/menu-bar/menu-bar';
import { TopBarComponent } from './layout/top-bar/top-bar';
import { AuthSessionService } from './core/auth/services/auth-session.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import {
  LucideHome,
  LucideUsers,
  LucideBriefcaseBusiness,
  LucideClipboardCheck,
} from '@lucide/angular';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopBarComponent, MenuBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {

  readonly items: MenuItem[] = [
    { label: 'Home', route: '/home', icon: LucideHome },
    { label: 'Contact', route: '/contact', icon: LucideUsers },
    { label: 'Jobs', route: '/jobs', icon: LucideBriefcaseBusiness },
    { label: 'Tests', route: '/tests', icon: LucideClipboardCheck },
  ];

  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  protected readonly title = signal('frontend');
  readonly me = signal<{ role?: string | null; first_name?: string; last_name?: string } | null>(
    null,
  );
  readonly currentUrl = signal(this.router.url);
  readonly showNavigationChrome = computed(() => !this.currentUrl().startsWith('/login'));

  readonly menuItems = computed(() => {
    const role = this.me()?.role;
    const common = [{ label: 'Home', icon: 'home', route: '/dashboard' }];

    if (role === 'hr' || role === 'director') {
      return [
        ...common,
        { label: 'Contact', icon: 'users', route: '/candidates' },
        { label: 'Tests', icon: 'clipboard-check', route: '/tests' },
        { label: 'Jobs', icon: 'briefcase', route: '/positions' },
        { label: 'Templates', icon: 'layout-grid', route: '/templates' },
        { label: 'Pools', icon: 'folder-kanban', route: '/pools' },
      ];
    }

    if (role === 'admin') {
      return [
        { label: 'Home', icon: 'home', route: '/dashboard' },
        { label: 'Contact', icon: 'users', route: '/contact' },
        { label: 'Jobs', icon: 'briefcase', route: '/jobs' },
        { label: 'Tests', icon: 'clipboard-check', route: '/tests' },
      ];
    }

    if (role === 'manager') {
      return [
        ...common,
        { label: 'Tests', icon: 'clipboard-check', route: '/tests' },
        { label: 'Jobs', icon: 'briefcase', route: '/positions' },
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
