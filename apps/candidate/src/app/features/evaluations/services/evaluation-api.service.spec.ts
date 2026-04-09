import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { EvaluationApiService } from './evaluation-api.service';

describe('EvaluationApiService', () => {
  let service: EvaluationApiService;
  let httpMock: HttpTestingController;

  const expectedBaseUrl = 'http://localhost:8000/api/evaluations';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EvaluationApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(EvaluationApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list candidate evaluations', () => {
    let actualCount = 0;

    service.listMyEvaluations().subscribe((items) => {
      actualCount = items.length;
      expect(items[0].createdAt).toBe('2026-04-08T12:00:00Z');
      expect(items[0].assignedTo).toBe(10);
    });

    const request = httpMock.expectOne(`${expectedBaseUrl}/`);
    expect(request.request.method).toBe('GET');

    request.flush([
      {
        id: 14,
        status: 'in_progress',
        created_at: '2026-04-08T12:00:00Z',
        updated_at: '2026-04-08T14:00:00Z',
        assigned_to: 10,
        subject: 5,
        position: 2,
      },
    ]);

    expect(actualCount).toBe(1);
  });

  it('should fetch evaluation questions', () => {
    service.getEvaluationQuestions(14).subscribe((items) => {
      expect(items.length).toBe(1);
      expect(items[0].evaluation_question_id).toBe(101);
    });

    const request = httpMock.expectOne(`${expectedBaseUrl}/14/questions/`);
    expect(request.request.method).toBe('GET');

    request.flush([
      {
        evaluation_question_id: 101,
        order: 1,
        is_mandatory: true,
        section: 'Core',
        question_label: 'Safety behavior',
        question_type: 'scale',
        min_score: 1,
        max_score: 5,
        answer: null,
      },
    ]);
  });

  it('should submit answers for an evaluation', () => {
    service
      .submitAnswers(14, [{ evaluation_question_id: 101, value: 4 }])
      .subscribe((response) => {
        expect(response.updated_answers).toBe(1);
        expect(response.status).toBe('in_progress');
      });

    const request = httpMock.expectOne(`${expectedBaseUrl}/14/submit-answers/`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      answers: [{ evaluation_question_id: 101, value: 4 }],
    });

    request.flush({
      updated_answers: 1,
      answered_questions: 1,
      total_questions: 2,
      status: 'in_progress',
    });
  });
});
