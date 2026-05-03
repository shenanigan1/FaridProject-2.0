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
import { LucideDynamicIcon } from '@lucide/angular';

import { APP_ICONS } from '@shared/icons/app-icons';
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
    <section class="ff-app-screen">
      <div class="ff-app-container ff-app-stack">
        <header class="ff-app-header">
          <button routerLink="/contact" class="ff-btn ff-btn-secondary">
            <svg [lucideIcon]="icons.back" style="width: 1rem; height: 1rem"></svg>
            Back
          </button>

          @if (contact()) {
            <button type="button" class="ff-btn ff-btn-secondary" (click)="menuOpen.set(true)">
              <svg [lucideIcon]="icons.moreVertical" style="width: 1rem; height: 1rem"></svg>
            </button>
          }
        </header>

        @if (pageMessage()) {
          <div class="ff-alert-inline">{{ pageMessage() }}</div>
        }

        @if (contact(); as currentContact) {
          <article class="ff-data-card">
            <div class="ff-inline-actions" style="align-items: flex-start; justify-content: space-between">
              <div>
                <p class="ff-app-kicker">{{ currentContact.role }}</p>
                <h1 class="ff-app-title">{{ fullName() }}</h1>
                <p class="ff-row-meta">{{ currentContact.email }}</p>
              </div>

              <span class="ff-status-pill" [class.ff-status-pill--muted]="!currentContact.is_active">
                {{ currentContact.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </article>
        } @else {
          <p class="ff-empty">Loading contact details...</p>
        }
      </div>

      @if (menuOpen() && contact(); as currentContact) {
        <div class="ff-modal-scrim">
          <div class="ff-app-panel" style="width: min(100%, 28rem)">
            <header class="ff-app-header" style="margin-bottom: 1rem">
              <div>
                <p class="ff-app-kicker">ACTIONS</p>
                <h2 class="ff-app-title">Contact</h2>
              </div>
            </header>

            <div class="ff-app-stack">
              <button type="button" class="ff-btn ff-btn-secondary" (click)="roleMenuOpen.set(!roleMenuOpen())">
                Change role
              </button>

              @if (roleMenuOpen()) {
                <select class="ff-control" [value]="currentContact.role" (change)="onRoleChange($event)">
                  @for (role of roleOptions; track role) {
                    <option [value]="role">{{ role }}</option>
                  }
                </select>
              }

              <button type="button" class="ff-btn ff-btn-secondary" (click)="toggleActive()">
                {{ currentContact.is_active ? 'Deactivate' : 'Activate' }}
              </button>

              <button type="button" class="ff-btn ff-btn-primary" (click)="dismissMenu()">
                Close
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

    this.api
      .updateUserRole(user.id, target.value as UserRole)
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
