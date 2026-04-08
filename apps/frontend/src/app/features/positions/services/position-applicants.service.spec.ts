import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PositionApplicantsService } from './position-applicants.service';

describe('PositionApplicantsService', () => {
  let service: PositionApplicantsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PositionApplicantsService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PositionApplicantsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('maps applicants for a position with candidate details', () => {
    let names: string[] = [];

    service.listByPosition(9).subscribe((applicants) => {
      names = applicants.map((applicant) => applicant.fullName);
    });

    const applicationsRequest = httpMock.expectOne('/api/jobapplications/');
    const candidatesRequest = httpMock.expectOne('/api/candidates/');

    applicationsRequest.flush([
      {
        id: 1,
        candidate: 11,
        position: 9,
        status: 'applied',
        created_at: '2026-04-08T10:00:00Z',
      },
      {
        id: 2,
        candidate: 12,
        position: 7,
        status: 'applied',
        created_at: '2026-04-08T09:00:00Z',
      },
    ]);

    candidatesRequest.flush([
      {
        id: 11,
        user: {
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@example.com',
          phone: '+330000000',
        },
      },
    ]);

    expect(names).toEqual(['Jane Doe']);
  });
});
