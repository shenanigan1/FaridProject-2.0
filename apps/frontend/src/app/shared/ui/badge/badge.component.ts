/**
 * ----------------------------------------------------------------------------
 * UiBadgeComponent
 * ----------------------------------------------------------------------------
 * Status pill used for labels like ACTIVE, HARD, MEDIUM, etc.
 * Layer: shared/ui (pure presentational)
 * ----------------------------------------------------------------------------
 * Usage :
 * <ui-badge tone="success">ACTIVE</ui-badge>
 * <ui-badge tone="danger">HARD</ui-badge>
 */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

type UiBadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
type UiBadgeSize = 'sm' | 'md';

@Component({
  standalone: true,
  selector: 'ui-badge',
  template: `
    <span [class]="classes">
      <ng-content></ng-content>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiBadgeComponent {
  @Input() tone: UiBadgeTone = 'neutral';
  @Input() size: UiBadgeSize = 'sm';

  get classes(): string {
    const base = 'inline-flex items-center rounded-full border font-medium';
    const sizes: Record<UiBadgeSize, string> = {
      sm: 'px-2 py-0.5 text-[11px]',
      md: 'px-2.5 py-1 text-xs',
    };

    const tones: Record<UiBadgeTone, string> = {
      neutral: 'border-slate-600/40 bg-slate-500/10 text-slate-200',
      success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
      warning: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
      danger: 'border-red-500/25 bg-red-500/10 text-red-200',
      info: 'border-blue-500/25 bg-blue-500/10 text-blue-200',
    };

    return `${base} ${sizes[this.size]} ${tones[this.tone]}`;
  }
}
