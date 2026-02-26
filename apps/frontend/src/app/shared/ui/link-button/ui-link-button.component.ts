import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md';

@Component({
  standalone: true,
  selector: 'ui-link-button',
  imports: [CommonModule, RouterModule],
  templateUrl: './ui-link-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiLinkButtonComponent {
  @Input({ required: true }) routerLink!: string | any[];
  @Input() label = '';
  @Input() ariaLabel: string | null = null;

  @Input() variant: Variant = 'secondary';
  @Input() size: Size = 'md';
  @Input() fullWidth = false;

  get classes(): string {
    const base =
      'inline-flex items-center justify-center transition font-semibold select-none ' +
      'focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60 disabled:pointer-events-none';

    const size =
      this.size === 'sm'
        ? 'h-9 px-4 rounded-xl text-xs'
        : 'h-11 px-5 rounded-2xl text-sm';

    const variant =
      this.variant === 'primary'
        ? 'bg-blue-600 hover:bg-blue-500 text-white'
        : this.variant === 'ghost'
          ? 'bg-transparent hover:bg-slate-900 text-slate-200 border border-slate-800'
          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800';

    const width = this.fullWidth ? 'w-full' : '';
    return [base, size, variant, width].filter(Boolean).join(' ');
  }
}
