import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuBarComponent } from './layout/menu-bar/menu-bar';
import { TopBarComponent } from './layout/top-bar/top-bar';
import { AuthSessionService } from './core/auth/services/auth-session.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopBarComponent, MenuBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly session = inject(AuthSessionService);
  protected readonly title = signal('frontend');
  readonly me = signal<{ role?: string | null } | null>(null);

  readonly menuItems = computed(() => {
    const base = [
      { label: 'Dashboard', icon: '📊', route: '/dashboard' },
      { label: 'Candidates', icon: '👥', route: '/candidates' },
      { label: 'Tests', icon: '🧪', route: '/tests' },
      { label: 'Templates', icon: '📐', route: '/templates' },
      { label: 'Positions', icon: '📋', route: '/positions' },
      { label: 'Pools', icon: '🗂️', route: '/pools' },
    ];
    if (this.me()?.role === 'admin') {
      return [...base, { label: 'Roles', icon: '🛡️', route: '/roles' }];
    }
    return base;
  });

  constructor() {
    this.session
      .loadMeOnce()
      .pipe(takeUntilDestroyed())
      .subscribe((me) => this.me.set(me));
  }
}
