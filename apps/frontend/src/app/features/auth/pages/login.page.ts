import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';
import { LucideDynamicIcon } from '@lucide/angular';

import { AuthService } from '@auth/services/auth.service';
import { TokenStorageService } from '@auth/services/token-storage.service';
import { APP_ICONS } from '@shared/icons/app-icons';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideDynamicIcon],
  templateUrl: './login.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  readonly icons = APP_ICONS;

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [true],
  });

  submit(): void {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password, rememberMe } = this.form.getRawValue();

    this.auth
      .login({
        email,
        password,
      })
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.tokenStorage.saveTokens(response.access, response.refresh, rememberMe);
          void this.router.navigateByUrl('/dashboard');
        },
        error: (error: unknown) => {
          const apiError = error as {
            error?: {
              detail?: string;
              non_field_errors?: string[];
            };
          };

          const message =
            apiError?.error?.detail ??
            apiError?.error?.non_field_errors?.[0] ??
            'Invalid credentials.';

          this.errorMessage.set(String(message));
          this.loading.set(false);
        },
        complete: () => {
          this.loading.set(false);
        },
      });
  }
}