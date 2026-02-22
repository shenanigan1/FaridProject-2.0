import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TokenStorageService } from '../../core/auth/token-storage.service';

type Profile = 'driver' | 'manager' | 'hr';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.page.html',
  styleUrls: ['../../../styles.scss'],
})
export class LoginPage {
  readonly profiles: { key: Profile; label: string }[] = [
    { key: 'driver', label: 'DRIVER' },
    { key: 'manager', label: 'MANAGER' },
    { key: 'hr', label: 'HR/ADMIN' },
  ];

  readonly selectedProfile = signal<Profile>('driver');
  readonly passwordVisible = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly identifierLabel = computed(() =>
    this.selectedProfile() === 'driver' ? 'Email or Driver ID' : 'Email'
  );

  form = new FormGroup({
    identifier: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    rememberMe: new FormControl<boolean>(true, { nonNullable: true }),
  });

  constructor(
    private readonly auth: AuthService,
    private readonly tokenStorage: TokenStorageService,
    private readonly router: Router,
  ) {}

  selectProfile(p: Profile) {
    this.selectedProfile.set(p);
    this.errorMessage.set(null);
  }

  togglePassword() {
    this.passwordVisible.set(!this.passwordVisible());
  }

  async submit() {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { identifier, password, rememberMe } = this.form.getRawValue();

    this.loading.set(true);
    try {
      const res = await this.auth.login({
        profile: this.selectedProfile(),
        identifier,
        password,
      });

      this.tokenStorage.saveTokens(res.access, res.refresh, rememberMe);

      // 👉 redirige où tu veux après login
      await this.router.navigateByUrl('/dashboard');
    } catch (e: any) {
      // message simple (à adapter selon ton API)
      this.errorMessage.set(e?.message ?? 'Invalid credentials.');
    } finally {
      this.loading.set(false);
    }
  }
}
