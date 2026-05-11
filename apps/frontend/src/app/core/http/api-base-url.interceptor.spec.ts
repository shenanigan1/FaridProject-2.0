import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '@env/environment';
import { apiBaseUrlInterceptor } from './api-base-url.interceptor';

describe('apiBaseUrlInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiBaseUrlInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('routes relative api calls to the configured backend origin', () => {
    http.get('/api/positions/').subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/api/positions/`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('keeps absolute URLs unchanged', () => {
    http.get('https://example.com/api/positions/').subscribe();

    const request = httpMock.expectOne('https://example.com/api/positions/');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
});
