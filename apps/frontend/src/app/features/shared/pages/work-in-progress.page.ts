import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideIconComponent } from '../../../shared/ui/lucide-icon/lucide-icon.component';

@Component({
  standalone: true,
  selector: 'app-work-in-progress-page',
  imports: [CommonModule, RouterLink, LucideIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex min-h-screen items-center justify-center bg-[#05143a] px-4 text-slate-100">
      <article
        class="w-full max-w-lg rounded-3xl border border-slate-700/40 bg-[#1a2948] p-8 shadow-2xl"
      >
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300"
        >
          <app-lucide-icon name="alert-triangle" sizeClass="h-7 w-7"></app-lucide-icon>
        </div>
        <h1 class="mt-4 text-center text-2xl font-black uppercase tracking-[0.08em]">
          {{ title() }}
        </h1>
        <p class="mt-3 text-center text-sm text-slate-300">
          {{ description() }}
        </p>
        <div
          class="mt-6 rounded-xl border border-slate-700/60 bg-[#121f3b] px-4 py-3 text-sm text-slate-300"
        >
          Error: {{ errorCode() }} — {{ errorMessage() }}
        </div>
        <a
          routerLink="/login"
          class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3b82f6] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] transition hover:bg-blue-500"
        >
          <app-lucide-icon name="arrow-left" sizeClass="h-4 w-4"></app-lucide-icon>
          Back to login
        </a>
      </article>
    </section>
  `,
})
export class WorkInProgressPage {
  private readonly route = inject(ActivatedRoute);

  readonly title = computed(() => String(this.route.snapshot.data['title'] ?? 'Work in progress'));
  readonly description = computed(() =>
    String(this.route.snapshot.data['description'] ?? 'This feature is not available yet.'),
  );
  readonly errorCode = computed(() => String(this.route.snapshot.data['errorCode'] ?? 'WIP-001'));
  readonly errorMessage = computed(() =>
    String(this.route.snapshot.data['errorMessage'] ?? 'Page not implemented yet.'),
  );
}
