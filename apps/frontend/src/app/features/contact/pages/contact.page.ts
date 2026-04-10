import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-contact-page',
  imports: [CommonModule],
  template: `
    <section class="min-h-[calc(100vh-144px)] bg-slate-950 px-4 py-6 text-slate-100">
      <div class="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 class="text-2xl font-semibold">Contact center</h1>
        <p class="mt-2 text-sm text-slate-400">
          TODO: implement HR contact management (candidate outreach queue, callback priorities, communication history).
        </p>
      </div>
    </section>
  `,
})
export class ContactPage {}
