import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

import { AuthModalComponent } from '@core/auth/components/auth-modal/auth-modal.component';
import {
  AuthService,
  AuthenticatedCandidate,
} from '@core/auth/services/auth.service';
import { UiButtonPrimaryComponent } from '@lib-ui/button-primary/button-primary.component';
import { UiModalComponent } from '@lib-ui/modal/modal.component';
import { UiTextInputComponent } from '@lib-ui/text-input/text-input.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterOutlet,
    AuthModalComponent,
    UiModalComponent,
    UiButtonPrimaryComponent,
    UiTextInputComponent,
  ],
  templateUrl: './app.html',
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  readonly appTitle = 'Farid Candidate';

  authModalOpen = false;
  profileModalOpen = false;

  readonly profileForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
  });

  constructor() {
    const hadStoredSession = this.authService.hasStoredSession();
    this.authService.restoreSession().subscribe((candidate) => {
      this.authModalOpen = hadStoredSession && !candidate;
    });
  }

  onProfileClicked(): void {
    if (!this.authService.isAuthenticated()) {
      this.authModalOpen = true;
      return;
    }

    this.openProfileModal();
  }

  onAuthSuccess(): void {
    this.authModalOpen = false;
    this.openProfileModal();
  }

  onProfileSave(): void {
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) {
      return;
    }

    const currentCandidate = this.authService.getAuthenticatedCandidate();
    if (!currentCandidate) {
      this.authModalOpen = true;
      this.profileModalOpen = false;
      return;
    }

    const formValue = this.profileForm.getRawValue();

    this.authService.saveAuthenticatedCandidate({
      candidateId: currentCandidate.candidateId,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phone: formValue.phone,
    });

    this.profileModalOpen = false;
  }

  onLogoutClicked(): void {
    this.authService.logout();
    this.profileModalOpen = false;
  }

  get profileInitials(): string {
    const candidate = this.authService.getAuthenticatedCandidate();
    if (!candidate) {
      return '👤';
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

  private openProfileModal(): void {
    const candidate = this.authService.getAuthenticatedCandidate();
    if (!candidate) {
      this.authModalOpen = true;
      this.profileModalOpen = false;
      return;
    }

    this.patchProfileForm(candidate);
    this.profileModalOpen = true;
  }

  private patchProfileForm(candidate: AuthenticatedCandidate): void {
    this.profileForm.patchValue({
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone,
    });
  }
}
