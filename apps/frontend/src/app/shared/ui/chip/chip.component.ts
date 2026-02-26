/**
 * ----------------------------------------------------------------------------
 * UiChipComponent
 * ----------------------------------------------------------------------------
 * Filter chip / tag with selectable state and optional remove action.
 * Layer: shared/ui (pure presentational + emits events)
 * ----------------------------------------------------------------------------
 * Usage :
 * <ui-chip [selected]="true" (toggle)="selected=$event">Safety</ui-chip>
 * <ui-chip removable (remove)="onRemoveTag()">Compliance</ui-chip>
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

type UiChipTone = 'neutral' | 'info';

@Component({
  standalone: true,
  selector: 'ui-chip',
  imports: [CommonModule],
  template: `
    <button
      type="button"
      [disabled]="disabled"
      [class]="classes"
      (click)="onToggle()"
    >
      <ng-content></ng-content>

      <span *ngIf="removable"
            class="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-md
                   hover:bg-slate-700/40"
            (click)="onRemove($event)"
            aria-hidden="true">
        ×
      </span>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiChipComponent {
  @Input() selected = false;
  @Input() disabled = false;
  @Input() removable = false;
  @Input() tone: UiChipTone = 'neutral';

  @Output() toggle = new EventEmitter<boolean>();
  @Output() remove = new EventEmitter<void>();

  get classes(): string {
    const base =
      'inline-flex items-center rounded-full border px-3 py-1 text-xs transition ' +
      'disabled:opacity-60 disabled:cursor-not-allowed';

    const toneBase =
      this.tone === 'info'
        ? 'border-blue-500/25'
        : 'border-slate-700/50';

    const state =
      this.selected
        ? (this.tone === 'info'
            ? 'bg-blue-500/15 text-blue-100'
            : 'bg-slate-700/40 text-slate-100')
        : 'bg-transparent text-slate-200 hover:bg-slate-800/50';

    return `${base} ${toneBase} ${state}`;
  }

  onToggle(): void {
    if (this.disabled) return;
    this.toggle.emit(!this.selected);
  }

  onRemove(e: MouseEvent): void {
    e.stopPropagation();
    if (this.disabled) return;
    this.remove.emit();
  }
}
