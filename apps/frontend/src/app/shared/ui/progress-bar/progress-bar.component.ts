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
    <div class="w-full rounded-full bg-slate-800/60 h-2 overflow-hidden">
      @if(!indeterminate)
        {
          <div
              class="h-full bg-blue-500 transition-all"
              [style.width.%]="clamped"
              aria-label="Progress"
          ></div>
        }

      @else
        {
          <div
            class="h-full w-1/3 bg-blue-500 animate-pulse"
            aria-label="Loading"
          ></div>
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
