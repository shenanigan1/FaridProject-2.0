import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import {
  JobApplicationPayload,
  JobApplicationService,
} from './job-application.service';

describe('JobApplicationService', () => {
  let service: JobApplicationService;
  let httpMock: HttpTestingController;

  const expectedUrl = 'http://localhost:8000/api/jobapplications/';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        JobApplicationService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(JobApplicationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('posts job application payload to API', () => {
    const payload: JobApplicationPayload = {
      positionId: 9,
      candidateId: 15,
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice@example.com',
      phone: '+3300000000',
      motivation: 'I have 4 years of experience.',
    };

    service.applyToOffer(payload).subscribe((response) => {
      expect(response).toEqual({
        id: 44,
        candidate: 15,
        position: 9,
        status: 'applied',
      });
    });

    const request = httpMock.expectOne(expectedUrl);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      candidate: 15,
      position: 9,
      status: 'applied',
    });

    request.flush({
      id: 44,
      candidate: 15,
      position: 9,
      status: 'applied',
      created_at: '2026-04-08T10:10:00Z',
      updated_at: '2026-04-08T10:10:00Z',
    });
  });
});
