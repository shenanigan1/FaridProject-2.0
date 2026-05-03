import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-ui-form-field',
  imports: [CommonModule],
  template: `
    <div>
      @if (label) {
        <!-- not a native <label> to avoid association lint error -->
        <div class="ff-field-label">
          {{ label }}
        </div>
      }

      <div [class.mt-1]="!!label">
        <ng-content></ng-content>
      </div>

      @if (error) {
        <p class="ff-field-error">
          {{ error }}
        </p>
      } @else if (hint) {
        <p class="ff-field-hint">
          {{ hint }}
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFormFieldComponent {
  @Input() label: string | null = null;
  @Input() hint: string | null = null;
  @Input() error: string | null = null;
}
