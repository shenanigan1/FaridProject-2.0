import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { APP_ICONS } from '@shared/icons/app-icons';
import { LucideDynamicIcon } from '@lucide/angular';

import {
  AdminUser,
  RolesAdminService,
  UserRole,
} from '@features/roles/services/roles-admin.service';

const ROLE_OPTIONS: UserRole[] = [
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
  selector: 'app-contact-detail-page',
  imports: [CommonModule, RouterLink, LucideDynamicIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-h-[calc(100vh-144px)] bg-slate-950 px-4 py-4 text-slate-100">
      <div class="mx-auto max-w-3xl space-y-4">
        <header class="flex items-center justify-between">
          <button
            routerLink="/contact"
            class="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1.5 text-sm"
          >
            <svg [lucideIcon]="icons.back" class="h-4 w-4"></svg>
            Back
          </button>

          <button
            type="button"
            class="inline-flex items-center rounded-full border border-slate-700 px-3 py-1.5 text-sm"
            (click)="menuOpen.set(true)"
          >
            <svg [lucideIcon]="icons.home" class="h-4 w-4"></svg>
          </button>
        </header>

        @if (pageMessage()) {
          <div
            class="rounded-xl border border-blue-500/25 bg-blue-500/10 p-3 text-sm text-blue-200"
          >
            {{ pageMessage() }}
          </div>
        }

        @if (contact(); as currentContact) {
          <article class="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h1 class="text-3xl font-bold">{{ fullName() }}</h1>
                <p class="mt-1 text-slate-400">
                  {{ currentContact.role }} • {{ currentContact.email }}
                </p>
              </div>

              <span
                class="rounded-md border px-2 py-1 text-xs font-semibold uppercase"
                [class.border-emerald-500/40]="currentContact.is_active"
                [class.text-emerald-300]="currentContact.is_active"
                [class.border-slate-600]="!currentContact.is_active"
                [class.text-slate-400]="!currentContact.is_active"
              >
                {{ currentContact.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>

            <div class="mt-4 grid grid-cols-3 gap-2">
              <button type="button" class="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold">
                Call
              </button>
              <button type="button" class="rounded-lg border border-slate-700 px-3 py-2 text-xs">
                Message
              </button>
              <button type="button" class="rounded-lg border border-slate-700 px-3 py-2 text-xs">
                Email
              </button>
            </div>

            <div
              class="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300"
            >
              TODO: add personal info block (phone, address, notes) when profile/contact endpoint
              fields are exposed.
            </div>
          </article>
        } @else {
          <p class="text-sm text-slate-400">Loading contact details…</p>
        }
      </div>

      @if (menuOpen() && contact(); as currentContact) {
        <div class="fixed inset-0 z-50 flex items-end bg-black/60 p-4">
          <div class="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <h2 class="text-lg font-semibold">Action Menu</h2>
            <p class="text-xs text-slate-400">ID: {{ currentContact.id }} • {{ currentContact.role }}</p>

            <div class="mt-4 space-y-3">
              <button
                type="button"
                class="w-full rounded-lg border border-slate-700 px-3 py-2 text-left"
                (click)="roleMenuOpen.set(!roleMenuOpen())"
              >
                Change Role
              </button>

              @if (roleMenuOpen()) {
                <div class="rounded-xl border border-slate-700 bg-slate-950 p-3">
                  <label class="mb-1 block text-xs text-slate-400" for="role-select">
                    New role
                  </label>

                  <select
                    id="role-select"
                    class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                    [value]="currentContact.role"
                    (change)="onRoleChange($event)"
                  >
                    @for (role of roleOptions; track role) {
                      <option [value]="role">{{ role }}</option>
                    }
                  </select>
                </div>
              }

              <button
                type="button"
                class="w-full rounded-lg px-3 py-2 text-left"
                [class.bg-red-500/15]="currentContact.is_active"
                [class.text-red-300]="currentContact.is_active"
                [class.bg-emerald-500/15]="!currentContact.is_active"
                [class.text-emerald-300]="!currentContact.is_active"
                (click)="toggleActive()"
              >
                {{ currentContact.is_active ? 'Deactivate' : 'Activate' }}
              </button>

              <button
                type="button"
                class="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm"
                (click)="dismissMenu()"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
})
export class ContactDetailPage {
  private readonly api = inject(RolesAdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly icons = APP_ICONS;

  readonly roleOptions = ROLE_OPTIONS;
  readonly contact = signal<AdminUser | null>(null);
  readonly pageMessage = signal<string | null>(null);
  readonly menuOpen = signal(false);
  readonly roleMenuOpen = signal(false);

  readonly fullName = computed(() => {
    const user = this.contact();
    return user ? `${user.first_name} ${user.last_name}`.trim() : '';
  });

  constructor() {
    this.loadContact();
  }

  dismissMenu(): void {
    this.menuOpen.set(false);
    this.roleMenuOpen.set(false);
  }

  onRoleChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    const user = this.contact();
    if (!user) {
      return;
    }

    const role = target.value as UserRole;

    this.api
      .updateUserRole(user.id, role)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.contact.set(updated);
          this.pageMessage.set(`Role updated to ${updated.role}.`);
          this.roleMenuOpen.set(false);
        },
        error: () => {
          this.pageMessage.set('Unable to update role.');
        },
      });
  }

  toggleActive(): void {
    const user = this.contact();
    if (!user) {
      return;
    }

    const request$ = user.is_active
      ? this.api.deactivateUser(user.id)
      : this.api.activateUser(user.id);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.contact.set({ ...user, is_active: !user.is_active });
        this.pageMessage.set(user.is_active ? 'Contact deactivated.' : 'Contact activated.');
        this.dismissMenu();
      },
      error: () => {
        this.pageMessage.set('Unable to update active status.');
      },
    });
  }

  private loadContact(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.pageMessage.set('Invalid contact id.');
      void this.router.navigateByUrl('/contact');
      return;
    }

    this.api
      .listUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          const contact = users.find((user) => user.id === id) ?? null;

          if (!contact) {
            this.pageMessage.set('Contact not found.');
            return;
          }

          this.contact.set(contact);
        },
        error: () => {
          this.pageMessage.set('Unable to load contact details.');
        },
      });
  }
}