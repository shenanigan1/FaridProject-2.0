import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private accessToken: string | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return null;
  }

  saveTokens(accessToken: string, refreshToken?: string): void {
    void refreshToken;
    this.accessToken = accessToken;
  }

  clear(): void {
    this.accessToken = null;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}
