import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { of } from 'rxjs';

import { AuthGuard } from './auth.guard';
import { AuthSessionService } from '../services/auth-session.service';
import { MeResponse } from '../models/auth.models';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let sessionSpy: jasmine.SpyObj<AuthSessionService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    sessionSpy = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', [
      'loadMeOnce',
    ]);

    routerSpy = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    routerSpy.createUrlTree.and.returnValue({} as UrlTree);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthSessionService, useValue: sessionSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('should allow access when authenticated', async () => {
    const me: MeResponse = {
      id: 1,
      email: 'admin@fleetflow.test',
      first_name: 'Admin',
      last_name: 'Fleet',
      role: 'admin',
    };
    sessionSpy.loadMeOnce.and.returnValue(of(me));

    const result = await firstValueFrom(guard.canActivate());

    expect(result).toBeTrue();
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to /login when not authenticated', async () => {
    sessionSpy.loadMeOnce.and.returnValue(of(null));

    const result = await firstValueFrom(guard.canActivate());

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(routerSpy.createUrlTree.calls.mostRecent().returnValue);
  });
});
