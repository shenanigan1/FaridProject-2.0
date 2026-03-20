import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CandidateAuthService } from '@auth/services/candidate-auth.service';
import { ModalComponent } from '@shared/ui/modal/modal.component';

type AuthMode = 'login' | 'signup';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './auth-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(CandidateAuthService);

  @Output() close = new EventEmitter<void>();
  @Output() authenticated = new EventEmitter<void>();

  readonly mode = signal<AuthMode>('login');

  readonly form = this.fb.nonNullable.group({
    firstName: [''],
    lastName: [''],
    phone: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  switchMode(mode: AuthMode): void {
    this.mode.set(mode);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();

    if (this.mode() === 'signup') {
      this.authService.signUp(payload);
    } else {
      this.authService.login(payload);
    }

    this.authenticated.emit();
  }
}
