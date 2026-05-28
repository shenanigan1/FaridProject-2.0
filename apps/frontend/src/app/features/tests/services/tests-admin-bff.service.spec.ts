import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { TestsAdminBffService } from './tests-admin-bff.service';

describe('TestsAdminBffService', () => {
  let service: TestsAdminBffService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TestsAdminBffService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TestsAdminBffService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('maps evaluations into validation queue items from API data only', () => {
    const result = service.listValidationQueue();
    let rows: ReturnType<typeof service.listValidationQueue> extends import('rxjs').Observable<infer T> ? T : never = [];
    result.subscribe((items) => {
      rows = items;
    });

    http.expectOne('/api/evaluations/').flush([
      {
        id: 7,
        subject: 3,
        application: 11,
        status: 'in_progress',
        template_name: 'Conduite de Nuit',
        subject_full_name: 'Nadia Benali',
        subject_email: 'nadia@example.com',
        position_title: 'Chauffeur SPL',
        updated_at: '2026-05-01T10:00:00Z',
      },
    ]);

    expect(rows).toEqual([
      jasmine.objectContaining({
        evaluationId: 7,
        candidateName: 'Nadia Benali',
        templateName: 'Conduite de Nuit',
        statusLabel: 'En cours',
      }),
    ]);
  });

  it('lists all created tests with progress from API data', () => {
    let rows: ReturnType<typeof service.listActiveTests> extends import('rxjs').Observable<infer T> ? T : never = [];

    service.listActiveTests().subscribe((items) => {
      rows = items;
    });

    http.expectOne('/api/evaluations/').flush([
      {
        id: 7,
        subject: 3,
        application: 11,
        status: 'in_progress',
        template_name: 'Conduite de Nuit',
        subject_full_name: 'Nadia Benali',
        position_title: 'Chauffeur SPL',
        updated_at: '2026-05-01T10:00:00Z',
        progress_percent: 66,
        completed_sections_count: 2,
        total_sections_count: 3,
      },
      {
        id: 8,
        status: 'completed',
        template_name: 'Hazmat',
        subject_full_name: 'John Doe',
        updated_at: '2026-05-01T11:00:00Z',
        progress_percent: 100,
      },
      {
        id: 9,
        status: 'validated',
        template_name: 'Routier',
        subject_full_name: 'Sarah Miller',
        updated_at: '2026-05-01T12:00:00Z',
        progress_percent: 100,
      },
    ]);

    expect(rows).toEqual([
      jasmine.objectContaining({
        evaluationId: 9,
        candidateName: 'Sarah Miller',
        templateName: 'Routier',
        progressPercent: 100,
        statusLabel: 'Valide',
      }),
      jasmine.objectContaining({
        evaluationId: 8,
        candidateName: 'John Doe',
        templateName: 'Hazmat',
        progressPercent: 100,
        statusLabel: 'Score sous revue',
      }),
      jasmine.objectContaining({
        evaluationId: 7,
        candidateId: 3,
        applicationId: 11,
        candidateName: 'Nadia Benali',
        templateName: 'Conduite de Nuit',
        progressPercent: 66,
        completedSectionsCount: 2,
        totalSectionsCount: 3,
      }),
    ]);
  });

  it('sends rejected status when refusing an assessment', () => {
    service.rejectAssessment(12).subscribe((result) => {
      expect(result).toEqual({ ok: true });
    });

    const request = http.expectOne('/api/evaluations/12/');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'rejected' });
    request.flush({ id: 12, status: 'rejected' });
  });

  it('builds assessment scores from questionnaire sections', () => {
    let score = 0;

    service.getAssessment(4).subscribe((assessment) => {
      score = assessment.score;
    });

    http.expectOne('/api/evaluations/4/').flush({
      id: 4,
      status: 'completed',
      template_name: 'Hazmat Security Test',
      subject_full_name: 'John Doe',
      subject_email: 'john@example.com',
      position_title: 'Driver',
      updated_at: '2026-05-01T10:00:00Z',
    });
    http.expectOne('/api/evaluations/4/questionnaire/').flush({
      evaluation_id: 4,
      template_name: 'Hazmat Security Test',
      test_manager_comment: 'Feedback',
      sections: [
        {
          section_id: 1,
          title: 'Braking Technique',
          description: '',
          weight: 50,
          assigned_to: 2,
          assigned_to_full_name: 'Marc Manager',
          manager_comment: '',
          completed_at: null,
          questions: [{ question_id: 9, points: 10, score: 9 }],
        },
      ],
      questions: [{ question_id: 9, points: 10, score: 9 }],
    });

    expect(score).toBe(90);
  });
});
