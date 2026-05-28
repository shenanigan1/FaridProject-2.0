import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { MeResponse } from '@auth/models/auth.models';
import { AuthService } from '@auth/services/auth.service';
import { AuthSessionService } from '@core/auth/services/auth-session.service';

@Component({
  standalone: true,
  selector: 'app-profile-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="ff-app-screen">
      <div class="ff-app-container ff-app-stack max-w-2xl">
        <header class="ff-app-header">
          <div>
            <p class="ff-app-kicker">Account</p>
            <h1 class="ff-app-title">Profile</h1>
            <p class="ff-app-subtitle">Informations compte issues du backend.</p>
          </div>

          <a routerLink="/" class="ff-btn ff-btn-secondary">Retour</a>
        </header>

        @if (isLoading()) {
          <div class="ff-app-panel">
            <p class="ff-muted">Loading profile...</p>
          </div>
        } @else if (error()) {
          <div class="ff-alert-inline">{{ error() }}</div>
        }

        @if (me(); as user) {
          <article class="ff-data-card ff-app-stack">
            <div class="ff-card-head">
              <div>
                <p class="ff-app-kicker">{{ user.role || 'user' }}</p>
                <h2 class="ff-row-title ff-row-title--lg">{{ fullName(user) || user.email }}</h2>
              </div>
              <span class="ff-status-pill">Actif</span>
            </div>

            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="ff-form-grid ff-form-grid--two">
              <label>
                <span class="ff-field-label">Prenom</span>
                <input class="ff-control" formControlName="first_name" type="text" />
                @if (profileForm.controls.first_name.touched && profileForm.controls.first_name.hasError('required')) {
                  <small class="ff-field-error">Champ obligatoire</small>
                }
              </label>

              <label>
                <span class="ff-field-label">Nom</span>
                <input class="ff-control" formControlName="last_name" type="text" />
                @if (profileForm.controls.last_name.touched && profileForm.controls.last_name.hasError('required')) {
                  <small class="ff-field-error">Champ obligatoire</small>
                }
              </label>

              <label>
                <span class="ff-field-label">Email</span>
                <input class="ff-control" formControlName="email" type="email" />
                @if (profileForm.controls.email.touched && profileForm.controls.email.hasError('required')) {
                  <small class="ff-field-error">Champ obligatoire</small>
                }
              </label>

              <button type="submit" class="ff-btn ff-btn-primary">Enregistrer le profil</button>
            </form>
          </article>
        } @else if (!isLoading()) {
          <div class="ff-empty">No authenticated profile returned by the backend.</div>
        }
      </div>
    </section>
  `,
})
export class ProfilePage {
  private readonly auth = inject(AuthSessionService);
  private readonly api = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly me = signal<MeResponse | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly profileForm = this.fb.nonNullable.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    this.auth
      .loadMeOnce()
      .pipe(
        catchError(() => {
          this.error.set('Unable to load the authenticated profile.');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((me) => {
        this.me.set(me);
        if (me) {
          this.profileForm.setValue({
            first_name: me.first_name,
            last_name: me.last_name,
            email: me.email,
          });
        }
        this.isLoading.set(false);
      });
  }

  saveProfile(): void {
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) {
      this.error.set('Veuillez corriger les champs du profil.');
      return;
    }

    this.api
      .updateMe(this.profileForm.getRawValue())
      .pipe(
        catchError(() => {
          this.error.set('Impossible de mettre a jour le profil.');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((me) => {
        if (!me) {
          return;
        }
        this.me.set(me);
        this.auth.setCurrentUser(me);
        this.error.set(null);
      });
  }

  protected fullName(user: MeResponse): string {
    return [user.first_name, user.last_name].filter(Boolean).join(' ');
  }
}
