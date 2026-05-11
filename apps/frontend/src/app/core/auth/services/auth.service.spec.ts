import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { environment } from '@env/environment';
import { LoginRequest, LoginResponse, MeResponse } from '@auth/models/auth.models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const base = `${environment.apiBaseUrl}/api/auth`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('login should POST /login/ without credentials and return bearer tokens', () => {
    const payload: LoginRequest = {
      email: 'test@test.com',
      password: 'password123',
    };

    const mockResponse: LoginResponse = {
      access: 'ACCESS_TOKEN',
      refresh: 'REFRESH_TOKEN',
      user: null,
    };

    service.login(payload).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${base}/login/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeFalse();
    expect(req.request.body).toEqual({
      email: payload.email,
      password: payload.password,
    });

    req.flush(mockResponse);
  });

  it('me should GET /me/ and return MeResponse', () => {
    const mockResponse: MeResponse = {
      id: 1,
      email: 'test@test.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'admin',
    };

    service.me().subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${base}/me/`);
    expect(req.request.method).toBe('GET');

    req.flush(mockResponse);
  });

  it('refresh should POST /refresh/ with bearer refresh token and no credentials', () => {
    const mockResponse: { access: string; refresh?: string } = {
      access: 'NEW_ACCESS_TOKEN',
      refresh: 'NEW_REFRESH_TOKEN',
    };

    service.refresh('REFRESH_TOKEN').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${base}/refresh/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeFalse();
    expect(req.request.body).toEqual({ refresh: 'REFRESH_TOKEN' });

    req.flush(mockResponse);
  });

  it('logout should POST /logout/ with bearer refresh token and no credentials', () => {
    service.logout('REFRESH_TOKEN').subscribe((res) => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne(`${base}/logout/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeFalse();
    expect(req.request.body).toEqual({ refresh: 'REFRESH_TOKEN' });

    req.flush(null);
  });
});
