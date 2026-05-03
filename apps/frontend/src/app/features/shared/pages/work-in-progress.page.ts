import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { APP_ICONS } from '@shared/icons/app-icons';

@Component({
  standalone: true,
  selector: 'app-work-in-progress-page',
  imports: [CommonModule, RouterLink, LucideDynamicIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ff-app-screen">
      <article class="ff-app-container ff-app-panel ff-app-stack" style="max-width: 32rem">
        <div class="ff-icon-btn" style="margin-inline: auto; color: #fbbf24">
          <svg [lucideIcon]="icons.warning" style="width: 1.5rem; height: 1.5rem"></svg>
        </div>

        <h1 class="ff-section-title" style="text-align: center">{{ title() }}</h1>
        <p class="ff-app-subtitle" style="text-align: center">{{ description() }}</p>

        <div class="ff-empty">Error: {{ errorCode() }} - {{ errorMessage() }}</div>

        <a routerLink="/login" class="ff-btn ff-btn-primary">
          <svg [lucideIcon]="icons.back" style="width: 1rem; height: 1rem"></svg>
          Back to login
        </a>
      </article>
    </section>
  `,
})
export class WorkInProgressPage {
  private readonly route = inject(ActivatedRoute);

  readonly icons = {
    warning: APP_ICONS.warning,
    back: APP_ICONS.back,
  };

  readonly title = computed(() => String(this.route.snapshot.data['title'] ?? 'Work in progress'));

  readonly description = computed(() =>
    String(this.route.snapshot.data['description'] ?? 'This feature is not available yet.'),
  );

  readonly errorCode = computed(() =>
    String(this.route.snapshot.data['errorCode'] ?? 'WIP-001'),
  );

  readonly errorMessage = computed(() =>
    String(this.route.snapshot.data['errorMessage'] ?? 'Page not implemented yet.'),
  );
}
