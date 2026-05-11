import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { MeResponse } from '@auth/models/auth.models';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { TokenStorageService } from './token-storage.service';

describe('AuthSessionService', () => {
  let service: AuthSessionService;
  let apiSpy: jasmine.SpyObj<AuthService>;
  let tokenStorageSpy: jasmine.SpyObj<TokenStorageService>;

  const loginUser: MeResponse = {
    id: 1,
    email: 'admin@example.com',
    first_name: 'Old',
    last_name: 'Role',
    role: null,
  };

  const freshUser: MeResponse = {
    id: 1,
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'Ready',
    role: 'admin',
  };

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'me', 'refresh', 'logout']);
    tokenStorageSpy = jasmine.createSpyObj<TokenStorageService>('TokenStorageService', [
      'saveTokens',
      'getRefreshToken',
      'isAuthenticated',
      'clear',
    ]);

    TestBed.configureTestingModule({
      providers: [
        AuthSessionService,
        { provide: AuthService, useValue: apiSpy },
        { provide: TokenStorageService, useValue: tokenStorageSpy },
      ],
    });

    service = TestBed.inject(AuthSessionService);
  });

  it('refreshes /me after login so permissions are available without page reload', () => {
    apiSpy.login.and.returnValue(
      of({ access: 'ACCESS', refresh: 'REFRESH', user: loginUser }),
    );
    apiSpy.me.and.returnValue(of(freshUser));

    let actualUser: MeResponse | null | undefined;

    service.login({ email: 'admin@example.com', password: 'secret' }, true).subscribe((response) => {
      actualUser = response.user;
    });

    expect(tokenStorageSpy.saveTokens).toHaveBeenCalledOnceWith('ACCESS', 'REFRESH', true);
    expect(apiSpy.me).toHaveBeenCalled();
    expect(actualUser).toEqual(freshUser);
  });

  it('restores /me from the bearer refresh token when access token is missing', () => {
    tokenStorageSpy.isAuthenticated.and.returnValue(false);
    tokenStorageSpy.getRefreshToken.and.returnValue('REFRESH');
    apiSpy.refresh.and.returnValue(of({ access: 'ACCESS', refresh: 'NEXT_REFRESH' }));
    apiSpy.me.and.returnValue(of(freshUser));

    let actualUser: MeResponse | null | undefined;

    service.loadMeOnce().subscribe((user) => {
      actualUser = user;
    });

    expect(apiSpy.refresh).toHaveBeenCalledOnceWith('REFRESH');
    expect(tokenStorageSpy.saveTokens).toHaveBeenCalledWith('ACCESS', 'NEXT_REFRESH', false);
    expect(actualUser).toEqual(freshUser);
  });

  it('clears local session and calls backend logout with bearer refresh token', () => {
    tokenStorageSpy.getRefreshToken.and.returnValue('REFRESH');
    apiSpy.logout.and.returnValue(of(undefined));

    service.logout();

    expect(tokenStorageSpy.clear).toHaveBeenCalled();
    expect(apiSpy.logout).toHaveBeenCalledOnceWith('REFRESH');
  });

  it('still clears local session when backend logout fails', () => {
    apiSpy.logout.and.returnValue(throwError(() => new Error('network')));
    tokenStorageSpy.getRefreshToken.and.returnValue('REFRESH');

    service.logout();

    expect(tokenStorageSpy.clear).toHaveBeenCalled();
    expect(apiSpy.logout).toHaveBeenCalledOnceWith('REFRESH');
  });
});
