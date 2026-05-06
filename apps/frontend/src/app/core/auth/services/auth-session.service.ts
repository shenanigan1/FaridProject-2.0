// auth-session.service.ts
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap, take, tap } from 'rxjs';
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
      tap((res) => {
        this.tokens.saveTokens(res.access, res.refresh, rememberMe);
        this.meSubject.next(res.user ?? null);
      })
    );
  }

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
