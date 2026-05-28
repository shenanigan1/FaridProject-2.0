import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly REMEMBER_KEY = 'auth_remember';
  private readonly ACCESS_KEY = 'auth_access';
  private readonly REFRESH_KEY = 'auth_refresh';
  private accessToken: string | null = null;

  saveTokens(access: string, refresh?: string, rememberMe = false): void {
    this.accessToken = access;

    localStorage.removeItem(this.ACCESS_KEY);
    sessionStorage.setItem(this.REMEMBER_KEY, String(rememberMe));
    sessionStorage.setItem(this.ACCESS_KEY, access);

    if (refresh) {
      const refreshStorage = rememberMe ? localStorage : sessionStorage;
      const otherRefreshStorage = rememberMe ? sessionStorage : localStorage;
      otherRefreshStorage.removeItem(this.REFRESH_KEY);
      otherRefreshStorage.removeItem(this.REMEMBER_KEY);
      refreshStorage.setItem(this.REMEMBER_KEY, String(rememberMe));
      refreshStorage.setItem(this.REFRESH_KEY, refresh);
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
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  }

  private clearStorage(storage: Storage): void {
    storage.removeItem(this.REMEMBER_KEY);
    storage.removeItem(this.ACCESS_KEY);
    storage.removeItem(this.REFRESH_KEY);
  }
}
