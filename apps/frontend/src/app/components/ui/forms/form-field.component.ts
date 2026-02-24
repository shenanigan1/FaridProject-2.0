import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-form-field',
  imports: [CommonModule],
  template: `
    <div>
      <label class="text-sm text-slate-300">{{ label }}</label>

      <div class="mt-1">
        <ng-content></ng-content>
      </div>

      <p *ngIf="error" class="mt-1 text-xs text-red-300">{{ error }}</p>
      <p *ngIf="hint && !error" class="mt-1 text-xs text-slate-500">{{ hint }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent {
  @Input({ required: true }) label!: string;
  @Input() hint?: string;
  @Input() error?: string | null;
}
