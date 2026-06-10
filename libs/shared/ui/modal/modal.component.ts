import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

type UiModalSize = 'sm' | 'md' | 'lg';

let nextId = 0;

@Component({
  standalone: true,
  selector: 'app-ui-modal',
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiModalComponent implements AfterViewChecked, OnChanges, OnDestroy {
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();

  @Input() title: string | null = null;
  @Input() size: UiModalSize = 'md';
  @Input() closeOnBackdrop = true;

  /** used for aria-labelledby */
  readonly titleId = `ui-modal-title-${++nextId}`;

  @ViewChild('dialogPanel') private dialogPanel?: ElementRef<HTMLElement>;

  private focusedCurrentOpen = false;

  ngAfterViewChecked(): void {
    if (!this.open || this.focusedCurrentOpen) return;

    this.dialogPanel?.nativeElement.focus();
    this.focusedCurrentOpen = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      this.focusedCurrentOpen = false;
      this.syncBodyScrollLock();
    }
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

  stop(e: Event): void {
    e.stopPropagation();
  }

  get panelClasses(): string {
    const base = 'ff-modal-panel';
    const sizes: Record<UiModalSize, string> = {
      sm: 'ff-modal-panel--sm',
      md: 'ff-modal-panel--md',
      lg: 'ff-modal-panel--lg',
    };
    return `${base} ${sizes[this.size]}`;
  }

  private syncBodyScrollLock(): void {
    document.body.style.overflow = this.open ? 'hidden' : '';
  }
}
