import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthSessionService } from '../auth/services/auth-session.service';

type AllowedRole = 'admin' | 'hr' | 'director' | 'manager' | 'employee' | 'candidate';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private readonly session: AuthSessionService, private readonly router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const allowedRoles = (route.data['roles'] as AllowedRole[] | undefined) ?? [];

    return this.session.loadMeOnce().pipe(
      map((me) => {
        if (!me) return this.router.createUrlTree(['/login']);
        if (allowedRoles.length === 0) return true;

        const role = (me as any).role as AllowedRole; // adjust if MeResponse uses another field name
        return allowedRoles.includes(role)
          ? true
          : this.router.createUrlTree(['/forbidden']);
      })
    );
  }
}
