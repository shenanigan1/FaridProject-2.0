import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService} from '@auth/services/auth.service';
import { LoginProfile } from '@auth/models/auth.models';
import { TokenStorageService } from '@auth/services/token-storage.service';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.page.html',
})
export class LoginPage {
  readonly profiles: { key: LoginProfile; label: string }[] = [
    { key: 'driver', label: 'DRIVER' },
    { key: 'manager', label: 'MANAGER' },
    { key: 'hr', label: 'HR/ADMIN' },
  ];

  readonly selectedProfile = signal<LoginProfile>('driver');
  readonly passwordVisible = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly emailLabel = computed(() =>
    this.selectedProfile() === 'driver' ? 'Driver Email' : 'Email'
  );

  readonly form = new FormGroup({
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    rememberMe: new FormControl<boolean>(true, { nonNullable: true }),
  });

  constructor(
    private readonly auth: AuthService,
    private readonly tokenStorage: TokenStorageService,
    private readonly router: Router
  ) {}

  selectProfile(p: LoginProfile) {
    this.selectedProfile.set(p);
    this.errorMessage.set(null);
  }

  togglePassword() {
    this.passwordVisible.set(!this.passwordVisible());
  }

  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, rememberMe } = this.form.getRawValue();

    this.loading.set(true);
    this.auth
      .login({
        profile: this.selectedProfile(),
        email,
        password,
      })
      .subscribe({
        next: (res) => {
          this.tokenStorage.saveTokens(res.access, res.refresh, rememberMe);
          this.router.navigateByUrl('/dashboard');
        },
        error: (err) => {
          // adapte selon ton API (DRF renvoie souvent err.error.detail ou err.error)
          const msg =
            err?.error?.detail ??
            err?.error?.non_field_errors?.[0] ??
            err?.error ??
            'Invalid credentials.';
          this.errorMessage.set(String(msg));
          this.loading.set(false);
        },
        complete: () => {
          this.loading.set(false);
        },
      });
  }
}
