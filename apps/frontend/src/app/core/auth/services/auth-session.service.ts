import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, take, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';
import { LoginRequest, LoginResponse, MeResponse } from '@auth/models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly api = inject(AuthService);
  private readonly tokens = inject(TokenStorageService);

  private readonly meSubject = new BehaviorSubject<MeResponse | null>(null);
  readonly me$ = this.meSubject.asObservable();

  isAuthenticated(): boolean {
    return this.tokens.isAuthenticated();
  }

  login(payload: LoginRequest, rememberMe: boolean): Observable<LoginResponse> {
    return this.api.login(payload).pipe(
      switchMap((res) => {
        this.tokens.saveTokens(res.access, res.refresh, rememberMe);
        return this.api.me().pipe(
          map((me) => ({
            ...res,
            user: me,
          })),
        );
      }),
      tap((res) => {
        this.meSubject.next(res.user ?? null);
      }),
    );
  }

  loadMeOnce(): Observable<MeResponse | null> {
    return this.me$.pipe(
      take(1),
      switchMap((cached) => {
        if (cached) return of(cached);
        if (this.isAuthenticated()) {
          return this.api.me().pipe(tap((me) => this.meSubject.next(me)));
        }

        const refreshToken = this.tokens.getRefreshToken();
        if (!refreshToken) return of(null);

        return this.api.refresh(refreshToken).pipe(
          switchMap((tokens) => {
            this.tokens.saveTokens(tokens.access, tokens.refresh, false);
            return this.api.me().pipe(tap((me) => this.meSubject.next(me)));
          }),
          catchError(() => of(null)),
        );
      }),
    );
  }

  clearMe(): void {
    this.meSubject.next(null);
  }

  logout(): void {
    const refreshToken = this.tokens.getRefreshToken();
    this.tokens.clear();
    this.clearMe();
    this.api.logout(refreshToken).pipe(take(1), catchError(() => of(undefined))).subscribe();
  }
}
