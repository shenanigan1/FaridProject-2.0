import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LoginRequest, LoginResponse } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // ✅ Mets ici ton endpoint JWT
  private readonly loginUrl = '/api/auth/login/';

  constructor(private readonly http: HttpClient) {}

  async login(payload: LoginRequest): Promise<LoginResponse> {
    try {
      return await firstValueFrom(this.http.post<LoginResponse>(this.loginUrl, payload));
    } catch (err: any) {
      // tente de remonter un message utile (DRF)
      const apiMsg =
        err?.error?.detail ||
        err?.error?.message ||
        (typeof err?.error === 'string' ? err.error : null);

      throw new Error(apiMsg ?? 'Login failed.');
    }
  }
}
