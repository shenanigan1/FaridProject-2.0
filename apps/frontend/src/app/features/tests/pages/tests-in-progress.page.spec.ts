import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import {
  InProgressTestItem,
  ManagerOption,
  PositionApplicantsService,
} from '@features/positions/services/position-applicants.service';

import { TestsInProgressPage } from './tests-in-progress.page';

describe('TestsInProgressPage', () => {
  let fixture: ComponentFixture<TestsInProgressPage>;
  let component: TestsInProgressPage;
  let applicantsServiceSpy: jasmine.SpyObj<PositionApplicantsService>;

  const testsInProgress: InProgressTestItem[] = [
    {
      evaluationId: 41,
      applicationId: 7,
      candidateId: 15,
      candidateName: 'Jane Doe',
      candidateEmail: 'jane@example.com',
      positionId: 9,
      positionTitle: 'Linehaul Driver',
      templateName: 'Template A',
      updatedAt: '2026-04-09T10:00:00Z',
    },
  ];
  const managers: ManagerOption[] = [
    { id: 9, full_name: 'Alice Manager', email: 'alice.manager@example.com' },
    { id: 12, full_name: 'Bob Manager', email: 'bob.manager@example.com' },
  ];

  beforeEach(async () => {
    applicantsServiceSpy = jasmine.createSpyObj<PositionApplicantsService>(
      'PositionApplicantsService',
      [
        'listInProgressTests',
        'listManagers',
        'assignManagerToEvaluation',
        'getEvaluationQuestionnaire',
        'saveEvaluationQuestionnaire',
      ],
    );

    applicantsServiceSpy.listInProgressTests.and.returnValue(of(testsInProgress));
    applicantsServiceSpy.listManagers.and.returnValue(of(managers));
    applicantsServiceSpy.assignManagerToEvaluation.and.returnValue(
      of({ id: 41, assigned_to: 9 }),
    );
    applicantsServiceSpy.getEvaluationQuestionnaire.and.returnValue(
      of({
        evaluation_id: 41,
        template_name: 'Template A',
        questions: [
          {
            question_id: 10,
            title: 'Q1',
            text: 'Question text',
            is_mandatory: true,
            points: 5,
            candidate_answer: '',
            manager_comment: '',
            score: null,
          },
        ],
      }),
    );
    applicantsServiceSpy.saveEvaluationQuestionnaire.and.returnValue(
      of({
        evaluation_id: 41,
        template_name: 'Template A',
        questions: [
          {
            question_id: 10,
            title: 'Q1',
            text: 'Question text',
            is_mandatory: true,
            points: 5,
            candidate_answer: 'A',
            manager_comment: 'C',
            score: 4,
          },
        ],
      }),
    );

    await TestBed.configureTestingModule({
      imports: [TestsInProgressPage],
      providers: [
        provideRouter([]),
        { provide: PositionApplicantsService, useValue: applicantsServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestsInProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads tests in progress', () => {
    expect(applicantsServiceSpy.listInProgressTests).toHaveBeenCalledTimes(1);
    expect(applicantsServiceSpy.listManagers).toHaveBeenCalledTimes(1);
    expect(component.isLoading).toBeFalse();
  });

  it('filters tests by search query', (done) => {
    component.searchControl.setValue('linehaul');

    component.filteredTests$.subscribe((filteredTests) => {
      expect(filteredTests.length).toBe(1);
      expect(filteredTests[0].evaluationId).toBe(41);
      done();
    });
  });

  it('sets error message when API fails', async () => {
    applicantsServiceSpy.listInProgressTests.and.returnValue(
      throwError(() => new Error('failed')),
    );

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestsInProgressPage],
      providers: [
        provideRouter([]),
        { provide: PositionApplicantsService, useValue: applicantsServiceSpy },
      ],
    }).compileComponents();

    const errorFixture = TestBed.createComponent(TestsInProgressPage);
    errorFixture.detectChanges();

    expect(errorFixture.componentInstance.errorMessage).toBe(
      'Unable to load ongoing tests.',
    );
  });

  it('assigns manager selected from per-card manager selector', () => {
    component.setManagerSearch(41, 'alice');
    const filteredManagers = component.filteredManagers(41);
    expect(filteredManagers.length).toBe(1);
    expect(filteredManagers[0].id).toBe(9);

    component.setSelectedManager(41, '9');
    component.assignSelectedManager(testsInProgress[0]);

    expect(applicantsServiceSpy.assignManagerToEvaluation).toHaveBeenCalledWith(41, 9);
    expect(component.assignmentMessage).toContain('assigned');
  });

  it('opens evaluation questionnaire and saves answers/comments', () => {
    component.openEvaluation(41);
    expect(applicantsServiceSpy.getEvaluationQuestionnaire).toHaveBeenCalledWith(41);
    expect(component.questionnaire?.questions.length).toBe(1);

    component.updateQuestionAnswer(0, 'A');
    component.updateQuestionComment(0, 'C');
    component.saveQuestionnaire();

    expect(applicantsServiceSpy.saveEvaluationQuestionnaire).toHaveBeenCalled();
    expect(component.questionnaireMessage).toContain('saved');
  });
});
