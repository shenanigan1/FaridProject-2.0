import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-jobs-page',
  imports: [CommonModule],
  template: `
    <section class="min-h-[calc(100vh-144px)] bg-slate-950 px-4 py-6 text-slate-100">
      <div class="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 class="text-2xl font-semibold">Jobs</h1>
        <p class="mt-2 text-sm text-slate-400">
          TODO: replace this placeholder with the new HR jobs experience (list, filters, create, lifecycle workflow).
        </p>
      </div>
    </section>
  `,
})
export class JobsPage {}
