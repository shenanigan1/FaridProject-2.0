import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CandidatePortalService } from '../../core/services/candidate-portal.service';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly portalService = inject(CandidatePortalService);

  readonly currentUser = this.portalService.currentUser;
  feedbackMessage = '';

  readonly registerForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async register(): Promise<void> {
    if (this.registerForm.invalid) {
      return;
    }

    try {
      await this.portalService.registerAccount(this.registerForm.getRawValue());
      this.feedbackMessage = 'Compte créé, vous êtes maintenant connecté.';
    } catch {
      this.feedbackMessage = 'Impossible de créer le compte.';
    }
  }

  async login(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }

    const { email, password } = this.loginForm.getRawValue();

    try {
      const isLoggedIn = await this.portalService.login(email, password);
      this.feedbackMessage = isLoggedIn
        ? 'Connexion réussie, vous êtes connecté.'
        : 'Identifiants invalides.';
    } catch {
      this.feedbackMessage = 'Identifiants invalides.';
    }
  }

  logout(): void {
    this.portalService.logout();
    this.feedbackMessage = 'Vous êtes déconnecté.';
  }
}
