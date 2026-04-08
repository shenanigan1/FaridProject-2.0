import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AuthService } from '@core/auth/services/auth.service';
import { UiAlertComponent } from '@lib-ui/alert/alert.component';
import { AuthCardComponent } from '@lib-ui/auth-card/auth-card.component';
import { UiButtonPrimaryComponent } from '@lib-ui/button-primary/button-primary.component';
import { UiTextInputComponent } from '@lib-ui/text-input/text-input.component';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthCardComponent,
    UiButtonPrimaryComponent,
    UiTextInputComponent,
    UiAlertComponent,
  ],
  templateUrl: './auth-modal.component.html',
})
export class AuthModalComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  @Output() authenticated = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  mode: 'signin' | 'signup' = 'signin';
  isSubmitting = false;
  errorMessage: string | null = null;

  readonly authForm = this.formBuilder.nonNullable.group({
    firstName: [''],
    lastName: [''],
    phone: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  switchMode(): void {
    this.mode = this.mode === 'signin' ? 'signup' : 'signin';
    this.errorMessage = null;
    this.authForm.patchValue({ password: '' });
  }

  onSubmit(): void {
    this.authForm.markAllAsTouched();
    if (this.authForm.invalid || this.isSubmitting) {
      return;
    }

    const formValue = this.authForm.getRawValue();
    this.errorMessage = null;
    this.isSubmitting = true;

    const authRequest =
      this.mode === 'signin'
        ? this.authService.signIn({
            email: formValue.email,
            password: formValue.password,
          })
        : this.authService.signUp({
            firstName: formValue.firstName,
            lastName: formValue.lastName,
            phone: formValue.phone,
            email: formValue.email,
            password: formValue.password,
          });

    authRequest
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.authenticated.emit();
        },
        error: (errorMessage: string) => {
          this.errorMessage = errorMessage;
        },
      });
  }

  onClose(): void {
    this.closed.emit();
  }
}
