import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type UiButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-ui-button-primary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button-primary.component.html',
  styleUrl: './button-primary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButtonPrimaryComponent {
  @Input() type: UiButtonType = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() label: string | null = null;
  @Input() icon: string | null = null;
  @Input() fullWidth = true;

  @Output() readonly clicked = new EventEmitter<void>();

  get isDisabled(): boolean {
    return this.disabled || this.loading;
  }

  get classes(): string {
    return [
      'ff-btn',
      'ff-btn-primary',
      this.fullWidth ? 'ff-btn--full' : '',
      this.loading ? 'ff-btn-loading' : '',
      this.isDisabled ? 'ff-btn-disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  onButtonClicked(): void {
    if (this.isDisabled || this.type === 'submit') {
      return;
    }

    this.clicked.emit();
  }
}