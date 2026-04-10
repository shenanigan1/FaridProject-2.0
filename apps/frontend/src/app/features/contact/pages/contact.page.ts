import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AdminUser, RolesAdminService, UserRole } from '@features/roles/services/roles-admin.service';

const ROLE_FILTERS: Array<'all' | UserRole> = [
  'all',
  'admin',
  'hr',
  'director',
  'manager',
  'employee',
  'candidate',
  'driver',
];

@Component({
  standalone: true,
  selector: 'app-contact-list-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-h-[calc(100vh-144px)] bg-slate-950 px-4 py-4 text-slate-100">
      <div class="mx-auto max-w-4xl space-y-4">
        <header>
          <h1 class="text-xl font-semibold">Contacts</h1>
          <p class="text-sm text-slate-400">Search contacts and filter by role.</p>
        </header>

        <div class="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
          <input
            type="search"
            [formControl]="searchControl"
            placeholder="Search contacts by name, role, email, or ID..."
            class="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />

          <select
            class="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            [value]="selectedRole()"
            (change)="onRoleFilterChange($event)"
          >
            @for (role of roleFilters; track role) {
              <option [value]="role">{{ role === 'all' ? 'All Contacts' : role }}</option>
            }
          </select>
        </div>

        @if (pageMessage()) {
          <div class="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-200">
            {{ pageMessage() }}
          </div>
        }

        @if (isLoading()) {
          <p class="text-sm text-slate-400">Loading contacts…</p>
        } @else {
          <div class="space-y-3">
            @for (user of filteredUsers(); track user.id) {
              <article
                class="rounded-2xl border border-slate-800 bg-slate-900/70 p-3"
                [routerLink]="['/contact', user.id]"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h2 class="text-lg font-semibold">{{ user.first_name }} {{ user.last_name }}</h2>
                    <p class="text-xs uppercase tracking-[0.12em] text-slate-400">{{ user.role }}</p>
                  </div>
                  <span
                    class="rounded-md border px-2 py-1 text-[10px] font-semibold uppercase"
                    [class.border-emerald-500/40]="user.is_active"
                    [class.text-emerald-300]="user.is_active"
                    [class.border-slate-600]="!user.is_active"
                    [class.text-slate-400]="!user.is_active"
                  >
                    {{ user.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </div>

                <div class="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" class="rounded-lg border border-slate-700 px-3 py-2 text-xs">📞 Call</button>
                  <button type="button" class="rounded-lg border border-slate-700 px-3 py-2 text-xs">💬 Message</button>
                </div>
              </article>
            }
          </div>

          @if (filteredUsers().length === 0) {
            <p class="text-sm text-slate-400">No contacts match your current search/filter.</p>
          }
        }
      </div>
    </section>
  `,
})
export class ContactPage {
  private readonly api = inject(RolesAdminService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(true);
  readonly pageMessage = signal<string | null>(null);
  readonly users = signal<AdminUser[]>([]);
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly roleFilters = ROLE_FILTERS;
  readonly selectedRole = signal<'all' | UserRole>('all');

  readonly filteredUsers = computed(() => {
    const query = this.searchControl.value.trim().toLowerCase();
    const selectedRole = this.selectedRole();

    return this.users().filter((user) => {
      const roleMatch = selectedRole === 'all' || user.role === selectedRole;
      if (!roleMatch) {
        return false;
      }

      if (!query) {
        return true;
      }

      const blob =
        `${user.id} ${user.first_name} ${user.last_name} ${user.email} ${user.role}`.toLowerCase();
      return blob.includes(query);
    });
  });

  constructor() {
    this.loadContacts();
  }

  onRoleFilterChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const role = target.value as 'all' | UserRole;
    this.selectedRole.set(role);
  }

  private loadContacts(): void {
    this.api
      .listUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.users.set(users);
          this.isLoading.set(false);
          this.pageMessage.set(null);
        },
        error: () => {
          this.isLoading.set(false);
          this.pageMessage.set('Unable to load contacts.');
        },
      });
  }
}
