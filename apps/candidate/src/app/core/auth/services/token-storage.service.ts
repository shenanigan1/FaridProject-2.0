import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly accessKey = 'access_token';
  private readonly refreshKey = 'refresh_token';
  private accessToken: string | null = null;

  getAccessToken(): string | null {
    this.accessToken = this.accessToken ?? localStorage.getItem(this.accessKey);
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshKey);
  }

  saveTokens(accessToken: string, refreshToken?: string): void {
    this.accessToken = accessToken;
    localStorage.setItem(this.accessKey, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.refreshKey, refreshToken);
    }
  }

  clear(): void {
    this.accessToken = null;
    localStorage.removeItem(this.accessKey);
    localStorage.removeItem(this.refreshKey);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}
