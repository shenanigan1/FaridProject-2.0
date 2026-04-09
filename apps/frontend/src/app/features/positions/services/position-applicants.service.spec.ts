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

  it('maps applicants for a position with candidate details and ongoing tests count', () => {
    let names: string[] = [];
    let ongoingTestsCount = 0;

    service.listByPosition(9).subscribe((applicants) => {
      names = applicants.map((applicant) => applicant.fullName);
      ongoingTestsCount = applicants[0]?.ongoingTestsCount ?? 0;
    });

    const applicationsRequest = httpMock.expectOne('/api/jobapplications/');
    const candidatesRequest = httpMock.expectOne('/api/candidates/');
    const evaluationsRequest = httpMock.expectOne('/api/evaluations/');

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
    evaluationsRequest.flush([
      {
        id: 700,
        application: 1,
        status: 'in_progress',
        updated_at: '2026-04-08T11:00:00Z',
      },
    ]);

    expect(names).toEqual(['Jane Doe']);
    expect(ongoingTestsCount).toBe(1);
  });

  it('lists in-progress tests for all positions', () => {
    let ids: number[] = [];

    service.listInProgressTests().subscribe((testsInProgress) => {
      ids = testsInProgress.map((item) => item.evaluationId);
      expect(testsInProgress[0].positionTitle).toBe('Driver Linehaul');
      expect(testsInProgress[0].candidateName).toBe('Jane Doe');
    });

    const applicationsRequest = httpMock.expectOne('/api/jobapplications/');
    const candidatesRequest = httpMock.expectOne('/api/candidates/');
    const evaluationsRequest = httpMock.expectOne('/api/evaluations/');
    const positionsRequest = httpMock.expectOne('/api/positions/');

    applicationsRequest.flush([
      {
        id: 1,
        candidate: 11,
        position: 9,
        status: 'applied',
        created_at: '2026-04-08T10:00:00Z',
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
    evaluationsRequest.flush([
      {
        id: 700,
        application: 1,
        status: 'in_progress',
        updated_at: '2026-04-08T11:00:00Z',
      },
      {
        id: 701,
        application: 1,
        status: 'completed',
        updated_at: '2026-04-08T12:00:00Z',
      },
    ]);
    positionsRequest.flush([
      {
        id: 9,
        title: 'Driver Linehaul',
      },
    ]);

    expect(ids).toEqual([700]);
  });

  it('lists launchable templates', () => {
    let templateNames: string[] = [];

    service.listLaunchableTemplates().subscribe((templates) => {
      templateNames = templates.map((template) => template.name);
    });

    const request = httpMock.expectOne('/api/templates/');
    request.flush([
      { id: 1, name: 'Driver template' },
      { id: 2, name: 'Manager template' },
    ]);

    expect(templateNames).toEqual(['Driver template', 'Manager template']);
  });

  it('launches a test for an application', () => {
    let responseId = 0;

    service.launchTestForApplication(10, 3).subscribe((response) => {
      responseId = response[0].id;
    });

    const request = httpMock.expectOne('/api/evaluations/launch/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      application_id: 10,
      template_id: 3,
    });

    request.flush([
      {
        id: 55,
        application: 10,
        status: 'in_progress',
      },
    ]);

    expect(responseId).toBe(55);
  });

  it('launches a test using position default templates when no explicit template id is provided', () => {
    service.launchTestForApplication(99).subscribe((response) => {
      expect(response.length).toBe(1);
      expect(response[0].id).toBe(56);
    });

    const request = httpMock.expectOne('/api/evaluations/launch/');
    expect(request.request.body).toEqual({
      application_id: 99,
    });

    request.flush([
      {
        id: 56,
        application: 99,
        status: 'in_progress',
      },
    ]);
  });

  it('assigns a manager to an evaluation', () => {
    let assignedTo: number | null = null;
    service.assignManagerToEvaluation(70, 12).subscribe((response) => {
      assignedTo = response.assigned_to;
    });

    const request = httpMock.expectOne('/api/evaluations/70/');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ assigned_to: 12 });
    request.flush({ id: 70, assigned_to: 12 });

    expect(assignedTo).toBe(12);
  });
});
