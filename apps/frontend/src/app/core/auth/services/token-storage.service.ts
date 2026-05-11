import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly REMEMBER_KEY = 'auth_remember';
  private readonly ACCESS_KEY = 'auth_access';
  private readonly REFRESH_KEY = 'auth_refresh';
  private accessToken: string | null = null;

  saveTokens(access: string, refresh?: string, rememberMe = false): void {
    this.accessToken = access;
    const targetStorage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;

    this.clearStorage(otherStorage);
    targetStorage.setItem(this.REMEMBER_KEY, String(rememberMe));
    targetStorage.setItem(this.ACCESS_KEY, access);
    if (refresh) {
      targetStorage.setItem(this.REFRESH_KEY, refresh);
    }
  }

  getAccessToken(): string | null {
    this.accessToken = this.accessToken ?? this.read(this.ACCESS_KEY);
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.read(this.REFRESH_KEY);
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
    storage.removeItem(this.ACCESS_KEY);
    storage.removeItem(this.REFRESH_KEY);
  }
}
