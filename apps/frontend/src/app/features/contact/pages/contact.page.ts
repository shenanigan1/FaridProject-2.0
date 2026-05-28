import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MeResponse } from '@auth/models/auth.models';
import { AuthSessionService } from '@auth/services/auth-session.service';
import {
  AdminUser,
  RolesAdminService,
  UserRole,
} from '@features/roles/services/roles-admin.service';
import { UiModalComponent } from '@lib-ui/modal/modal.component';

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
  selector: 'app-contact-list-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ff-app-screen">
      <div class="ff-app-container ff-app-stack">
        <header class="ff-app-header">
          <div>
            <p class="ff-app-kicker">CONTACTS</p>
            <h1 class="ff-app-title">Directory</h1>
          </div>

          @if (canManageContacts()) {
            <button type="button" class="ff-btn ff-btn-primary" (click)="createPanelOpen.set(true)">
              Create Contact
            </button>
          }
        </header>

        <app-ui-modal
          [open]="canManageContacts() && createPanelOpen()"
          (openChange)="onCreateModalChange($event)"
          title="Creer un acces utilisateur"
          size="lg"
        >
          <form [formGroup]="createForm" (ngSubmit)="createContact()" class="ff-form-grid ff-form-grid--two">
            <label>
              <span class="ff-field-label">Email</span>
              <input formControlName="email" type="email" class="ff-control" />
              @if (createForm.controls.email.touched && createForm.controls.email.hasError('required')) {
                <small class="ff-field-error">Champ obligatoire</small>
              }
            </label>

            <label>
              <span class="ff-field-label">Mot de passe</span>
              <input formControlName="password" type="password" class="ff-control" />
              @if (createForm.controls.password.touched && createForm.controls.password.hasError('required')) {
                <small class="ff-field-error">Champ obligatoire</small>
              }
            </label>

            <label>
              <span class="ff-field-label">Prenom</span>
              <input formControlName="first_name" type="text" class="ff-control" />
              @if (createForm.controls.first_name.touched && createForm.controls.first_name.hasError('required')) {
                <small class="ff-field-error">Champ obligatoire</small>
              }
            </label>

            <label>
              <span class="ff-field-label">Nom</span>
              <input formControlName="last_name" type="text" class="ff-control" />
              @if (createForm.controls.last_name.touched && createForm.controls.last_name.hasError('required')) {
                <small class="ff-field-error">Champ obligatoire</small>
              }
            </label>

            <label>
              <span class="ff-field-label">Role</span>
              <select formControlName="role" class="ff-control">
                @for (role of roleOptions; track role) {
                  <option [value]="role">{{ role }}</option>
                }
              </select>
            </label>

            <div modal-actions class="ff-inline-actions ff-u-between ff-u-full">
              <button type="button" class="ff-btn ff-btn-secondary" (click)="closeCreatePanel()">
                Annuler
              </button>
              <button type="submit" class="ff-btn ff-btn-primary">Creer le contact</button>
            </div>
          </form>
        </app-ui-modal>

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
                <div class="ff-inline-actions ff-inline-actions--split-start">
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
  private readonly auth = inject(AuthSessionService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly roleOptions = ROLE_OPTIONS;
  readonly isLoading = signal(true);
  readonly pageMessage = signal<string | null>(null);
  readonly users = signal<AdminUser[]>([]);
  readonly currentUser = signal<MeResponse | null>(null);
  readonly createPanelOpen = signal(false);
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly selectedRole = signal<'all' | UserRole>('all');
  readonly createForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    role: this.fb.nonNullable.control<UserRole>('manager', Validators.required),
  });

  readonly canManageContacts = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'director';
  });

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
    this.auth
      .loadMeOnce()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((me) => this.currentUser.set(me));
    this.loadContacts();
  }

  onRoleFilterChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    this.selectedRole.set(target.value as 'all' | UserRole);
  }

  onCreateModalChange(open: boolean): void {
    if (open) {
      this.createPanelOpen.set(true);
      return;
    }

    this.closeCreatePanel();
  }

  closeCreatePanel(): void {
    this.createPanelOpen.set(false);
    this.createForm.reset({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'manager',
    });
  }

  createContact(): void {
    if (!this.canManageContacts()) {
      this.pageMessage.set('Action reservee aux administrateurs et a la direction.');
      return;
    }

    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.api
      .createUser(this.createForm.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          this.users.set([created, ...this.users()]);
          this.pageMessage.set('Contact cree.');
          this.closeCreatePanel();
        },
        error: () => {
          this.pageMessage.set('Impossible de creer le contact.');
        },
      });
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
