import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { TestsAdminBffService } from '../services/tests-admin-bff.service';
import { TestAssessmentPage } from './test-assessment.page';

describe('TestAssessmentPage', () => {
  let fixture: ComponentFixture<TestAssessmentPage>;
  let bff: jasmine.SpyObj<TestsAdminBffService>;

  beforeEach(async () => {
    bff = jasmine.createSpyObj<TestsAdminBffService>('TestsAdminBffService', [
      'getAssessment',
      'validateAssessment',
    ]);
    bff.getAssessment.and.returnValue(
      of({
        evaluationId: 12,
        candidateName: 'Nadia Benali',
        templateName: 'Hazmat Security Test',
        positionTitle: 'Driver',
        score: 88,
        maxScore: 100,
        status: 'completed',
        feedback: 'Bon niveau terrain.',
        evaluatorName: 'Marc Manager',
        modules: [{ sectionId: 1, title: 'Braking Technique', score: 90, maxScore: 100 }],
        questions: [{
          questionId: 9,
          sectionTitle: 'Braking Technique',
          title: 'Equipements',
          text: 'Quels equipements ?',
          format: 'mcq',
          candidateAnswer: 'Gilet',
          expectedAnswer: 'Gilet; Casque',
          managerComment: 'Partiel',
          score: 5,
          points: 10,
        }],
      }),
    );
    bff.validateAssessment.and.returnValue(of({ ok: true }));

    await TestBed.configureTestingModule({
      imports: [TestAssessmentPage],
      providers: [
        provideRouter([]),
        { provide: TestsAdminBffService, useValue: bff },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '12' }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestAssessmentPage);
    fixture.detectChanges();
  });

  it('renders score, module scores and evaluator feedback', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Test Assessment');
    expect(text).toContain('88');
    expect(text).toContain('Braking Technique');
    expect(text).toContain('Bon niveau terrain.');
    expect(text).toContain('Reponses aux questions');
    expect(text).toContain('Gilet; Casque');
  });

  it('validates assessment through API facade', () => {
    fixture.componentInstance.validateResults();

    expect(bff.validateAssessment).toHaveBeenCalledWith(12);
  });
});
