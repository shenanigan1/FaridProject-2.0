/**
 * ----------------------------------------------------------------------------
 * UiDropListComponent
 * ----------------------------------------------------------------------------
 * Wrapper for CDK drop list with consistent styling.
 * Emits the raw CdkDragDrop event to feature layer.
 *
 * Layer: shared/ui
 * ----------------------------------------------------------------------------
 */
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  standalone: true,
  selector: 'ui-drop-list',
  imports: [CommonModule, DragDropModule],
  template: `
    <div
      cdkDropList
      [cdkDropListData]="data"
      [cdkDropListConnectedTo]="connectedTo"
      [cdkDropListDisabled]="disabled"
      (cdkDropListDropped)="dropped.emit($event)"
      class="rounded-2xl border border-slate-800 bg-slate-900/30 p-3"
      [class.opacity-60]="disabled"
    >
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiDropListComponent<T = unknown> {
  /** Your array reference used by CDK for reordering/transfer */
  @Input() data: T[] = [];

  /** IDs of connected lists (for cross-list dragging) */
  @Input() connectedTo: string[] = [];

  /** Disable drag/drop */
  @Input() disabled = false;

  /** Forward CDK drop event to feature */
  @Output() dropped = new EventEmitter<CdkDragDrop<T[]>>();
}
