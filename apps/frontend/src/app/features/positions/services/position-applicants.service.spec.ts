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

  it('maps applicants for a position with candidate details and test counters', () => {
    let names: string[] = [];
    let ongoingTestsCount = 0;
    let completedTestsCount = 0;

    service.listByPosition(9).subscribe((applicants) => {
      names = applicants.map((applicant) => applicant.fullName);
      ongoingTestsCount = applicants[0]?.ongoingTestsCount ?? 0;
      completedTestsCount = applicants[0]?.completedTestsCount ?? 0;
    });

    const applicationsRequest = httpMock.expectOne('/api/jobapplications/?position=9');
    const evaluationsRequest = httpMock.expectOne('/api/evaluations/');

    applicationsRequest.flush([
      {
        id: 1,
        candidate: 11,
        candidate_full_name: 'Jane Doe',
        candidate_email: 'jane@example.com',
        candidate_phone: '+330000000',
        position: 9,
        status: 'applied',
        created_at: '2026-04-08T10:00:00Z',
      },
    ]);

    evaluationsRequest.flush([
      {
        id: 700,
        application: 1,
        status: 'in_progress',
        total_sections_count: 1,
        updated_at: '2026-04-08T11:00:00Z',
      },
      {
        id: 701,
        application: 1,
        status: 'completed',
        total_sections_count: 1,
        updated_at: '2026-04-08T12:00:00Z',
      },
      {
        id: 702,
        application: 1,
        status: 'validated',
        total_sections_count: 1,
        updated_at: '2026-04-08T13:00:00Z',
      },
      {
        id: 703,
        application: 1,
        status: 'completed',
        total_sections_count: 0,
        updated_at: '2026-04-08T14:00:00Z',
      },
    ]);

    expect(names).toEqual(['Jane Doe']);
    expect(ongoingTestsCount).toBe(1);
    expect(completedTestsCount).toBe(2);
  });

  it('does not count incomplete in-progress evaluations without sections as launched tests', () => {
    let ongoingTestsCount = -1;

    service.listByPosition(9).subscribe((applicants) => {
      ongoingTestsCount = applicants[0]?.ongoingTestsCount ?? -1;
    });

    httpMock.expectOne('/api/jobapplications/?position=9').flush([
      {
        id: 1,
        candidate: 11,
        candidate_full_name: 'Jane Doe',
        candidate_email: 'jane@example.com',
        position: 9,
        status: 'applied',
        created_at: '2026-04-08T10:00:00Z',
      },
    ]);
    httpMock.expectOne('/api/evaluations/').flush([
      {
        id: 700,
        application: 1,
        status: 'in_progress',
        total_sections_count: 0,
        updated_at: '2026-04-08T11:00:00Z',
      },
    ]);

    expect(ongoingTestsCount).toBe(0);
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

  it('follows paginated responses so newly launched tests are visible', () => {
    let ids: number[] = [];

    service.listInProgressTests().subscribe((testsInProgress) => {
      ids = testsInProgress.map((item) => item.evaluationId);
    });

    httpMock.expectOne('/api/jobapplications/').flush({
      results: [],
      next: '/api/jobapplications/?page=2',
    });
    httpMock.expectOne('/api/jobapplications/?page=2').flush({
      results: [
        {
          id: 9,
          candidate: 51,
          position: 88,
          status: 'applied',
          created_at: '2026-04-08T10:00:00Z',
        },
      ],
      next: null,
    });

    httpMock.expectOne('/api/candidates/').flush({
      results: [],
      next: '/api/candidates/?page=2',
    });
    httpMock.expectOne('/api/candidates/?page=2').flush({
      results: [
        {
          id: 51,
          user: {
            first_name: 'New',
            last_name: 'Candidate',
            email: 'new@example.com',
          },
        },
      ],
      next: null,
    });

    httpMock.expectOne('/api/evaluations/').flush({
      results: [],
      next: '/api/evaluations/?page=2',
    });
    httpMock.expectOne('/api/evaluations/?page=2').flush({
      results: [
        {
          id: 999,
          application: 9,
          status: 'in_progress',
          updated_at: '2026-04-09T11:00:00Z',
        },
      ],
      next: null,
    });

    httpMock.expectOne('/api/positions/').flush({
      results: [],
      next: '/api/positions/?page=2',
    });
    httpMock.expectOne('/api/positions/?page=2').flush({
      results: [{ id: 88, title: 'Night Driver' }],
      next: null,
    });

    expect(ids).toEqual([999]);
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

    service.launchTestForApplication(10, 3, [{ section_id: 8, manager_id: 12 }]).subscribe((response) => {
      responseId = response[0].id;
    });

    const request = httpMock.expectOne('/api/evaluations/launch/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      application_id: 10,
      template_id: 3,
      section_assignments: [{ section_id: 8, manager_id: 12 }],
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

    if (assignedTo === null) {
      fail('assignedTo should not be null');
      return;
    }
    expect(assignedTo).toBe(12);
  });

  it('rejects an application', () => {
    let status = '';
    service.rejectApplication(77).subscribe((response) => {
      status = response.status;
    });

    const request = httpMock.expectOne('/api/jobapplications/77/');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'rejected' });
    request.flush({ id: 77, status: 'rejected' });

    expect(status).toBe('rejected');
  });

  it('lists managers with optional search query', () => {
    let managerIds: number[] = [];
    service.listManagers('alice').subscribe((managers) => {
      managerIds = managers.map((manager) => manager.id);
    });

    const request = httpMock.expectOne('/api/evaluations/managers/?q=alice');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 9,
        full_name: 'Alice Manager',
        email: 'alice.manager@example.com',
      },
    ]);

    expect(managerIds).toEqual([9]);
  });

  it('loads questionnaire for an evaluation', () => {
    let questionCount = 0;
    service.getEvaluationQuestionnaire(44).subscribe((payload) => {
      questionCount = payload.questions.length;
    });

    const request = httpMock.expectOne('/api/evaluations/44/questionnaire/');
    expect(request.request.method).toBe('GET');
    request.flush({
      evaluation_id: 44,
      template_name: 'Template',
      questions: [{ question_id: 1, title: 'Q', text: 'T', is_mandatory: true, points: 5, candidate_answer: '', manager_comment: '', score: null }],
    });

    expect(questionCount).toBe(1);
  });

  it('saves questionnaire answers', () => {
    let saved = false;
    service
      .saveEvaluationQuestionnaire(44, [
        { question_id: 1, candidate_answer: 'A', manager_comment: 'C', score: 4 },
      ])
      .subscribe(() => {
        saved = true;
      });

    const request = httpMock.expectOne('/api/evaluations/44/questionnaire/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.answers.length).toBe(1);
    request.flush({
      evaluation_id: 44,
      template_name: 'Template',
      questions: [{ question_id: 1, title: 'Q', text: 'T', is_mandatory: true, points: 5, candidate_answer: 'A', manager_comment: 'C', score: 4 }],
    });

    expect(saved).toBeTrue();
  });
});
