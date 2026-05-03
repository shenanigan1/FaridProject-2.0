import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { LoginRequest, LoginResponse, MeResponse } from '@auth/models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/auth`;

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login/`, {
      email: payload.email.trim(),
      password: payload.password,
    });
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.base}/me/`);
  }

  refresh(refresh: string): Observable<{ access: string; refresh?: string }> {
    return this.http.post<{ access: string; refresh?: string }>(`${this.base}/refresh/`, {
      refresh,
    });
  }
}
