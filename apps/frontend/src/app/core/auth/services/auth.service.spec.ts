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

  it('login should POST /login/ with email/password and return LoginResponse', () => {
    const payload: LoginRequest = {
      email: 'test@test.com',
      password: 'password123',
    };

    const mockResponse: LoginResponse = {
      access: 'ACCESS_TOKEN',
      refresh: 'REFRESH_TOKEN',
    };

    service.login(payload).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${base}/login/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: payload.email,
      password: payload.password,
    });

    req.flush(mockResponse);
  });

  it('me should GET /me/ and return MeResponse', () => {
    // If you know the real shape, fill it here.
    const mockResponse: MeResponse = {
      // e.g. id: 1, email: 'test@test.com', role: 'driver'
    } as unknown as MeResponse;

    service.me().subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${base}/me/`);
    expect(req.request.method).toBe('GET');

    req.flush(mockResponse);
  });

  it('refresh should POST /refresh/ with refresh token and return new tokens', () => {
    const refreshToken = 'REFRESH_TOKEN';

    const mockResponse: { access: string; refresh?: string } = {
      access: 'NEW_ACCESS_TOKEN',
      refresh: 'NEW_REFRESH_TOKEN',
    };

    service.refresh(refreshToken).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${base}/refresh/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refresh: refreshToken });

    req.flush(mockResponse);
  });
});
