import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-secondary-button',
  template: `
    <button
      [attr.type]="type"
      [disabled]="disabled"
      class="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm
             border border-slate-800 bg-slate-900 hover:bg-slate-800 transition
             disabled:opacity-60 disabled:cursor-not-allowed">
      <ng-content></ng-content>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecondaryButtonComponent {
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
}
