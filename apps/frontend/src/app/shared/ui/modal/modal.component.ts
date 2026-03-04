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

let nextId = 0;

@Component({
  standalone: true,
  selector: 'app-ui-modal',
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

  /** used for aria-labelledby */
  readonly titleId = `ui-modal-title-${++nextId}`;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) this.syncBodyScrollLock();
  }

  ngOnDestroy(): void {
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

  backdropKeydown(e: KeyboardEvent): void {
    if (!this.closeOnBackdrop) return;

    // Enter / Space => close
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.close();
    }
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
