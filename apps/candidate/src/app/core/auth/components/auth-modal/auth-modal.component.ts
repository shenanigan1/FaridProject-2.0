import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
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
export class AuthModalComponent implements AfterViewInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  @Output() authenticated = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('dialogPanel') private dialogPanel?: ElementRef<HTMLElement>;

  mode: 'signin' | 'signup' = 'signin';
  isSubmitting = false;
  errorMessage: string | null = null;

  readonly authForm = this.formBuilder.nonNullable.group({
    firstName: [''],
    lastName: [''],
    phone: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    this.applyModeValidators();
  }

  ngAfterViewInit(): void {
    this.dialogPanel?.nativeElement.focus();
  }

  switchMode(): void {
    this.mode = this.mode === 'signin' ? 'signup' : 'signin';
    this.errorMessage = null;
    this.authForm.patchValue({ password: '' });
    this.applyModeValidators();
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

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onClose();
  }

  getFieldError(controlName: 'firstName' | 'lastName' | 'phone' | 'email' | 'password'): string | null {
    const control = this.authForm.controls[controlName];

    if (!control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) {
      return 'Champ obligatoire';
    }

    if (control.errors['email']) {
      return 'Please enter a valid email address.';
    }

    if (control.errors['minlength']) {
      const minimumLength = control.errors['minlength'].requiredLength as number;
      return `Minimum ${minimumLength} characters.`;
    }

    return null;
  }

  private applyModeValidators(): void {
    const firstNameControl = this.authForm.controls.firstName;
    const lastNameControl = this.authForm.controls.lastName;
    const phoneControl = this.authForm.controls.phone;

    if (this.mode === 'signup') {
      firstNameControl.setValidators([Validators.required]);
      lastNameControl.setValidators([Validators.required]);
      phoneControl.setValidators([Validators.required]);
    } else {
      firstNameControl.clearValidators();
      lastNameControl.clearValidators();
      phoneControl.clearValidators();
    }

    firstNameControl.updateValueAndValidity({ emitEvent: false });
    lastNameControl.updateValueAndValidity({ emitEvent: false });
    phoneControl.updateValueAndValidity({ emitEvent: false });
  }
}
