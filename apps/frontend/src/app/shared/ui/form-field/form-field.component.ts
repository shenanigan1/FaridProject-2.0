import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'ui-form-field',
  imports: [CommonModule],
  template: `
    <div>
      <label *ngIf="label" class="text-sm text-slate-300">{{ label }}</label>

      <div [class.mt-1]="!!label">
        <ng-content></ng-content>
      </div>

      <p *ngIf="error" class="mt-1 text-xs text-red-300">{{ error }}</p>
      <p *ngIf="hint && !error" class="mt-1 text-xs text-slate-500">{{ hint }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFormFieldComponent {
  @Input() label: string | null = null;
  @Input() hint: string | null = null;
  @Input() error: string | null = null;
}
