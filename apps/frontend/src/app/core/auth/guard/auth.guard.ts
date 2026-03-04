import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthSessionService } from '@auth/services/auth-session.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    return this.session.isAuthenticated()
      ? of(true)
      : of(this.router.createUrlTree(['/login']));
  }
}
