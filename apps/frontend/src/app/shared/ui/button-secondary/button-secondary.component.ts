import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-button-secondary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button-secondary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButtonSecondaryComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
}
