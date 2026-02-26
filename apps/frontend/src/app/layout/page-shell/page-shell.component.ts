import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-form-page-shell',
  imports: [CommonModule],
  template: `
    <div class="min-h-[calc(100vh-144px)] bg-slate-950 text-slate-100 p-6">
      <div class="max-w-2xl mx-auto">
        <div class="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold">{{ title }}</h2>
            <p *ngIf="subtitle" class="text-sm text-slate-400">{{ subtitle }}</p>
          </div>
          <ng-content select="[shell-actions]"></ng-content>
        </div>

        <ng-content></ng-content>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageShellComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
}
