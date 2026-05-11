import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, switchMap, take, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';
import { MeResponse } from '@auth/models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly auth = inject(AuthService);
  private readonly tokens = inject(TokenStorageService);

  private readonly meSubject = new BehaviorSubject<MeResponse | null>(null);
  readonly me$ = this.meSubject.asObservable();

  isAuthenticated(): boolean {
    return this.tokens.isAuthenticated();
  }

  loadMeOnce(): Observable<MeResponse | null> {
    return this.me$.pipe(
      take(1),
      switchMap((cached) => {
        if (cached) return of(cached);
        if (this.isAuthenticated()) {
          return this.auth.me().pipe(tap((me) => this.meSubject.next(me)));
        }

        const refreshToken = this.tokens.getRefreshToken();
        if (!refreshToken) return of(null);

        return this.auth.refresh(refreshToken).pipe(
          switchMap((tokens) => {
            this.tokens.saveTokens(tokens.access, tokens.refresh, false);
            return this.auth.me().pipe(tap((me) => this.meSubject.next(me)));
          }),
          catchError(() => of(null)),
        );
      }),
    );
  }

  clear(): void {
    this.meSubject.next(null);
  }
}
