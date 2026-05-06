import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { of } from 'rxjs';

import { RoleGuard } from './role.guard';
import { AuthSessionService } from '@auth/services/auth-session.service';
import { AllowedRole, MeResponse } from '@auth/models/auth.models';

describe('RoleGuard', () => {
  let guard: RoleGuard;

  let sessionSpy: jasmine.SpyObj<AuthSessionService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const makeRoute = (roles?: AllowedRole[]): ActivatedRouteSnapshot => {
    const snapshot = new ActivatedRouteSnapshot();
    (snapshot as ActivatedRouteSnapshot).data = roles ? { roles } : {}; // <-- important: always define data
    return snapshot;
  };

  beforeEach(() => {
    sessionSpy = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', ['loadMeOnce']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: AuthSessionService, useValue: sessionSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = TestBed.inject(RoleGuard);
  });

  it('should redirect to /login when me is null', (done) => {
    const loginTree = {} as UrlTree;

    sessionSpy.loadMeOnce.and.returnValue(of(null));
    routerSpy.createUrlTree.and.returnValue(loginTree);

    guard.canActivate(makeRoute()).subscribe((result) => {
      expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect(result).toBe(loginTree);
      done();
    });
  });

  it('should allow access when authenticated and no roles are required', (done) => {
    const me = { role: 'admin' } as unknown as MeResponse;

    sessionSpy.loadMeOnce.and.returnValue(of(me));

    guard.canActivate(makeRoute()).subscribe((result) => {
      expect(result).toBeTrue();
      expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
      done();
    });
  });

  it('should redirect to /forbidden when roles are required but me.role is missing', (done) => {
    const forbiddenTree = {} as UrlTree;
    const me = { role: undefined } as unknown as MeResponse;

    sessionSpy.loadMeOnce.and.returnValue(of(me));
    routerSpy.createUrlTree.and.returnValue(forbiddenTree);

    guard.canActivate(makeRoute(['admin'])).subscribe((result) => {
      expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/forbidden']);
      expect(result).toBe(forbiddenTree);
      done();
    });
  });

  it('should allow access when user role is included in allowed roles', (done) => {
    const me = { role: 'admin' } as unknown as MeResponse;

    sessionSpy.loadMeOnce.and.returnValue(of(me));

    guard.canActivate(makeRoute(['admin'])).subscribe((result) => {
      expect(result).toBeTrue();
      expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
      done();
    });
  });

  it('should redirect to /forbidden when user role is not included in allowed roles', (done) => {
    const forbiddenTree = {} as UrlTree;
    const me = { role: 'user' } as unknown as MeResponse;

    sessionSpy.loadMeOnce.and.returnValue(of(me));
    routerSpy.createUrlTree.and.returnValue(forbiddenTree);

    guard.canActivate(makeRoute(['admin'])).subscribe((result) => {
      expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/forbidden']);
      expect(result).toBe(forbiddenTree);
      done();
    });
  });
});
