import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-form-card',
  template: `
    <div class="rounded-2xl bg-slate-900/60 border border-slate-800 p-5
                shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)]">
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormCardComponent {}
