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
    let assignedTemplateName: string | null = null;

    service.listByPosition(9).subscribe((applicants) => {
      names = applicants.map((applicant) => applicant.fullName);
      assignedTemplateName = applicants[0]?.assignedTemplateName ?? null;
    });

    const applicationsRequest = httpMock.expectOne('/api/jobapplications/');
    const candidatesRequest = httpMock.expectOne('/api/candidates/');
    const templatesRequest = httpMock.expectOne('/api/templates/');

    applicationsRequest.flush([
      {
        id: 1,
        candidate: 11,
        position: 9,
        status: 'applied',
        assigned_template: 3,
        created_at: '2026-04-08T10:00:00Z',
      },
      {
        id: 2,
        candidate: 12,
        position: 7,
        status: 'applied',
        assigned_template: null,
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

    templatesRequest.flush([{ id: 3, name: 'French test' }]);

    expect(names).toEqual(['Jane Doe']);
    expect(assignedTemplateName).toBe('French test');
  });

  it('lists available tests', () => {
    let testsCount = 0;

    service.listTests().subscribe((tests) => {
      testsCount = tests.length;
    });

    const req = httpMock.expectOne('/api/templates/');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, name: 'Logic test' }]);

    expect(testsCount).toBe(1);
  });

  it('assigns selected test to applicant', () => {
    service.assignTestToApplicant(42, { templateId: 12 }).subscribe();

    const req = httpMock.expectOne('/api/jobapplications/42/');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ assigned_template: 12 });
    req.flush({});
  });
});
