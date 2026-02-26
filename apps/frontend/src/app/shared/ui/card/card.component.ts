import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

type UiCardVariant = 'default' | 'form';

@Component({
  standalone: true,
  selector: 'ui-card',
  template: `
    <div [class]="classes">
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiCardComponent {
  @Input() variant: UiCardVariant = 'form';

  get classes(): string {
    // Keep styling centralized; variants let you reuse it outside auth/forms later.
    if (this.variant === 'default') {
      return 'rounded-2xl border border-slate-800 bg-slate-900 p-5';
    }
    return 'rounded-2xl bg-slate-900/60 border border-slate-800 p-5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)]';
  }
}
