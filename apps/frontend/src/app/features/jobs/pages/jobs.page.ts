import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PositionsListPage } from '@features/positions/pages/positions-list.page';

@Component({
  standalone: true,
  selector: 'app-jobs-page',
  imports: [CommonModule, PositionsListPage],
  template: `
    <section class="bg-slate-950 text-slate-100">
      <header class="mx-auto max-w-6xl px-4 pt-4">
        <h1 class="text-xl font-semibold">Jobs</h1>
        <p class="text-sm text-slate-400">
          Create, manage job postings, and open applicant lists to launch tests or refuse applications.
        </p>
        <!-- TODO: replace this bridge layout with dedicated Jobs design system once refactor phase 2 starts. -->
      </header>
      <app-positions-list-page />
    </section>
  `,
})
export class JobsPage {}
