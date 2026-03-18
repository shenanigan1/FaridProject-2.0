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
        @if (hasMessage) {
          <span>{{ message }}</span>
        } @else {
          <ng-content></ng-content>
        }
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
    return this.hasMessage; // or extend later if ng-content is used
  }

  get classes(): string {
    const base = 'mb-4 rounded-xl border p-3 text-sm';

    switch (this.variant) {
      case 'success':
        return `${base} border-green-500/25 bg-green-500/10 text-green-200`;
      case 'warning':
        return `${base} border-yellow-500/25 bg-yellow-500/10 text-yellow-200`;
      case 'info':
        return `${base} border-blue-500/25 bg-blue-500/10 text-blue-200`;
      default:
        return `${base} border-red-500/25 bg-red-500/10 text-red-200`;
    }
  }
}
