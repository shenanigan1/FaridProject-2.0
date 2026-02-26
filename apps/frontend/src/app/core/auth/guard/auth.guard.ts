import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthSessionService } from '@auth/services/auth-session.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private readonly session: AuthSessionService, private readonly router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.session.isAuthenticated()
      ? of(true)
      : of(this.router.createUrlTree(['/login']));
  }
}
