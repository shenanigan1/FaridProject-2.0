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
    const base = 'mb-4 rounded-lg border px-3 py-2 text-sm';

    const variants: Record<UiAlertVariant, string> = {
      success: 'border-success/30 bg-success/10 text-success',
      warning: 'border-warning/30 bg-warning/10 text-warning',
      info: 'border-info/30 bg-info/10 text-info',
      error: 'border-error/30 bg-error/10 text-error',
    };

    return `${base} ${variants[this.variant]}`;
  }
}