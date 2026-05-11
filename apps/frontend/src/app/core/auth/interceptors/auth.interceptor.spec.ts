import { HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthService } from '@auth/services/auth.service';
import { TokenStorageService } from '@auth/services/token-storage.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor (HttpInterceptorFn)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenStorageMock: jasmine.SpyObj<TokenStorageService>;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    tokenStorageMock = jasmine.createSpyObj<TokenStorageService>('TokenStorageService', [
      'getAccessToken',
      'getRefreshToken',
      'getRememberMe',
      'saveTokens',
      'clear',
    ]);

    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', ['refresh']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TokenStorageService, useValue: tokenStorageMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add Authorization header for non-auth endpoints when access token exists', () => {
    tokenStorageMock.getAccessToken.and.returnValue('ACCESS_TOKEN');

    http.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer ACCESS_TOKEN');
    req.flush({ ok: true });
  });

  it('should NOT add Authorization header on /api/auth/login even if access token exists', () => {
    tokenStorageMock.getAccessToken.and.returnValue('ACCESS_TOKEN');

    http.post('/api/auth/login', { username: 'a', password: 'b' }).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ ok: true });
  });

  it('should NOT add Authorization header on /api/auth/refresh even if access token exists', () => {
    tokenStorageMock.getAccessToken.and.returnValue('ACCESS_TOKEN');

    http.post('/api/auth/refresh', { refresh: 'R' }).subscribe();

    const req = httpMock.expectOne('/api/auth/refresh');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ ok: true });
  });

  it('should refresh through stored bearer refresh token and retry request on 401', () => {
    tokenStorageMock.getAccessToken.and.returnValue('OLD_ACCESS');
    tokenStorageMock.getRefreshToken.and.returnValue('REFRESH');
    tokenStorageMock.getRememberMe.and.returnValue(true);
    authServiceMock.refresh.and.returnValue(of({ access: 'NEW_ACCESS', refresh: 'NEXT_REFRESH' }));

    let responseBody: { ok: boolean } | undefined;
    http.get<{ ok: boolean }>('/api/protected').subscribe((res) => (responseBody = res));

    const firstReq = httpMock.expectOne('/api/protected');
    expect(firstReq.request.headers.get('Authorization')).toBe('Bearer OLD_ACCESS');
    firstReq.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.refresh).toHaveBeenCalledOnceWith('REFRESH');

    const retryReq = httpMock.expectOne('/api/protected');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer NEW_ACCESS');
    expect(tokenStorageMock.saveTokens).toHaveBeenCalledOnceWith(
      'NEW_ACCESS',
      'NEXT_REFRESH',
      true,
    );

    retryReq.flush({ ok: true });

    expect(responseBody).toEqual({ ok: true });
    expect(tokenStorageMock.clear).not.toHaveBeenCalled();
  });

  it('should clear tokens and propagate error when refresh fails', () => {
    tokenStorageMock.getAccessToken.and.returnValue('ACCESS');
    tokenStorageMock.getRefreshToken.and.returnValue('REFRESH');
    authServiceMock.refresh.and.returnValue(throwError(() => new Error('refresh failed')));

    let receivedError: unknown;

    http.get('/api/protected').subscribe({
      next: () => fail('Expected an error'),
      error: (err) => (receivedError = err),
    });

    const req = httpMock.expectOne('/api/protected');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.refresh).toHaveBeenCalledOnceWith('REFRESH');
    expect(tokenStorageMock.clear).toHaveBeenCalled();
    expect(receivedError).toEqual(jasmine.any(Error));
    httpMock.expectNone('/api/protected');
  });
});
