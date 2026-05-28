import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthService } from '@core/auth/services/auth.service';
import { SessionExpiredService } from '@core/auth/services/session-expired.service';
import { TokenStorageService } from '@core/auth/services/token-storage.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor (candidate)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let tokenStorageSpy: jasmine.SpyObj<TokenStorageService>;
  let sessionExpiredSpy: jasmine.SpyObj<SessionExpiredService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['refresh']);
    sessionExpiredSpy = jasmine.createSpyObj<SessionExpiredService>('SessionExpiredService', [
      'notify',
    ]);
    tokenStorageSpy = jasmine.createSpyObj<TokenStorageService>('TokenStorageService', [
      'getAccessToken',
      'getRefreshToken',
      'saveTokens',
      'clear',
    ]);

    tokenStorageSpy.getAccessToken.and.returnValue('ACCESS');
    tokenStorageSpy.getRefreshToken.and.returnValue('REFRESH');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TokenStorageService, useValue: tokenStorageSpy },
        { provide: SessionExpiredService, useValue: sessionExpiredSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds authorization header on non-auth requests', () => {
    http.get('/api/public/positions').subscribe();

    const request = httpMock.expectOne('/api/public/positions');

    expect(request.request.headers.get('Authorization')).toBe('Bearer ACCESS');
    request.flush([]);
  });

  it('adds authorization header when loading the signed-in candidate profile', () => {
    http.get('/api/candidates/me/').subscribe();

    const request = httpMock.expectOne('/api/candidates/me/');

    expect(request.request.headers.get('Authorization')).toBe('Bearer ACCESS');
    request.flush({ id: 1 });
  });

  it('refreshes token and retries request after 401', () => {
    authServiceSpy.refresh.and.returnValue(of({ access: 'NEW_ACCESS', refresh: 'NEXT_REFRESH' }));

    http.get('/api/public/positions').subscribe();

    const firstRequest = httpMock.expectOne('/api/public/positions');
    firstRequest.flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    const retriedRequest = httpMock.expectOne('/api/public/positions');
    expect(retriedRequest.request.headers.get('Authorization')).toBe('Bearer NEW_ACCESS');
    retriedRequest.flush([]);

    expect(authServiceSpy.refresh).toHaveBeenCalledOnceWith('REFRESH');
    expect(tokenStorageSpy.saveTokens).toHaveBeenCalledWith('NEW_ACCESS', 'NEXT_REFRESH');
  });

  it('clears tokens if refresh fails', () => {
    authServiceSpy.refresh.and.returnValue(throwError(() => new Error('refresh failed')));

    http.get('/api/public/positions').subscribe({ error: () => void 0 });

    const firstRequest = httpMock.expectOne('/api/public/positions');
    firstRequest.flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(tokenStorageSpy.clear).toHaveBeenCalled();
    expect(sessionExpiredSpy.notify).toHaveBeenCalledOnceWith();
  });

  it('clears tokens and opens the expired-session flow when no refresh token exists', () => {
    tokenStorageSpy.getRefreshToken.and.returnValue(null);

    http.get('/api/candidates/me/').subscribe({ error: () => void 0 });

    const firstRequest = httpMock.expectOne('/api/candidates/me/');
    firstRequest.flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.refresh).not.toHaveBeenCalled();
    expect(tokenStorageSpy.clear).toHaveBeenCalled();
    expect(sessionExpiredSpy.notify).toHaveBeenCalledOnceWith();
  });
});
