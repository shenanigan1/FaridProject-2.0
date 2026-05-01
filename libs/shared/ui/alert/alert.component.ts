import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type UiAlertVariant = 'error' | 'success' | 'warning' | 'info';

@Component({
  standalone: true,
  selector: 'app-ui-alert',
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiAlertComponent {
  @Input() message: string | null = null;
  @Input() variant: UiAlertVariant = 'error';

  get hasMessage(): boolean {
    return !!this.message?.trim();
  }

  get classes(): string {
    const variants: Record<UiAlertVariant, string> = {
      success: 'ff-alert ff-alert-success',
      warning: 'ff-alert ff-alert-warning',
      info: 'ff-alert ff-alert-info',
      error: 'ff-alert ff-alert-error',
    };

    return variants[this.variant];
  }

  get role(): 'alert' | 'status' {
    return this.variant === 'error' || this.variant === 'warning'
      ? 'alert'
      : 'status';
  }
}