export { UiDropListComponent } from './drop-list.component';
export { UiDraggableComponent } from './draggable.component';
export { UiDragHandleDirective } from './drag-handle.directive';


/*
* Example usage in a feature (reorder in same list) :
*
* typeScript //
*  import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
*
*  drop(e: CdkDragDrop<MyItem[]>): void {
*    if (e.previousContainer === e.container) {
*      moveItemInArray(e.container.data, e.previousIndex, e.currentIndex);
*    }
*  }
*
*  HTML //
*  <ui-drop-list [data]="items" (dropped)="drop($event)">
*    <div class="space-y-2">
*      <ui-draggable *ngFor="let it of items" [item]="it">
*        <div class="flex items-center justify-between">
*          <div class="flex items-center gap-3">
*            <span uiDragHandle class="cursor-grab select-none text-slate-400">⠿</span>
*            <div class="text-slate-100">{{ it.name }}</div>
*          </div>
*        </div>
*      </ui-draggable>
*    </div>
*  </ui-drop-list>
*
*
* Example usage (transfer between lists) :
*
* import { CdkDragDrop, transferArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
*
* drop(e: CdkDragDrop<MyItem[]>): void {
*  if (e.previousContainer === e.container) {
*    moveItemInArray(e.container.data, e.previousIndex, e.currentIndex);
*  } else {
*    transferArrayItem(
*      e.previousContainer.data,
*      e.container.data,
*      e.previousIndex,
*      e.currentIndex
*    );
*  }
* }
*
*/
