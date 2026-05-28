import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { AuthService } from '@core/auth/services/auth.service';
import { UiButtonPrimaryComponent } from '@lib-ui/button-primary/button-primary.component';
import { UiTextInputComponent } from '@lib-ui/text-input/text-input.component';

@Component({
  standalone: true,
  selector: 'app-candidate-profile-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, UiButtonPrimaryComponent, UiTextInputComponent],
  template: `
    <section class="ff-app-screen">
      <main class="ff-app-container ff-app-container--compact ff-app-stack">
        <header class="ff-workflow-hero">
          <p class="ff-app-kicker">Compte candidat</p>
          <h1 class="ff-workflow-hero__title">Profil candidat</h1>
          <p class="ff-app-subtitle">
            Gérez vos informations personnelles et votre accès FleetFlow.
          </p>
        </header>

        @if (pageMessage()) {
          <p class="ff-alert ff-alert-success" role="status">{{ pageMessage() }}</p>
        }

        @if (errorMessage()) {
          <p class="ff-alert ff-alert-error" role="alert">{{ errorMessage() }}</p>
        }

        <article class="ff-data-card ff-app-stack">
          <div class="ff-card-head">
            <div>
              <p class="ff-app-kicker">Identité</p>
              <h2 class="ff-row-title ff-row-title--lg">{{ fullName() }}</h2>
            </div>
            <span class="ff-status-pill">Candidat</span>
          </div>

          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="ff-form-grid ff-form-grid--two">
            <app-ui-text-input formControlName="firstName" label="Prénom" />
            <app-ui-text-input formControlName="lastName" label="Nom" />
            <app-ui-text-input formControlName="email" label="Email" type="email" />
            <app-ui-text-input formControlName="phone" label="Téléphone" type="tel" />

            <div class="ff-inline-actions ff-u-between ff-u-full">
              <button type="button" class="ff-btn ff-btn-secondary" routerLink="/dashboard">
                Retour
              </button>
              <app-ui-button-primary type="submit" label="Enregistrer" />
            </div>
          </form>
        </article>

        <article class="ff-data-card">
          <p class="ff-app-kicker">Sécurité</p>
          <p class="ff-row-meta ff-u-mt-sm">
            Les modifications sont appliquées sur votre compte candidat connecté.
          </p>
          <button type="button" class="ff-btn ff-btn-secondary ff-u-mt-md" (click)="logout()">
            Se déconnecter
          </button>
        </article>
      </main>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidateProfilePage {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly pageMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
  });

  constructor() {
    const candidate = this.auth.getAuthenticatedCandidate();
    if (!candidate) {
      void this.router.navigateByUrl('/jobs');
      return;
    }

    this.profileForm.setValue({
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone,
    });
  }

  fullName(): string {
    const value = this.profileForm.getRawValue();
    return `${value.firstName} ${value.lastName}`.trim() || value.email;
  }

  saveProfile(): void {
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) {
      this.errorMessage.set('Veuillez corriger les champs du profil.');
      return;
    }

    this.errorMessage.set(null);
    this.auth
      .updateProfile(this.profileForm.getRawValue())
      .pipe(
        catchError(() => {
          this.errorMessage.set('Impossible de mettre à jour le profil.');
          return of(null);
        }),
      )
      .subscribe((candidate) => {
        if (!candidate) {
          return;
        }
        this.profileForm.setValue({
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone,
        });
        this.pageMessage.set('Profil mis a jour.');
      });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/jobs');
  }
}
