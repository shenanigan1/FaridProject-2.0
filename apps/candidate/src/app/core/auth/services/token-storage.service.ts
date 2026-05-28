import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly accessKey = 'access_token';
  private readonly refreshKey = 'refresh_token';
  private accessToken: string | null = null;

  getAccessToken(): string | null {
    this.accessToken = this.accessToken ?? sessionStorage.getItem(this.accessKey);
    if (this.isJwtExpired(this.accessToken)) {
      this.accessToken = null;
      sessionStorage.removeItem(this.accessKey);
      return null;
    }

    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshKey);
  }

  saveTokens(accessToken: string, refreshToken?: string): void {
    this.accessToken = accessToken;
    localStorage.removeItem(this.accessKey);
    sessionStorage.setItem(this.accessKey, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.refreshKey, refreshToken);
    }
  }

  clear(): void {
    this.accessToken = null;
    localStorage.removeItem(this.accessKey);
    sessionStorage.removeItem(this.accessKey);
    localStorage.removeItem(this.refreshKey);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  private isJwtExpired(token: string | null): boolean {
    const expiresAt = this.getJwtExpirationTime(token);
    if (expiresAt === null) {
      return false;
    }

    return expiresAt <= Date.now();
  }

  private getJwtExpirationTime(token: string | null): number | null {
    if (!token) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(this.toBase64(parts[1]))) as { exp?: unknown };
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  private toBase64(value: string): string {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const paddingLength = (4 - (normalized.length % 4)) % 4;
    return normalized.padEnd(normalized.length + paddingLength, '=');
  }
}
