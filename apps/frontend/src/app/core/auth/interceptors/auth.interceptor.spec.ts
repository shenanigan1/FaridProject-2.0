// src/app/core/auth/auth.interceptor.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '@auth/services/auth.service';
import { TokenStorageService } from '@auth/services/token-storage.service';

describe('authInterceptor (HttpInterceptorFn)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  let tokenStorageMock: jasmine.SpyObj<TokenStorageService>;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    tokenStorageMock = jasmine.createSpyObj<TokenStorageService>('TokenStorageService', [
      'getAccessToken',
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
    // Given
    tokenStorageMock.getAccessToken.and.returnValue('ACCESS_TOKEN');

    // When
    http.get('/api/data').subscribe();

    // Then
    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer ACCESS_TOKEN');
    req.flush({ ok: true });
  });

  it('should NOT add Authorization header on /api/auth/login even if access token exists', () => {
    // Given
    tokenStorageMock.getAccessToken.and.returnValue('ACCESS_TOKEN');

    // When
    http.post('/api/auth/login', { username: 'a', password: 'b' }).subscribe();

    // Then
    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ ok: true });
  });

  it('should NOT add Authorization header on /api/auth/refresh even if access token exists', () => {
    // Given
    tokenStorageMock.getAccessToken.and.returnValue('ACCESS_TOKEN');

    // When
    http.post('/api/auth/refresh', { refresh: 'R' }).subscribe();

    // Then
    const req = httpMock.expectOne('/api/auth/refresh');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ ok: true });
  });

  it('should refresh through HttpOnly cookie and retry request on 401', () => {
    // Given
    tokenStorageMock.getAccessToken.and.returnValue('OLD_ACCESS');
    tokenStorageMock.getRememberMe.and.returnValue(true);

    authServiceMock.refresh.and.returnValue(
      of({ access: 'NEW_ACCESS' } as { access: string })
    );

    let responseBody: { ok: boolean } | undefined;
    http.get<{ ok: boolean }>('/api/protected').subscribe((res) => (responseBody = res));

    // First attempt (with OLD token)
    const firstReq = httpMock.expectOne('/api/protected');
    expect(firstReq.request.headers.get('Authorization')).toBe('Bearer OLD_ACCESS');

    // Backend returns 401
    firstReq.flush(
      { message: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' }
    );

    // Interceptor should call refresh()
    expect(authServiceMock.refresh).toHaveBeenCalledOnceWith();

    // Then it should retry original request with NEW token
    const retryReq = httpMock.expectOne('/api/protected');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer NEW_ACCESS');

    // And it should save tokens
    expect(tokenStorageMock.saveTokens).toHaveBeenCalledOnceWith(
      'NEW_ACCESS',
      undefined,
      true
    );

    // Final response
    retryReq.flush({ ok: true });

    expect(responseBody).toEqual({ ok: true });
    expect(tokenStorageMock.clear).not.toHaveBeenCalled();
  });

  it('should clear tokens and propagate error when refresh fails', () => {
    // Given
    tokenStorageMock.getAccessToken.and.returnValue('ACCESS');

    const refreshErr = new Error('refresh failed');
    authServiceMock.refresh.and.returnValue(throwError(() => refreshErr));

    let receivedError: unknown;

    http.get('/api/protected').subscribe({
      next: () => fail('Expected an error'),
      error: (err) => (receivedError = err),
    });

    // First request returns 401 -> triggers refresh
    const req = httpMock.expectOne('/api/protected');
    req.flush(
      { message: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(authServiceMock.refresh).toHaveBeenCalledOnceWith();
    expect(tokenStorageMock.clear).toHaveBeenCalled();
    expect(receivedError).toBe(refreshErr);

    // Important: no retry should happen since refresh failed
    httpMock.expectNone('/api/protected');
  });
});
