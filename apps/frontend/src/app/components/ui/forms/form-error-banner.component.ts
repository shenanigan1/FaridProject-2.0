import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-form-error-banner',
  imports: [CommonModule],
  template: `
    <div *ngIf="message"
         class="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-200">
      {{ message }}
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormErrorBannerComponent {
  @Input() message: string | null = null;
}
