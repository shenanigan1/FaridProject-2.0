import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';

import { AuthService } from '@auth/services/auth.service';
import { TokenStorageService } from '@auth/services/token-storage.service';
import { LoginProfile } from '@auth/models/auth.models';

import { UiTextInputComponent } from '@lib-ui/text-input/text-input.component';
import { UiPasswordInputComponent } from '@lib-ui/password-input/password-input.component';
import { UiButtonPrimaryComponent } from '@lib-ui/button-primary/button-primary.component';
import { UiAlertComponent } from '@lib-ui/alert/alert.component';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    UiTextInputComponent,
    UiPasswordInputComponent,
    UiButtonPrimaryComponent,
    UiAlertComponent,
  ],
  templateUrl: './login.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  readonly profiles: { key: LoginProfile; label: string }[] = [
    { key: 'driver', label: 'DRIVER' },
    { key: 'manager', label: 'MANAGER' },
    { key: 'hr', label: 'HR/ADMIN' },
  ];

  readonly selectedProfile = signal<LoginProfile>('driver');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly emailLabel = computed(() =>
    this.selectedProfile() === 'driver' ? 'Driver Email' : 'Email'
  );

  readonly form = this.fb.nonNullable.group({
    email: ['', Validators.required],
    password: ['', Validators.required],
    rememberMe: [true],
  });

  selectProfile(profile: LoginProfile): void {
    this.selectedProfile.set(profile);
    this.errorMessage.set(null);
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password, rememberMe } = this.form.getRawValue();

    this.auth
      .login({
        profile: this.selectedProfile(),
        email,
        password,
      })
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.tokenStorage.saveTokens(res.access, res.refresh, rememberMe);
          this.router.navigateByUrl('/dashboard');
        },
        error: (err) => {
          const msg =
            err?.error?.detail ??
            err?.error?.non_field_errors?.[0] ??
            'Invalid credentials.';
          this.errorMessage.set(String(msg));
          this.loading.set(false);
        },
        complete: () => this.loading.set(false),
      });
  }
}
