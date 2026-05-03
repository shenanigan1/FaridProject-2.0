import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-ui-empty-state',
  imports: [CommonModule],
  template: `
    <div class="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 text-center">
      <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/50">
        <ng-content select="[icon]"></ng-content>
      </div>

      <h3 class="text-base font-semibold text-slate-100">
        {{ title }}
      </h3>

      @if (subtitle) {
        <p class="mt-1 text-sm text-slate-400">
          {{ subtitle }}
        </p>
      }

      <div class="mt-4 flex justify-center gap-2">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiEmptyStateComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle: string | null = null;
}