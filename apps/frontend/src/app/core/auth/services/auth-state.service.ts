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

  /** Fast check (token presence). Does not guarantee token validity. */
  isAuthenticated(): boolean {
    return this.tokens.isAuthenticated();
  }

  /**
   * Ensure we have /me in memory (cached). Uses token presence as a prerequisite.
   * If already loaded, returns cached value.
   */
  loadMeOnce(): Observable<MeResponse | null> {
    return this.me$.pipe(
      take(1),
      switchMap((cached) => {
        if (cached) return of(cached);
        if (this.isAuthenticated()) {
          return this.auth.me().pipe(tap((me) => this.meSubject.next(me)));
        }

        return this.auth.refresh().pipe(
          switchMap((tokens) => {
            this.tokens.saveTokens(tokens.access, tokens.refresh, false);
            return this.auth.me().pipe(tap((me) => this.meSubject.next(me)));
          }),
          catchError(() => of(null)),
        );
      })
    );
  }

  clear(): void {
    this.meSubject.next(null);
  }
}
