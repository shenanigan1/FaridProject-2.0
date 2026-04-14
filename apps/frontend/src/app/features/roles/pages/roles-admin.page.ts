import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  selector: 'app-roles-admin-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './roles-admin.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesAdminPage {
  private readonly api = inject(RolesAdminService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly roleOptions = ROLE_OPTIONS;
  users: AdminUser[] = [];
  isLoading = true;
  pageMessage: string | null = null;

  readonly createForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    role: this.fb.nonNullable.control<UserRole>('manager', Validators.required),
  });

  constructor() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.api
      .listUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.isLoading = false;
        },
        error: () => {
          this.pageMessage = 'Unable to load users.';
          this.isLoading = false;
        },
      });
  }

  createUser(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.pageMessage = null;
    this.api
      .createUser(this.createForm.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pageMessage = 'User created.';
          this.createForm.reset({
            email: '',
            password: '',
            first_name: '',
            last_name: '',
            role: 'manager',
          });
          this.loadUsers();
        },
        error: () => {
          this.pageMessage = 'Unable to create user.';
        },
      });
  }

  onRoleChange(user: AdminUser, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const role = target.value as UserRole;
    this.api
      .updateUserRole(user.id, role)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pageMessage = `Role updated for ${user.email}.`;
          this.loadUsers();
        },
        error: () => {
          this.pageMessage = `Unable to update role for ${user.email}.`;
        },
      });
  }

  toggleUser(user: AdminUser): void {
    const req$ = user.is_active
      ? this.api.deactivateUser(user.id)
      : this.api.activateUser(user.id);

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.pageMessage = user.is_active
          ? `${user.email} deactivated.`
          : `${user.email} activated.`;
        this.loadUsers();
      },
      error: () => {
        this.pageMessage = `Unable to update active status for ${user.email}.`;
      },
    });
  }
}

