import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '@core/auth/services/auth.service';
import { UiButtonPrimaryComponent } from '@lib-ui/button-primary/button-primary.component';
import { UiTextInputComponent } from '@lib-ui/text-input/text-input.component';
import { AuthCardComponent } from '@lib-ui/auth-card/auth-card.component';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthCardComponent,
    UiButtonPrimaryComponent,
    UiTextInputComponent,
  ],
  templateUrl: './auth-modal.component.html',
})
export class AuthModalComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  @Output() authenticated = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  mode: 'signin' | 'signup' = 'signin';

  readonly authForm = this.formBuilder.nonNullable.group({
    firstName: [''],
    lastName: [''],
    phone: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  switchMode(): void {
    this.mode = this.mode === 'signin' ? 'signup' : 'signin';
    this.authForm.patchValue({ password: '' });
  }

  onSubmit(): void {
    this.authForm.markAllAsTouched();
    if (this.authForm.invalid) {
      return;
    }

    const formValue = this.authForm.getRawValue();

    this.authService.authenticate({
      email: formValue.email,
      password: formValue.password,
      firstName: this.mode === 'signup' ? formValue.firstName : undefined,
      lastName: this.mode === 'signup' ? formValue.lastName : undefined,
      phone: this.mode === 'signup' ? formValue.phone : undefined,
    });

    this.authenticated.emit();
  }

  onClose(): void {
    this.closed.emit();
  }
}
