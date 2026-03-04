/**
 * ----------------------------------------------------------------------------
 * UiDragHandleDirective
 * ----------------------------------------------------------------------------
 * Re-export CDK drag handle directive with a semantic selector.
 * Use: <span appUiDragHandle>⠿</span>
 * Layer: shared/ui
 * ----------------------------------------------------------------------------
 */

import { Directive } from '@angular/core';
import { CdkDragHandle } from '@angular/cdk/drag-drop';

@Directive({
  standalone: true,
  selector: '[appUiDragHandle]',
})
export class UiDragHandleDirective extends CdkDragHandle {}
