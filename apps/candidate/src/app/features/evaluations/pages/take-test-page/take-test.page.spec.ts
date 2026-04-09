import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { TakeTestPageComponent } from './take-test.page';
import { EvaluationApiService } from '@features/evaluations/services/evaluation-api.service';

describe('TakeTestPageComponent', () => {
  let fixture: ComponentFixture<TakeTestPageComponent>;
  let component: TakeTestPageComponent;
  let evaluationApiServiceSpy: jasmine.SpyObj<EvaluationApiService>;

  beforeEach(async () => {
    evaluationApiServiceSpy = jasmine.createSpyObj<EvaluationApiService>('EvaluationApiService', [
      'getEvaluationQuestions',
      'submitAnswers',
    ]);

    await TestBed.configureTestingModule({
      imports: [TakeTestPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '14' }),
            },
          },
        },
        { provide: EvaluationApiService, useValue: evaluationApiServiceSpy },
      ],
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(TakeTestPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should load questions from the API based on route id', fakeAsync(() => {
    evaluationApiServiceSpy.getEvaluationQuestions.and.returnValue(
      of([
        {
          evaluation_question_id: 91,
          order: 1,
          is_mandatory: true,
          section: 'Core',
          question_label: 'Follow safety procedures',
          question_type: 'scale',
          min_score: 1,
          max_score: 5,
          answer: null,
        },
      ]),
    );

    createComponent();
    tick();
    fixture.detectChanges();

    expect(component.questions.length).toBe(1);
    expect(evaluationApiServiceSpy.getEvaluationQuestions).toHaveBeenCalledWith(14);
  }));

  it('should submit only answered questions', () => {
    evaluationApiServiceSpy.getEvaluationQuestions.and.returnValue(
      of([
        {
          evaluation_question_id: 91,
          order: 1,
          is_mandatory: true,
          section: 'Core',
          question_label: 'Follow safety procedures',
          question_type: 'scale',
          min_score: 1,
          max_score: 5,
          answer: null,
        },
      ]),
    );
    evaluationApiServiceSpy.submitAnswers.and.returnValue(
      of({
        updated_answers: 1,
        answered_questions: 1,
        total_questions: 1,
        status: 'completed',
      }),
    );

    createComponent();

    component.answers[91] = 5;
    component.onSubmit();

    expect(evaluationApiServiceSpy.submitAnswers).toHaveBeenCalledWith(14, [
      { evaluation_question_id: 91, value: 5 },
    ]);
  });
});
