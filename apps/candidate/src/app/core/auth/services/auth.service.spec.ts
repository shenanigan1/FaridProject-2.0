import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '@env/environment';
import { TokenStorageService } from '@core/auth/services/token-storage.service';
import { AuthService, AuthenticatedCandidate } from './auth.service';

describe('AuthService (candidate)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokenStorageSpy: jasmine.SpyObj<TokenStorageService>;

  const loginUrl = `${environment.apiBaseUrl}/api/auth/login/`;
  const refreshUrl = `${environment.apiBaseUrl}/api/auth/refresh/`;
  const candidatesUrl = `${environment.apiBaseUrl}/api/candidates/`;
  const candidateMeUrl = `${environment.apiBaseUrl}/api/candidates/me/`;

  beforeEach(() => {
    localStorage.clear();

    tokenStorageSpy = jasmine.createSpyObj<TokenStorageService>('TokenStorageService', [
      'saveTokens',
      'getRefreshToken',
      'clear',
      'isAuthenticated',
      'getAccessToken',
    ]);
    tokenStorageSpy.isAuthenticated.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TokenStorageService, useValue: tokenStorageSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('signIn stores tokens and resolves candidate profile from /candidates/me/', () => {
    let candidateId: number | undefined;

    service
      .signIn({ email: 'john@example.com', password: 'Secret123' })
      .subscribe((candidate) => {
        candidateId = candidate.candidateId;
      });

    const loginRequest = httpMock.expectOne(loginUrl);
    expect(loginRequest.request.method).toBe('POST');
    expect(loginRequest.request.withCredentials).toBeFalse();
    loginRequest.flush({
      access: 'access-token',
      refresh: 'refresh-token',
      user: {
        id: 2,
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
      },
    });

    const meRequest = httpMock.expectOne(candidateMeUrl);
    expect(meRequest.request.method).toBe('GET');
    meRequest.flush({
      id: 44,
      user: {
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+330000000',
      },
    });

    expect(candidateId).toBe(44);
    expect(tokenStorageSpy.saveTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
  });

  it('signIn returns explicit message when user is not a candidate', () => {
    let actualError: string | undefined;

    service.signIn({ email: 'hr@example.com', password: 'Secret123' }).subscribe({
      next: () => fail('Expected error'),
      error: (errorMessage: string) => {
        actualError = errorMessage;
      },
    });

    const loginRequest = httpMock.expectOne(loginUrl);
    loginRequest.flush({
      access: 'access-token',
      refresh: 'refresh-token',
      user: {
        id: 8,
        email: 'hr@example.com',
        first_name: 'HR',
        last_name: 'User',
      },
    });

    const meRequest = httpMock.expectOne(candidateMeUrl);
    meRequest.flush({}, { status: 403, statusText: 'Forbidden' });

    expect(actualError).toBe('Your account does not have candidate access for this application.');
  });

  it('maps nested backend validation errors to user-friendly message', () => {
    let actualError: string | undefined;

    service
      .signUp({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+33123456',
        password: '123',
      })
      .subscribe({
        next: () => fail('Expected error'),
        error: (errorMessage: string) => {
          actualError = errorMessage;
        },
      });

    const createRequest = httpMock.expectOne(candidatesUrl);
    createRequest.flush(
      {
        user: {
          password: ['This password is too short. It must contain at least 8 characters.'],
        },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(actualError).toContain('at least 8 characters');
  });

  it('refresh calls backend refresh endpoint with bearer refresh token and no credentials', () => {
    let access: string | undefined;

    service.refresh('refresh-token').subscribe((response) => {
      access = response.access;
    });

    const request = httpMock.expectOne(refreshUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBeFalse();
    expect(request.request.body).toEqual({ refresh: 'refresh-token' });

    request.flush({ access: 'new-access' });

    expect(access).toBe('new-access');
  });

  it('restoreSession refreshes through stored bearer refresh token and stores the candidate profile', () => {
    tokenStorageSpy.getRefreshToken.and.returnValue('refresh-token');
    let candidateId: number | null | undefined;

    service.restoreSession().subscribe((candidate) => {
      candidateId = candidate?.candidateId;
    });

    const refreshRequest = httpMock.expectOne(refreshUrl);
    expect(refreshRequest.request.method).toBe('POST');
    expect(refreshRequest.request.withCredentials).toBeFalse();
    expect(refreshRequest.request.body).toEqual({ refresh: 'refresh-token' });
    refreshRequest.flush({ access: 'restored-access', refresh: 'next-refresh' });

    const meRequest = httpMock.expectOne(candidateMeUrl);
    expect(meRequest.request.method).toBe('GET');
    meRequest.flush({
      id: 51,
      user: {
        email: 'restore@example.com',
        first_name: 'Restore',
        last_name: 'User',
        phone: '+331111111',
      },
    });

    expect(tokenStorageSpy.saveTokens).toHaveBeenCalledWith('restored-access', 'next-refresh');
    expect(candidateId).toBe(51);
    expect(service.getAuthenticatedCandidate()?.email).toBe('restore@example.com');
  });

  it('restoreSession clears stale local session when refresh token is expired', () => {
    tokenStorageSpy.getRefreshToken.and.returnValue('expired-refresh-token');
    service.saveAuthenticatedCandidate({
      candidateId: 60,
      email: 'expired@example.com',
      firstName: 'Expired',
      lastName: 'User',
      phone: '',
    });

    let restored: AuthenticatedCandidate | null | undefined;
    service.restoreSession().subscribe((candidate) => {
      restored = candidate;
    });

    const refreshRequest = httpMock.expectOne(refreshUrl);
    refreshRequest.flush(
      {
        detail: 'Token is blacklisted or expired',
        code: 'token_not_valid',
      },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(restored).toBeNull();
    expect(tokenStorageSpy.clear).toHaveBeenCalled();
    expect(service.getAuthenticatedCandidate()).toBeNull();
  });

  it('logout clears local candidate state and sends bearer refresh token to backend', () => {
    tokenStorageSpy.getRefreshToken.and.returnValue('refresh-token');
    service.saveAuthenticatedCandidate({
      candidateId: 99,
      email: 'logout@example.com',
      firstName: 'Logout',
      lastName: 'User',
      phone: '',
    });

    service.logout();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/api/auth/logout/`);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBeFalse();
    expect(request.request.body).toEqual({ refresh: 'refresh-token' });
    request.flush(null);

    expect(tokenStorageSpy.clear).toHaveBeenCalled();
    expect(service.getAuthenticatedCandidate()).toBeNull();
  });
});
