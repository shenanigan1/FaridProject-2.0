import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly REMEMBER_KEY = 'auth_remember';
  private accessToken: string | null = null;

  saveTokens(access: string, refresh?: string, rememberMe = false): void {
    void refresh;
    this.accessToken = access;
    const targetStorage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;

    this.clearStorage(otherStorage);
    targetStorage.setItem(this.REMEMBER_KEY, String(rememberMe));
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return null;
  }

  getRememberMe(): boolean {
    return this.read(this.REMEMBER_KEY) === 'true';
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  clear(): void {
    this.accessToken = null;
    this.clearStorage(localStorage);
    this.clearStorage(sessionStorage);
  }

  private read(key: string): string | null {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  }

  private clearStorage(storage: Storage): void {
    storage.removeItem(this.REMEMBER_KEY);
  }
}
