import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthSessionService } from '@auth/services/auth-session.service';
import { MeResponse, AllowedRole } from '@auth/models/auth.models';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const allowedRoles = (route.data['roles'] as AllowedRole[] | undefined) ?? [];

    return this.session.loadMeOnce().pipe(
      map((me: MeResponse | null) => {
        if (!me) {
          return this.router.createUrlTree(['/login']);
        }

        if (allowedRoles.length === 0) {
          return true;
        }

        const role = me.role as AllowedRole | undefined;

        if (!role) {
          return this.router.createUrlTree(['/forbidden']);
        }

        return allowedRoles.includes(role)
          ? true
          : this.router.createUrlTree(['/forbidden']);
      })
    );
  }
}
