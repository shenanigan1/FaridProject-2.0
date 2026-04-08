import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CandidatesApiService } from './candidates-api.service';

describe('CandidatesApiService', () => {
  let service: CandidatesApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CandidatesApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(CandidatesApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('calls candidates list endpoint', () => {
    service.list().subscribe();

    const request = httpMock.expectOne('/api/candidates/');
    expect(request.request.method).toBe('GET');

    request.flush([]);
  });
});
