/**
 * ----------------------------------------------------------------------------
 * UiSkeletonComponent
 * ----------------------------------------------------------------------------
 * Skeleton placeholder blocks (line/block/avatar).
 * Layer: shared/ui
 * ----------------------------------------------------------------------------
 */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

type UiSkeletonVariant = 'line' | 'block' | 'avatar';

@Component({
  standalone: true,
  selector: 'app-ui-skeleton',
  template: `
    <div
      class="animate-pulse bg-slate-800/60"
      [class.rounded-xl]="variant !== 'avatar'"
      [class.rounded-full]="variant === 'avatar'"
      [style.width]="resolvedWidth"
      [style.height]="resolvedHeight"
      aria-hidden="true"
    ></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSkeletonComponent {
  @Input() variant: UiSkeletonVariant = 'line';

  /** For line/block variants */
  @Input() width = '100%';
  @Input() height = '14px';

  get resolvedWidth(): string {
    return this.variant === 'avatar' ? '40px' : this.width;
  }

  get resolvedHeight(): string {
    return this.variant === 'avatar' ? '40px' : this.height;
  }
}