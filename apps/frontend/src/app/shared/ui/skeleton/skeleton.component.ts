/**
 * ----------------------------------------------------------------------------
 * UiSkeletonComponent
 * ----------------------------------------------------------------------------
 * Skeleton placeholder blocks (line/block/avatar).
 * Layer: shared/ui
 * ----------------------------------------------------------------------------
 */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type UiSkeletonVariant = 'line' | 'block' | 'avatar';

@Component({
  standalone: true,
  selector: 'ui-skeleton',
  imports: [CommonModule],
  template: `
    <div
      class="animate-pulse rounded-xl bg-slate-800/60"
      [class]="classes"
      aria-hidden="true"
    ></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSkeletonComponent {
  @Input() variant: UiSkeletonVariant = 'line';

  /** For line/block variants */
  @Input() width: string = '100%';
  @Input() height: string = '14px';

  get classes(): string {
    if (this.variant === 'avatar') {
      return 'h-10 w-10 rounded-full';
    }
    return `w-[${this.width}] h-[${this.height}]`;
  }
}


/*
 Safer version of template w-[${}] (may not be picked by tailwing JIT) :
    <div
    class="animate-pulse rounded-xl bg-slate-800/60"
    [class.rounded-full]="variant === 'avatar'"
    [style.width]="variant === 'avatar' ? '40px' : width"
    [style.height]="variant === 'avatar' ? '40px' : height"
    aria-hidden="true"
  ></div>

  Replace if you encounter some trouble cause by tailwind from this component

*/
