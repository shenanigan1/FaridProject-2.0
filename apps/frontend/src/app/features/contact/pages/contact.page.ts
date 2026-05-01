import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AdminUser, RolesAdminService, UserRole } from '@features/roles/services/roles-admin.service';

@Component({
  standalone: true,
  selector: 'app-contact-list-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ff-app-screen">
      <div class="ff-app-container ff-app-stack">
        <header class="ff-app-header">
          <div>
            <p class="ff-app-kicker">CONTACTS</p>
            <h1 class="ff-app-title">Directory</h1>
          </div>
        </header>

        <div class="ff-app-panel ff-app-stack">
          <input
            type="search"
            [formControl]="searchControl"
            aria-label="Search contacts"
            class="ff-control"
          />

          <select class="ff-control" [value]="selectedRole()" (change)="onRoleFilterChange($event)">
            <option value="all">All contacts</option>
            @for (role of roleFilters(); track role) {
              <option [value]="role">{{ role }}</option>
            }
          </select>
        </div>

        @if (pageMessage()) {
          <div class="ff-alert-inline">
            {{ pageMessage() }}
          </div>
        }

        @if (isLoading()) {
          <p class="ff-empty">Loading contacts...</p>
        } @else {
          <div class="ff-app-stack">
            @for (user of filteredUsers(); track user.id) {
              <article class="ff-data-card" [routerLink]="['/contact', user.id]">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h2 class="ff-row-title">{{ user.first_name }} {{ user.last_name }}</h2>
                    <p class="ff-row-meta">{{ user.email }}</p>
                    <p class="ff-row-meta">{{ user.role }}</p>
                  </div>

                  <span class="ff-status-pill" [class.ff-status-pill--muted]="!user.is_active">
                    {{ user.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </article>
            }
          </div>

          @if (filteredUsers().length === 0) {
            <p class="ff-empty">Aucun contact en base pour ce filtre.</p>
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
  readonly selectedRole = signal<'all' | UserRole>('all');

  readonly roleFilters = computed(() =>
    Array.from(new Set(this.users().map((user) => user.role))).sort(),
  );

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
    this.selectedRole.set(target.value as 'all' | UserRole);
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
