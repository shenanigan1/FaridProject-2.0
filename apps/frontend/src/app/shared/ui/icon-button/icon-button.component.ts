/**
 * ----------------------------------------------------------------------------
 * UiIconButtonComponent
 * ----------------------------------------------------------------------------
 * Lightweight icon-only action button for toolbars, headers, card actions, etc.
 *
 * Layer: shared/ui (pure presentational)
 * Notes:
 * - `ariaLabel` is required for accessibility.
 * - Use for micro-actions (edit/delete/menu), not primary CTAs.
 * ----------------------------------------------------------------------------
 *  Usage :
 *  <app-ui-icon-button ariaLabel="Open menu">
 *   ⋮
 *  </app-ui-icon-button>
 */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

type UiIconButtonVariant = 'ghost' | 'solid' | 'outline';
type UiIconButtonSize = 'sm' | 'md' | 'lg';

@Component({
  standalone: true,
  selector: 'app-ui-icon-button',
  template: `
    <button
      [attr.type]="type"
      [attr.aria-label]="ariaLabel"
      [disabled]="disabled"
      [class]="classes"
    >
      <ng-content></ng-content>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiIconButtonComponent {
  @Input() ariaLabel!: string; // required (runtime)
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() variant: UiIconButtonVariant = 'ghost';
  @Input() size: UiIconButtonSize = 'md';

  get classes(): string {
    const base =
      'inline-flex items-center justify-center rounded-xl transition ' +
      'disabled:opacity-60 disabled:cursor-not-allowed';

    const sizes: Record<UiIconButtonSize, string> = {
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
    };

    const variants: Record<UiIconButtonVariant, string> = {
      ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-200',
      solid: 'bg-slate-800 hover:bg-slate-700 text-slate-100',
      outline: 'border border-slate-700 hover:bg-slate-800/60 text-slate-100',
    };

    return `${base} ${sizes[this.size]} ${variants[this.variant]}`;
  }
}
