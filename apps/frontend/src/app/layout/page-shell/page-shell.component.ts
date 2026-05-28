import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-form-page-shell',
  imports: [CommonModule],
  template: `
    <section class="ff-app-screen">
      <div class="ff-app-container ff-app-container--narrow ff-app-stack">
        <header class="ff-app-header">
          <div>
            <p class="ff-app-kicker">Workspace</p>
            <h1 class="ff-app-title">{{ title }}</h1>

            @if (subtitle) {
              <p class="ff-app-subtitle">
                {{ subtitle }}
              </p>
            }
          </div>

          <ng-content select="[shell-actions]"></ng-content>
        </header>

        <ng-content></ng-content>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageShellComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
}
