import { AuthCardComponent } from '@lib-ui/auth-card/auth-card.component';
import { UiButtonPrimaryComponent } from '@lib-ui/button-primary/button-primary.component';
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Output } from "@angular/core";

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, AuthCardComponent, UiButtonPrimaryComponent],
  templateUrl: './auth-modal.component.html',
})
export class AuthModalComponent {
  @Output() authenticated = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  mode: 'signin' | 'signup' = 'signin';

  switchMode(): void {
    this.mode = this.mode === 'signin' ? 'signup' : 'signin';
  }

  onAuthSuccess(): void {
    this.authenticated.emit();
  }

  onClose(): void {
    this.closed.emit();
  }
}
