import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type UiAlertVariant = 'error' | 'success' | 'warning' | 'info';

@Component({
  standalone: true,
  selector: 'app-ui-alert',
  imports: [CommonModule],
  template: `
    @if (hasContent) {
      <div [class]="classes">
        <ng-content *ngIf="!hasMessage"></ng-content>
        <span *ngIf="hasMessage">{{ message }}</span>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiAlertComponent {
  @Input() message: string | null = null;
  @Input() variant: UiAlertVariant = 'error';

  get hasMessage(): boolean {
    return !!this.message;
  }

  get hasContent(): boolean {
    return this.hasMessage;
  }

  get classes(): string {
    const base = 'ff-alert';

    const variants: Record<UiAlertVariant, string> = {
      success: 'ff-alert-success',
      warning: 'ff-alert-warning',
      info: 'ff-alert-info',
      error: 'ff-alert-error',
    };

    return `${base} ${variants[this.variant]}`;
  }
}