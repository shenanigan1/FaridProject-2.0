import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';

import { AuthSessionService } from '@auth/services/auth-session.service';
import { getRoleHomeRoute } from '@shared/navigation/app-navigation';

@Component({
  standalone: true,
  selector: 'app-role-home-redirect-page',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleHomeRedirectPage {
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  constructor() {
    this.session
      .loadMeOnce()
      .pipe(take(1))
      .subscribe((me) => {
        void this.router.navigateByUrl(getRoleHomeRoute(me?.role));
      });
  }
}
