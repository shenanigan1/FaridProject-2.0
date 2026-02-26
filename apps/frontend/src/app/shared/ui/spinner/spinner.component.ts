/**
 * ----------------------------------------------------------------------------
 * UiSpinnerComponent
 * ----------------------------------------------------------------------------
 * Minimal loading spinner for buttons, pages, and panels.
 * Layer: shared/ui
 * ----------------------------------------------------------------------------
 */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type UiSpinnerSize = 'sm' | 'md' | 'lg';

@Component({
  standalone: true,
  selector: 'ui-spinner',
  imports: [CommonModule],
  template: `
    <span
      class="inline-block animate-spin rounded-full border-2 border-slate-500/40 border-t-slate-100"
      [class]="sizeClass"
      aria-label="Loading"
      role="status"
    ></span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSpinnerComponent {
  @Input() size: UiSpinnerSize = 'md';

  get sizeClass(): string {
    switch (this.size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-8 w-8';
      default:
        return 'h-6 w-6';
    }
  }
}
