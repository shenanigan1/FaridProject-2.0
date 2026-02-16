import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

interface LoginResponse {
  access: string;
  refresh: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = '/api/auth/login/';

  constructor(private http: HttpClient) {}

  /**
   * Login: POST email/password → store tokens
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(this.API_URL, { email, password })
      .pipe(
        tap((tokens) => {
          localStorage.setItem('access', tokens.access);
          localStorage.setItem('refresh', tokens.refresh);
        })
      );
  }

  /**
   * Logout: remove tokens
   */
  logout(): void {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
  }

  /**
   * Decode JWT payload safely
   */
  private decodeToken(token: string | null): any | null {
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  /**
   * Return user info from access token
   */
  getUser(): any | null {
    const token = localStorage.getItem('access');
    return this.decodeToken(token);
  }

  /**
   * Check if access token exists and is not expired
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access');
    const payload = this.decodeToken(token);

    if (!payload || !payload.exp) return false;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  }
}
