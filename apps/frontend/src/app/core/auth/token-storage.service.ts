import { Injectable } from '@angular/core';

const ACCESS_KEY = 'auth.access';
const REFRESH_KEY = 'auth.refresh';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  saveTokens(access: string, refresh: string | undefined, rememberMe: boolean) {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(ACCESS_KEY, access);
    if (refresh) storage.setItem(REFRESH_KEY, refresh);

    // Nettoie l’autre storage pour éviter les conflits
    const other = rememberMe ? sessionStorage : localStorage;
    other.removeItem(ACCESS_KEY);
    other.removeItem(REFRESH_KEY);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY) ?? sessionStorage.getItem(ACCESS_KEY);
  }

  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  }
}
