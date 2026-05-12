import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';

import { AuthSessionService } from '@auth/services/auth-session.service';
import { MeResponse } from '@auth/models/auth.models';
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
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideDynamicIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ff-app-screen">
      <div class="ff-app-container ff-app-stack">
        <header class="ff-app-header">
          <button routerLink="/contact" class="ff-btn ff-btn-secondary">
            <svg [lucideIcon]="icons.back" style="width: 1rem; height: 1rem"></svg>
            Back
          </button>

          @if (contact() && canManageContacts()) {
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

          @if (canManageContacts()) {
            <article class="ff-app-panel ff-app-stack">
              <div>
                <p class="ff-app-kicker">ADMIN ACCESS</p>
                <h2 class="ff-row-title">Modifier le contact</h2>
              </div>

              <form [formGroup]="editForm" (ngSubmit)="saveContact()" class="ff-form-grid ff-form-grid--two">
                <label>
                  <span class="ff-field-label">Email</span>
                  <input formControlName="email" type="email" class="ff-control" />
                  @if (editForm.controls.email.touched && editForm.controls.email.hasError('required')) {
                    <small class="ff-field-error">Champ obligatoire</small>
                  }
                </label>

                <label>
                  <span class="ff-field-label">Nouveau mot de passe</span>
                  <input formControlName="password" type="password" class="ff-control" />
                </label>

                <label>
                  <span class="ff-field-label">Prénom</span>
                  <input formControlName="first_name" type="text" class="ff-control" />
                  @if (editForm.controls.first_name.touched && editForm.controls.first_name.hasError('required')) {
                    <small class="ff-field-error">Champ obligatoire</small>
                  }
                </label>

                <label>
                  <span class="ff-field-label">Nom</span>
                  <input formControlName="last_name" type="text" class="ff-control" />
                  @if (editForm.controls.last_name.touched && editForm.controls.last_name.hasError('required')) {
                    <small class="ff-field-error">Champ obligatoire</small>
                  }
                </label>

                <label>
                  <span class="ff-field-label">Rôle</span>
                  <select formControlName="role" class="ff-control">
                    @for (role of roleOptions; track role) {
                      <option [value]="role">{{ role }}</option>
                    }
                  </select>
                </label>

                <button type="submit" class="ff-btn ff-btn-primary">
                  Enregistrer
                </button>
              </form>
            </article>
          } @else {
            <div class="ff-alert-inline">
              La modification du contact est réservée aux administrateurs et à la direction.
            </div>
          }
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
  private readonly auth = inject(AuthSessionService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly icons = APP_ICONS;
  readonly roleOptions = ROLE_OPTIONS;
  readonly contact = signal<AdminUser | null>(null);
  readonly currentUser = signal<MeResponse | null>(null);
  readonly pageMessage = signal<string | null>(null);
  readonly menuOpen = signal(false);
  readonly roleMenuOpen = signal(false);
  readonly editForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    role: this.fb.nonNullable.control<UserRole>('employee', Validators.required),
  });

  readonly canManageContacts = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'director';
  });

  readonly fullName = computed(() => {
    const user = this.contact();
    return user ? `${user.first_name} ${user.last_name}`.trim() : '';
  });

  constructor() {
    this.auth
      .loadMeOnce()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((me) => this.currentUser.set(me));
    this.loadContact();
  }

  dismissMenu(): void {
    this.menuOpen.set(false);
    this.roleMenuOpen.set(false);
  }

  onRoleChange(event: Event): void {
    if (!this.canManageContacts()) {
      this.pageMessage.set('Action réservée aux administrateurs et à la direction.');
      return;
    }

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

  saveContact(): void {
    const user = this.contact();
    if (!user) {
      return;
    }

    if (!this.canManageContacts()) {
      this.pageMessage.set('Action réservée aux administrateurs et à la direction.');
      return;
    }

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const payload = this.editForm.getRawValue();
    const password = payload.password.trim();

    this.api
      .updateUser(user.id, {
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        role: payload.role,
        ...(password ? { password } : {}),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.contact.set(updated);
          this.patchEditForm(updated);
          this.pageMessage.set('Contact mis à jour.');
        },
        error: () => {
          this.pageMessage.set('Impossible de modifier le contact.');
        },
      });
  }

  toggleActive(): void {
    const user = this.contact();
    if (!user) {
      return;
    }

    if (!this.canManageContacts()) {
      this.pageMessage.set('Action réservée aux administrateurs et à la direction.');
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
          this.patchEditForm(contact);
        },
        error: () => {
          this.pageMessage.set('Unable to load contact details.');
        },
      });
  }

  private patchEditForm(user: AdminUser): void {
    this.editForm.reset({
      email: user.email,
      password: '',
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    });
  }
}
