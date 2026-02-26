import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap, take, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';
import { MeResponse } from '@auth/models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly meSubject = new BehaviorSubject<MeResponse | null>(null);
  readonly me$ = this.meSubject.asObservable();

  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokenStorageService
  ) {}

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
        if (!this.isAuthenticated()) return of(null);

        return this.auth.me().pipe(
          tap((me) => this.meSubject.next(me))
        );
      })
    );
  }

  clear(): void {
    this.meSubject.next(null);
  }
}
