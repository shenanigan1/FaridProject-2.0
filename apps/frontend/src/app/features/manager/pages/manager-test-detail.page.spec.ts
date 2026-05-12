import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ManagerQuestionnaireQuestion, ManagerTestsService } from '../services/manager-tests.service';
import { ManagerTestDetailPage } from './manager-test-detail.page';

const baseQuestion: ManagerQuestionnaireQuestion = {
  question_id: 7,
  section_id: 3,
  section_title: 'Conduite',
  format: 'practical',
  title: 'Question',
  text: 'Texte',
  explanation: '',
  is_mandatory: true,
  is_eliminatory: false,
  points: 5,
  max_score: 5,
  difficulty: 'intermediate',
  rubric: {},
  candidate_answer: '',
  manager_comment: '',
  score: null,
};

function questionnaireWithQuestion(question: ManagerQuestionnaireQuestion = baseQuestion) {
  return {
    evaluation_id: 42,
    template_name: 'Conduite',
    test_manager_comment: '',
    sections: [
      {
        section_id: 3,
        title: 'Conduite',
        description: '',
        weight: 100,
        assigned_to: 9,
        assigned_to_full_name: 'Marc Manager',
        manager_comment: '',
        completed_at: null,
        questions: [question],
      },
    ],
    questions: [question],
  };
}

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
      of(questionnaireWithQuestion({
        ...baseQuestion,
        rubric: { criteria: ['Controle visuel', 'Securite'] },
      })),
    );
    testsSpy.saveQuestionnaire.and.returnValue(
      of(questionnaireWithQuestion({
        ...baseQuestion,
        candidate_answer: 'OK',
        manager_comment: 'RAS',
        score: 5,
      })),
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
    expect(component.questionnaire()?.sections.length).toBe(1);
  });

  it('saves questionnaire answers for the selected test', () => {
    component.updateTestComment('Test global');
    component.updateSectionComment(3, 'Section ok');
    component.updateAnswer(7, 'candidate_answer', 'OK');
    component.updateAnswer(7, 'manager_comment', 'RAS');
    component.updateScore(7, '5');
    component.saveQuestionnaire();

    expect(testsSpy.saveQuestionnaire).toHaveBeenCalledWith(42, {
      answers: [
        {
          question_id: 7,
          candidate_answer: 'OK',
          manager_comment: 'RAS',
          score: 5,
        },
      ],
      section_comments: [{ section_id: 3, manager_comment: 'Section ok', completed: false }],
      test_manager_comment: 'Test global',
      complete_sections: false,
    });
  });

  it('extracts selectable options from the question rubric', () => {
    component.questionnaire.set(questionnaireWithQuestion({
      ...baseQuestion,
      format: 'mcq',
      rubric: { options: [{ label: 'Permis C' }, { label: 'Permis CE' }] },
    }));

    expect(component.choiceOptions(component.questionnaire()!.questions[0])).toEqual([
      'Permis C',
      'Permis CE',
    ]);

    component.setChoice(7, 'Permis CE');

    expect(component.questionnaire()!.questions[0].candidate_answer).toBe('Permis CE');
    expect(component.questionnaire()!.sections[0].questions[0].candidate_answer).toBe('Permis CE');
  });

  it('auto-scores multiple-choice answers while still allowing evaluator override', () => {
    component.questionnaire.set(questionnaireWithQuestion({
      ...baseQuestion,
      format: 'mcq',
      points: 10,
      max_score: 10,
      explanation: 'Gilet\nCasque',
      rubric: {
        options: ['Gilet', 'Casque', 'Sandales'],
        correct_answers: ['Gilet', 'Casque'],
      },
    }));

    component.toggleChoice(7, 'Gilet');

    expect(component.questionnaire()!.questions[0].candidate_answer).toBe('["Gilet"]');
    expect(component.questionnaire()!.questions[0].score).toBe(5);

    component.toggleChoice(7, 'Casque');

    expect(component.questionnaire()!.questions[0].candidate_answer).toBe('["Gilet","Casque"]');
    expect(component.questionnaire()!.questions[0].score).toBe(10);

    component.updateScore(7, '8');

    expect(component.questionnaire()!.questions[0].score).toBe(8);
  });

  it('blocks validation when a mandatory answer is missing', () => {
    component.saveQuestionnaire(true);

    expect(testsSpy.saveQuestionnaire).not.toHaveBeenCalled();
    expect(component.message()).toContain('Reponse obligatoire manquante');
  });

  it('bounds score to the question points', () => {
    component.updateScore(7, '99');

    expect(component.questionnaire()!.questions[0].score).toBe(5);
  });
});
