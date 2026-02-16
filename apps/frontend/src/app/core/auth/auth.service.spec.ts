import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should send POST request and store token', () => {
    const mockResponse = {
      access: 'ACCESS_TOKEN',
      refresh: 'REFRESH_TOKEN',
    };

    service.login('test@test.com', 'password123').subscribe((res) => {
      expect(res).toEqual(mockResponse);
      expect(localStorage.getItem('access')).toBe('ACCESS_TOKEN');
      expect(localStorage.getItem('refresh')).toBe('REFRESH_TOKEN');
    });

    const req = httpMock.expectOne('/api/auth/login/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'test@test.com',
      password: 'password123',
    });

    req.flush(mockResponse);
  });
});
