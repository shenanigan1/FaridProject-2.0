import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-ui-empty-state',
  imports: [CommonModule],
  template: `
    <div class="ff-empty text-center">
      <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[var(--ff-radius-card)] bg-[var(--ff-color-surface-2)]">
        <ng-content select="[icon]"></ng-content>
      </div>

      <h3 class="ff-section-title text-base">
        {{ title }}
      </h3>

      @if (subtitle) {
        <p class="ff-row-meta mt-1">
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
