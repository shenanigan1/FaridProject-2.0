/**
 * ----------------------------------------------------------------------------
 * UiModalComponent
 * ----------------------------------------------------------------------------
 * Reusable modal/dialog component with:
 * - Controlled open state (open/openChange)
 * - Backdrop click + Escape close
 * - Body scroll lock while open
 * - Slots: content + [modal-actions]
 *
 * Layer: shared/ui
 * ----------------------------------------------------------------------------
 * <ui-modal [(open)]="confirmOpen" title="Discard changes?">
 *  Unsaved changes will be lost.
 *
 *  <div modal-actions>
 *   <ui-button-secondary (click)="confirmOpen=false">Cancel</ui-button-secondary>
 *   <ui-button-primary (click)="discard()">Discard</ui-button-primary>
 *  </div>
 * </ui-modal>
 */

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

type UiModalSize = 'sm' | 'md' | 'lg';

@Component({
  standalone: true,
  selector: 'ui-modal',
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiModalComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();

  @Input() title: string | null = null;
  @Input() size: UiModalSize = 'md';
  @Input() closeOnBackdrop = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      this.syncBodyScrollLock();
    }
  }

  ngOnDestroy(): void {
    // ensure unlock if component is destroyed while open
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.open) return;
    this.close();
  }

  backdropClick(): void {
    if (!this.closeOnBackdrop) return;
    this.close();
  }

  close(): void {
    this.openChange.emit(false);
  }

  stop(e: MouseEvent): void {
    e.stopPropagation();
  }

  get panelClasses(): string {
    const base =
      'w-full rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl';
    const sizes: Record<UiModalSize, string> = {
      sm: 'max-w-sm',
      md: 'max-w-lg',
      lg: 'max-w-3xl',
    };
    return `${base} ${sizes[this.size]}`;
  }

  private syncBodyScrollLock(): void {
    document.body.style.overflow = this.open ? 'hidden' : '';
  }
}
