import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-button-primary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button-primary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButtonPrimaryComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() label: string | null = null;
  @Input() icon: string | null = null;

  @Output() readonly clicked = new EventEmitter<void>();

  get isDisabled(): boolean {
    return this.disabled || this.loading;
  }

  onButtonClicked(): void {
    if (this.isDisabled) {
      return;
    }

    this.clicked.emit();
  }
}
