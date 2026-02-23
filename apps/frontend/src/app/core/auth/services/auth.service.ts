import { LoginRequest, LoginResponse, MeResponse } from './../auth.models';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiBaseUrl}/api/auth`;

  constructor(private readonly http: HttpClient, private readonly tokens: TokenStorageService) {}

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login/`, payload);
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.base}/me/`);
  }

  refresh(refresh: string): Observable<{ access: string; refresh?: string }> {
    return this.http.post<{ access: string; refresh?: string }>(`${this.base}/api/auth/refresh/`, {
      refresh,
    });
  }

  logout(): void {
    this.tokens.clear();
  }

  isAuthenticated(): boolean {
    return this.tokens.isAuthenticated();
  }
}


