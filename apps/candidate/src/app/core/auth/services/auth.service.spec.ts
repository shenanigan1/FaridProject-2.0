import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '@env/environment';

import { AuthService } from './auth.service';

describe('AuthService (candidate)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const loginUrl = `${environment.apiBaseUrl}/api/auth/login/`;
  const candidatesUrl = `${environment.apiBaseUrl}/api/candidates/`;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('signIn stores tokens and resolves candidate profile from candidates API', () => {
    let candidateId: number | null = null;

    service
      .signIn({ email: 'john@example.com', password: 'Secret123' })
      .subscribe((candidate) => {
        candidateId = candidate.candidateId;
      });

    const loginRequest = httpMock.expectOne(loginUrl);
    expect(loginRequest.request.method).toBe('POST');
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

    const candidatesRequest = httpMock.expectOne(candidatesUrl);
    expect(candidatesRequest.request.method).toBe('GET');
    candidatesRequest.flush([
      {
        id: 44,
        user: {
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe',
          phone: '+330000000',
        },
      },
    ]);

    expect(candidateId).toBe(44);
    expect(localStorage.getItem('access_token')).toBe('access-token');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-token');
  });



  it('maps nested backend validation errors to user-friendly message', () => {
    let actualError: string | null = null;

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

  it('signUp creates candidate then logs in', () => {
    let candidateId: number | null = null;

    service
      .signUp({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+33123456',
        password: 'Secret123',
      })
      .subscribe((candidate) => {
        candidateId = candidate.candidateId;
      });

    const createRequest = httpMock.expectOne(candidatesUrl);
    expect(createRequest.request.method).toBe('POST');
    createRequest.flush({
      id: 88,
      user: {
        email: 'jane@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+33123456',
      },
    });

    const loginRequest = httpMock.expectOne(loginUrl);
    expect(loginRequest.request.method).toBe('POST');
    loginRequest.flush({
      access: 'a',
      refresh: 'r',
      user: {
        id: 5,
        email: 'jane@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
      },
    });

    const candidatesRequest = httpMock.expectOne(candidatesUrl);
    candidatesRequest.flush([
      {
        id: 88,
        user: {
          email: 'jane@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          phone: '+33123456',
        },
      },
    ]);

    expect(candidateId).toBe(88);
  });
});
