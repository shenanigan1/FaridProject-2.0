import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type UserRole =
  | 'admin'
  | 'hr'
  | 'director'
  | 'manager'
  | 'employee'
  | 'candidate'
  | 'driver';

export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface CreateAdminUserPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

export interface UpdateAdminUserPayload {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  is_active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RolesAdminService {
  private readonly http = inject(HttpClient);

  listUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>('/api/users/');
  }

  createUser(payload: CreateAdminUserPayload): Observable<AdminUser> {
    return this.http.post<AdminUser>('/api/users/', {
      ...payload,
      is_active: true,
    });
  }

  updateUserRole(userId: number, role: UserRole): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`/api/users/${userId}/`, { role });
  }

  updateUser(userId: number, payload: UpdateAdminUserPayload): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`/api/users/${userId}/`, payload);
  }

  activateUser(userId: number): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`/api/users/${userId}/activate/`, {});
  }

  deactivateUser(userId: number): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`/api/users/${userId}/deactivate/`, {});
  }
}

