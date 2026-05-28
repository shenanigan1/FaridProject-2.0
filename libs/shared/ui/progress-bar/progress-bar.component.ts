/**
 * ----------------------------------------------------------------------------
 * UiProgressBarComponent
 * ----------------------------------------------------------------------------
 * Progress indicator for uploads, completion, etc.
 * Layer: shared/ui
 * ----------------------------------------------------------------------------
 */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-ui-progress-bar',
  imports: [CommonModule],
  template: `
    <div
      class="ff-progress"
      role="progressbar"
      [attr.aria-valuemin]="indeterminate ? null : 0"
      [attr.aria-valuemax]="indeterminate ? null : 100"
      [attr.aria-valuenow]="indeterminate ? null : clamped"
      [attr.aria-busy]="indeterminate ? 'true' : null"
    >
      @if(!indeterminate)
        {
          <span [style.width.%]="clamped"></span>
        }

      @else
        {
          <span class="w-1/3 animate-pulse"></span>
        }

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiProgressBarComponent {
  /** 0..100 */
  @Input() value = 0;

  /** Indeterminate mode for unknown progress */
  @Input() indeterminate = false;

  get clamped(): number {
    if (Number.isNaN(this.value)) return 0;
    return Math.max(0, Math.min(100, this.value));
  }
}
