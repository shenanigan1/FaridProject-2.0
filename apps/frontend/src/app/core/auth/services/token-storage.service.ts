import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly ACCESS_KEY = 'auth_access';
  private readonly REFRESH_KEY = 'auth_refresh';
  private readonly REMEMBER_KEY = 'auth_remember';

  /* ==============================
     SAVE TOKENS
  ============================== */

  saveTokens(access: string, refresh: string, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;

    storage.setItem(this.ACCESS_KEY, access);
    storage.setItem(this.REFRESH_KEY, refresh);
    storage.setItem(this.REMEMBER_KEY, JSON.stringify(rememberMe));

    // Nettoie l’autre storage pour éviter conflits
    otherStorage.removeItem(this.ACCESS_KEY);
    otherStorage.removeItem(this.REFRESH_KEY);
    otherStorage.removeItem(this.REMEMBER_KEY);
  }

  /* ==============================
     GETTERS
  ============================== */

  getAccessToken(): string | null {
    return (
      localStorage.getItem(this.ACCESS_KEY) ??
      sessionStorage.getItem(this.ACCESS_KEY)
    );
  }

  getRefreshToken(): string | null {
    return (
      localStorage.getItem(this.REFRESH_KEY) ??
      sessionStorage.getItem(this.REFRESH_KEY)
    );
  }

  getRememberMe(): boolean {
    const val =
      localStorage.getItem(this.REMEMBER_KEY) ??
      sessionStorage.getItem(this.REMEMBER_KEY);

    return val ? JSON.parse(val) : false;
  }

  /* ==============================
     AUTH STATE
  ============================== */

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /* ==============================
     CLEAR TOKENS
  ============================== */

  clear(): void {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.REMEMBER_KEY);

    sessionStorage.removeItem(this.ACCESS_KEY);
    sessionStorage.removeItem(this.REFRESH_KEY);
    sessionStorage.removeItem(this.REMEMBER_KEY);
  }
}
