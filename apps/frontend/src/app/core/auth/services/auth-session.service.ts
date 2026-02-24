import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap, take, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';
import { LoginRequest, LoginResponse, MeResponse } from '../auth.models';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly meSubject = new BehaviorSubject<MeResponse | null>(null);
  readonly me$ = this.meSubject.asObservable();

  constructor(
    private readonly api: AuthService,
    private readonly tokens: TokenStorageService
  ) {}

  isAuthenticated(): boolean {
    return this.tokens.isAuthenticated();
  }

  /**
   * Login and persist tokens according to rememberMe.
   * Call this from your login page.
   */
  login(payload: LoginRequest, rememberMe: boolean): Observable<LoginResponse> {
    return this.api.login(payload).pipe(
      tap((res) => {
        // Assumes LoginResponse contains access & refresh
        this.tokens.saveTokens(res.access, res.refresh, rememberMe);
      })
    );
  }

  /**
   * Cache /me once per session. If already loaded, return cached.
   */
  loadMeOnce(): Observable<MeResponse | null> {
    return this.me$.pipe(
      take(1),
      switchMap((cached) => {
        if (cached) return of(cached);
        if (!this.isAuthenticated()) return of(null);

        return this.api.me().pipe(tap((me) => this.meSubject.next(me)));
      })
    );
  }

  clearMe(): void {
    this.meSubject.next(null);
  }

  logout(): void {
    this.tokens.clear();
    this.clearMe();
  }
}
