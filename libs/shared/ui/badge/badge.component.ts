/**
 * ----------------------------------------------------------------------------
 * UiBadgeComponent
 * ----------------------------------------------------------------------------
 * Status pill used for labels like ACTIVE, HARD, MEDIUM, etc.
 * Layer: shared/ui (pure presentational)
 * ----------------------------------------------------------------------------
 * Usage:
 * <app-ui-badge tone="success">ACTIVE</app-ui-badge>
 * <app-ui-badge tone="danger">HARD</app-ui-badge>
 */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type UiBadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
export type UiBadgeSize = 'sm' | 'md';

@Component({
  standalone: true,
  selector: 'app-ui-badge',
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
    return `ff-badge ff-badge-${this.tone} ff-badge-${this.size}`;
  }
}