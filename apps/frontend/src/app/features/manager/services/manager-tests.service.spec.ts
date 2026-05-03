import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ManagerTestsService } from './manager-tests.service';

describe('ManagerTestsService', () => {
  let service: ManagerTestsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ManagerTestsService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ManagerTestsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads assigned evaluations from the manager-filtered evaluations endpoint', (done) => {
    service.listAssignedTests().subscribe((items) => {
      expect(items.length).toBe(1);
      expect(items[0].id).toBe(42);
      expect(items[0].candidateName).toBe('Jean Dupont');
      done();
    });

    const request = httpMock.expectOne('/api/evaluations/');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 42,
        subject: 9,
        application: 2,
        position: 3,
        template_version: 4,
        assigned_to: 5,
        status: 'in_progress',
        subject_comment: '',
        internal_comment: '',
        template_name: 'Conduite',
        subject_full_name: 'Jean Dupont',
        subject_email: 'jean@example.com',
        position_title: 'Conducteur',
        assigned_to_full_name: 'Marc Manager',
        created_at: '2026-04-01T08:00:00Z',
        updated_at: '2026-04-01T09:00:00Z',
        completed_at: null,
        validated_at: null,
      },
    ]);
  });

  it('saves questionnaire answers on the selected evaluation only', () => {
    service
      .saveQuestionnaire(42, {
        answers: [
          {
            question_id: 7,
            candidate_answer: 'Answer',
            manager_comment: 'Comment',
            score: 4,
          },
        ],
        section_comments: [{ section_id: 3, manager_comment: 'Section', completed: true }],
        test_manager_comment: 'Global',
        complete_sections: true,
      })
      .subscribe();

    const request = httpMock.expectOne('/api/evaluations/42/questionnaire/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      answers: [
        {
          question_id: 7,
          candidate_answer: 'Answer',
          manager_comment: 'Comment',
          score: 4,
        },
      ],
      section_comments: [{ section_id: 3, manager_comment: 'Section', completed: true }],
      test_manager_comment: 'Global',
      complete_sections: true,
    });
    request.flush({
      evaluation_id: 42,
      template_name: 'Conduite',
      test_manager_comment: 'Global',
      sections: [],
      questions: [],
    });
  });

  it('loads one assigned evaluation detail by id', (done) => {
    service.getAssignedTest(42).subscribe((item) => {
      expect(item.id).toBe(42);
      expect(item.templateName).toBe('Conduite');
      done();
    });

    const request = httpMock.expectOne('/api/evaluations/42/');
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 42,
      subject: 9,
      application: 2,
      position: 3,
      template_version: 4,
      assigned_to: 5,
      status: 'in_progress',
      subject_comment: '',
      internal_comment: '',
      template_name: 'Conduite',
      subject_full_name: 'Jean Dupont',
      subject_email: 'jean@example.com',
      position_title: 'Conducteur',
      assigned_to_full_name: 'Marc Manager',
      created_at: '2026-04-01T08:00:00Z',
      updated_at: '2026-04-01T09:00:00Z',
      completed_at: null,
      validated_at: null,
    });
  });
});
