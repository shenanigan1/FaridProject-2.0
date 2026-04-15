import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-profile-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="min-h-[calc(100vh-144px)] bg-slate-950 px-4 py-6 text-slate-100">
      <div class="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 class="text-2xl font-semibold">Profile settings</h1>
        <p class="mt-2 text-sm text-slate-400">
          TODO: implement profile update form (name, phone, password, avatar) when backend profile update endpoint is finalized.
        </p>

        <div class="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-400">
          Placeholder section for profile editor UI.
        </div>

        <a
          routerLink="/dashboard"
          class="mt-6 inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
        >
          Back to dashboard
        </a>
      </div>
    </section>
  `,
})
export class ProfilePage {}
