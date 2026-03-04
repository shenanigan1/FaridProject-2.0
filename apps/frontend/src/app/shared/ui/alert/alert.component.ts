import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type UiAlertVariant = 'error' | 'success' | 'warning' | 'info';

@Component({
  standalone: true,
  selector: 'app-ui-alert',
  imports: [CommonModule],
  template: `
    @if (message) {
      <div [class]="classes">
        <span>{{ message }}</span>
      </div>
    } @else {
      <div [class]="classes">
        <ng-content></ng-content>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiAlertComponent {
  @Input() message: string | null = null;
  @Input() variant: UiAlertVariant = 'error';

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
