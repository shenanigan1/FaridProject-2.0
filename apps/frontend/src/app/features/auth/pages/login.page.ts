import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';
import { LucideDynamicIcon } from '@lucide/angular';

import { APP_ICONS } from '@shared/icons/app-icons';
import { AuthSessionService } from '@core/auth/services/auth-session.service';
import { ApiErrorResponse } from '@core/auth/models/auth.models';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideDynamicIcon,
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  readonly icons = APP_ICONS;
  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [true],
  });

  readonly emailError = computed(() => this.getEmailError());
  readonly passwordError = computed(() => this.getPasswordError());

  submit(): void {
    if (this.loading()) {
      return;
    }

    this.submitted.set(true);
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const { email, password, rememberMe } = this.form.getRawValue();

    this.session
      .login({ email: email.trim(), password }, rememberMe)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const target = response.user?.role === 'manager' ? '/manager' : '/dashboard';
          void this.router.navigateByUrl(target);
        },
        error: (error: { error?: ApiErrorResponse; status?: number }) => {
          const message =
            error?.error?.detail ??
            error?.error?.non_field_errors?.[0] ??
            error?.error?.email?.[0] ??
            error?.error?.password?.[0] ??
            (error?.status === 401 ? 'Invalid email or password.' : null) ??
            'Unable to log in. Please try again.';

          this.errorMessage.set(String(message));
          this.loading.set(false);
        },
        complete: () => {
          this.loading.set(false);
        },
      });
  }

  private shouldShowError(control: AbstractControl | null): boolean {
    if (!control) {
      return false;
    }

    return control.invalid && (control.touched || control.dirty || this.submitted());
  }

  private getEmailError(): string | null {
    const control = this.form.controls.email;

    if (!this.shouldShowError(control)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Email is required.';
    }

    if (control.hasError('email')) {
      return 'Please enter a valid email address.';
    }

    return null;
  }

  private getPasswordError(): string | null {
    const control = this.form.controls.password;

    if (!this.shouldShowError(control)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Password is required.';
    }

    return null;
  }
}
