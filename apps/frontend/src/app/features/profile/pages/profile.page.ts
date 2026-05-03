import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthSessionService } from '@core/auth/services/auth-session.service';
import { MeResponse } from '@auth/models/auth.models';

@Component({
  standalone: true,
  selector: 'app-profile-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="ff-app-screen">
      <div class="ff-app-container ff-app-stack max-w-2xl">
        <header class="ff-app-header">
          <div>
            <p class="ff-app-kicker">Account</p>
            <h1 class="ff-app-title">Profile</h1>
            <p class="ff-app-subtitle">Connected user details from the backend session.</p>
          </div>

          <a routerLink="/dashboard" class="ff-control ff-inline-actions">Back to dashboard</a>
        </header>

        @if (isLoading()) {
          <div class="ff-app-panel">
            <p class="ff-muted">Loading profile...</p>
          </div>
        } @else if (error()) {
          <div class="ff-alert-inline">{{ error() }}</div>
        } @else if (me(); as user) {
          <div class="ff-app-panel">
            <dl class="grid gap-4 sm:grid-cols-2">
              @if (fullName(user)) {
                <div class="ff-data-card">
                  <dt class="ff-app-kicker">Name</dt>
                  <dd class="ff-row-title mt-2">{{ fullName(user) }}</dd>
                </div>
              }

              <div class="ff-data-card">
                <dt class="ff-app-kicker">Email</dt>
                <dd class="ff-row-title mt-2">{{ user.email }}</dd>
              </div>

              @if (user.role) {
                <div class="ff-data-card">
                  <dt class="ff-app-kicker">Role</dt>
                  <dd class="ff-row-title mt-2">{{ user.role }}</dd>
                </div>
              }
            </dl>
          </div>
        } @else {
          <div class="ff-empty">No authenticated profile returned by the backend.</div>
        }
      </div>
    </section>
  `,
})
export class ProfilePage {
  private readonly auth = inject(AuthSessionService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly me = signal<MeResponse | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.auth
      .loadMeOnce()
      .pipe(
        catchError(() => {
          this.error.set('Unable to load the authenticated profile.');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((me) => {
        this.me.set(me);
        this.isLoading.set(false);
      });
  }

  protected fullName(user: MeResponse): string {
    return [user.first_name, user.last_name].filter(Boolean).join(' ');
  }
}
