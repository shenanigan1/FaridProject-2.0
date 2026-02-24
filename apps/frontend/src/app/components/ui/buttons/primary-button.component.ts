import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-primary-button',
  template: `
    <button
      [attr.type]="type"
      [disabled]="disabled"
      class="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold
             bg-blue-600 text-white hover:bg-blue-500 transition
             disabled:opacity-60 disabled:cursor-not-allowed">
      <ng-content></ng-content>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrimaryButtonComponent {
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
}
