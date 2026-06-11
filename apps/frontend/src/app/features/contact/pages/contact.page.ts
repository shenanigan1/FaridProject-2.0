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
      <div class="ff-app-container ff-app-container--compact ff-app-stack contact-page">

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

        <div class="contact-toolbar">
          <label class="ff-search-box contact-search">
            <input
            type="search"
            [formControl]="searchControl"
            aria-label="Search contacts"
              placeholder="Search contacts..."
            />
          </label>

          <div class="ff-chip-row contact-chips" aria-label="Contact filters">
            <button
              type="button"
              class="ff-chip"
              [class.ff-chip--active]="selectedRole() === 'all'"
              (click)="selectedRole.set('all')"
            >
              ALL
            </button>
            @for (role of roleFilters(); track role) {
              <button
                type="button"
                class="ff-chip"
                [class.ff-chip--active]="selectedRole() === role"
                (click)="selectedRole.set(role)"
              >
                {{ roleLabel(role) }}
              </button>
            }
          </div>
        </div>

        @if (pageMessage()) {
          <div class="ff-alert-inline">
            {{ pageMessage() }}
          </div>
        }

        @if (isLoading()) {
          <p class="ff-empty">Loading contacts...</p>
        } @else {
          <section class="contact-list" aria-labelledby="recent-contacts-title">
            <h2 id="recent-contacts-title" class="contact-section-title">RECENT CONTACTS</h2>
            @for (user of filteredUsers(); track user.id) {
              <a class="contact-card" [routerLink]="['/contact', user.id]">
                <span class="contact-avatar" aria-hidden="true">{{ initials(user) }}</span>
                <span class="contact-card__body">
                  <strong>{{ user.first_name }} {{ user.last_name }}</strong>
                  <small>{{ user.email }}</small>
                  <em>{{ roleLabel(user.role) }}</em>
                </span>

                <span class="ff-status-pill" [class.ff-status-pill--muted]="!user.is_active">
                  {{ user.is_active ? 'ACTIVE' : 'INACTIVE' }}
                </span>
              </a>
            }
          </section>

          @if (filteredUsers().length === 0) {
            <p class="ff-empty">Aucun contact en base pour ce filtre.</p>
          }
        }
      </div>

      @if (canManageContacts()) {
        <button
          type="button"
          class="ff-fab contact-fab"
          (click)="createPanelOpen.set(true)"
          aria-label="Creer un contact"
        >
          +
          <span class="contact-fab__label">Creer un contact</span>
        </button>
      }
    </section>
  `,
  styles: [
    `
      .contact-page {
        gap: 1.7rem;
      }

      .contact-fab__label {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
      }

      .contact-toolbar {
        display: grid;
        gap: 1.25rem;
      }

      .contact-search {
        min-height: 4.8rem;
        padding-left: 3.35rem;
      }

      .contact-search input {
        font-size: clamp(1.1rem, 4vw, 1.45rem);
      }

      .contact-chips {
        margin-top: 0;
      }

      .contact-section-title {
        margin: 1.3rem 0 1rem;
        color: var(--ff-color-primary-500);
        font-size: 0.86rem;
        font-weight: 950;
        letter-spacing: 0.18em;
      }

      .contact-section-title::after {
        content: "";
        display: block;
        width: 4rem;
        height: 0.22rem;
        margin-top: 0.45rem;
        border-radius: 999px;
        background: currentColor;
      }

      .contact-list {
        display: grid;
        gap: 0.9rem;
      }

      .contact-card {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 1.1rem;
        align-items: center;
        min-height: 7.9rem;
        border: 1px solid rgba(151, 164, 188, 0.24);
        border-radius: 1.55rem;
        background: #262d38;
        color: inherit;
        padding: 1.15rem;
        text-decoration: none;
        box-shadow: var(--ff-shadow-card), var(--ff-shadow-inset);
      }

      .contact-avatar {
        display: grid;
        width: 4.65rem;
        height: 4.65rem;
        place-items: center;
        border: 1px solid rgba(22, 131, 247, 0.42);
        border-radius: 50%;
        background: #203950;
        color: var(--ff-color-primary-500);
        font-size: 1.25rem;
        font-weight: 950;
      }

      .contact-card__body {
        display: grid;
        min-width: 0;
        gap: 0.16rem;
      }

      .contact-card__body strong {
        overflow: hidden;
        color: var(--ff-color-text-secondary);
        font-size: clamp(1.25rem, 4vw, 1.5rem);
        font-weight: 950;
        text-overflow: ellipsis;
        text-shadow: var(--ff-text-shadow);
        white-space: nowrap;
      }

      .contact-card__body small,
      .contact-card__body em {
        overflow: hidden;
        color: var(--ff-color-text-muted);
        font-style: normal;
        font-size: 1rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .contact-card__body em {
        color: var(--ff-color-primary-500);
        font-size: 0.78rem;
        font-weight: 950;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      @media (max-width: 520px) {
        .contact-card {
          grid-template-columns: auto minmax(0, 1fr);
        }

        .contact-card .ff-status-pill {
          grid-column: 1 / -1;
          width: fit-content;
        }
      }

      @media (min-width: 768px) {
        .contact-page {
          gap: 1rem;
        }

        .contact-toolbar {
          gap: 0.8rem;
        }

        .contact-search {
          min-height: 3.1rem;
          border-radius: 0.85rem;
          padding-left: 2.8rem;
        }

        .contact-search input {
          font-size: 0.98rem;
        }

        .contact-section-title {
          margin: 0.8rem 0 0.65rem;
          font-size: 0.72rem;
          letter-spacing: 0.14em;
        }

        .contact-list {
          gap: 0.65rem;
        }

        .contact-card {
          min-height: 4.7rem;
          gap: 0.85rem;
          border-radius: 0.95rem;
          padding: 0.85rem 1rem;
        }

        .contact-avatar {
          width: 2.85rem;
          height: 2.85rem;
          font-size: 0.9rem;
        }

        .contact-card__body strong {
          font-size: 1rem;
        }

        .contact-card__body small {
          font-size: 0.84rem;
        }

        .contact-card__body em {
          font-size: 0.68rem;
          letter-spacing: 0.1em;
        }
      }
    `,
  ],
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

  initials(user: AdminUser): string {
    const source = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email;
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  roleLabel(role: UserRole): string {
    const labels: Partial<Record<UserRole, string>> = {
      driver: 'CHAUFFEUR',
      candidate: 'CANDIDATE',
      manager: 'MANAGER',
      director: 'DIRECTOR',
      admin: 'ADMIN',
      employee: 'EMPLOYE',
      hr: 'RH',
    };
    return labels[role] ?? role.toUpperCase();
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
