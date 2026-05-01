import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ManagerTestsService } from '../services/manager-tests.service';
import { ManagerTestDetailPage } from './manager-test-detail.page';

const baseQuestion = {
  question_id: 7,
  format: 'practical',
  title: 'Question',
  text: 'Texte',
  explanation: '',
  is_mandatory: true,
  points: 5,
  difficulty: 'intermediate',
  rubric: {},
  candidate_answer: '',
  manager_comment: '',
  score: null,
};

describe('ManagerTestDetailPage', () => {
  let fixture: ComponentFixture<ManagerTestDetailPage>;
  let component: ManagerTestDetailPage;
  let testsSpy: jasmine.SpyObj<ManagerTestsService>;

  beforeEach(async () => {
    testsSpy = jasmine.createSpyObj<ManagerTestsService>('ManagerTestsService', [
      'getAssignedTest',
      'getQuestionnaire',
      'saveQuestionnaire',
    ]);

    testsSpy.getAssignedTest.and.returnValue(
      of({
        id: 42,
        status: 'in_progress',
        candidateName: 'Jean Dupont',
        candidateEmail: 'jean@example.com',
        positionTitle: 'Conducteur',
        templateName: 'Conduite',
        createdAt: '2026-04-01T08:00:00Z',
        updatedAt: '2026-04-01T09:00:00Z',
        completedAt: null,
        validatedAt: null,
      }),
    );
    testsSpy.getQuestionnaire.and.returnValue(
      of({
        evaluation_id: 42,
        template_name: 'Conduite',
        questions: [
          {
            ...baseQuestion,
            rubric: { criteria: ['Controle visuel', 'Securite'] },
          },
        ],
      }),
    );
    testsSpy.saveQuestionnaire.and.returnValue(
      of({
        evaluation_id: 42,
        template_name: 'Conduite',
        questions: [
          {
            ...baseQuestion,
            candidate_answer: 'OK',
            manager_comment: 'RAS',
            score: 5,
          },
        ],
      }),
    );

    await TestBed.configureTestingModule({
      imports: [ManagerTestDetailPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '42' }) } },
        },
        { provide: ManagerTestsService, useValue: testsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerTestDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the selected test and questionnaire from the route id', () => {
    expect(testsSpy.getAssignedTest).toHaveBeenCalledWith(42);
    expect(testsSpy.getQuestionnaire).toHaveBeenCalledWith(42);
    expect(component.test()?.id).toBe(42);
    expect(component.questionnaire()?.questions.length).toBe(1);
  });

  it('saves questionnaire answers for the selected test', () => {
    component.updateAnswer(0, 'candidate_answer', 'OK');
    component.updateAnswer(0, 'manager_comment', 'RAS');
    component.updateScore(0, '5');
    component.saveQuestionnaire();

    expect(testsSpy.saveQuestionnaire).toHaveBeenCalledWith(42, [
      {
        question_id: 7,
        candidate_answer: 'OK',
        manager_comment: 'RAS',
        score: 5,
      },
    ]);
  });

  it('extracts selectable options from the question rubric', () => {
    component.questionnaire.set({
      evaluation_id: 42,
      template_name: 'Conduite',
      questions: [
        {
          ...baseQuestion,
          format: 'mcq',
          rubric: { options: [{ label: 'Permis C' }, { label: 'Permis CE' }] },
        },
      ],
    });

    expect(component.choiceOptions(component.questionnaire()!.questions[0])).toEqual([
      'Permis C',
      'Permis CE',
    ]);

    component.setChoice(0, 'Permis CE');

    expect(component.questionnaire()!.questions[0].candidate_answer).toBe('Permis CE');
  });

  it('blocks save when a mandatory answer is missing', () => {
    component.saveQuestionnaire();

    expect(testsSpy.saveQuestionnaire).not.toHaveBeenCalled();
    expect(component.message()).toContain('Reponse obligatoire manquante');
  });

  it('bounds score to the question points', () => {
    component.updateScore(0, '99');

    expect(component.questionnaire()!.questions[0].score).toBe(5);
  });
});
