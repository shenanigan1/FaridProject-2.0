import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragPlaceholder, CdkDragPreview } from '@angular/cdk/drag-drop';

@Component({
  standalone: true,
  selector: 'ui-draggable',
  imports: [CommonModule, CdkDrag, CdkDragPreview, CdkDragPlaceholder],
  template: `
    <div
      cdkDrag
      [cdkDragDisabled]="disabled"
      [cdkDragData]="item"
      class="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-sm"
      [class.opacity-60]="disabled"
    >
      <ng-template cdkDragPreview>
        <div class="rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-xl">
          <ng-content></ng-content>
        </div>
      </ng-template>

      <ng-template cdkDragPlaceholder>
        <div class="h-14 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40"></div>
      </ng-template>

      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiDraggableComponent<T = unknown> {
  @Input() item!: T;
  @Input() disabled = false;
}
