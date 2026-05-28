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
      'rejectAssessment',
    ]);
    bff.getAssessment.and.returnValue(
      of({
        evaluationId: 12,
        candidateId: 4,
        applicationId: 9,
        candidateName: 'Nadia Benali',
        templateName: 'Hazmat Security Test',
        positionTitle: 'Driver',
        score: 88,
        maxScore: 100,
        status: 'completed',
        feedback: 'Bon niveau terrain.',
        evaluatorName: 'Marc Manager',
        modules: [
          { sectionId: 1, title: 'Braking Technique', score: 90, maxScore: 100 },
          { sectionId: 2, title: 'Reverse Parking', score: 75, maxScore: 100 },
        ],
        sections: [
          {
            sectionId: 1,
            title: 'Braking Technique',
            description: 'Freinage et anticipation.',
            score: 90,
            maxScore: 100,
            assignedToFullName: 'Marc Manager',
            managerComment: 'Section maitrisee.',
            completedAt: '2026-05-14T09:00:00Z',
            questions: [
              {
                questionId: 42,
                title: 'Distance de freinage',
                text: 'Quelle distance faut-il garder ?',
                format: 'mcq',
                candidateAnswer: 'Deux secondes',
                correctAnswer: 'Trois secondes',
                managerComment: 'Confusion sur la regle.',
                score: 6,
                maxScore: 10,
                isMandatory: true,
                isEliminatory: false,
              },
            ],
          },
          {
            sectionId: 2,
            title: 'Reverse Parking',
            description: 'Manoeuvres a quai.',
            score: 75,
            maxScore: 100,
            assignedToFullName: 'Sarah Manager',
            managerComment: '',
            completedAt: null,
            questions: [],
          },
        ],
      }),
    );
    bff.validateAssessment.and.returnValue(of({ ok: true }));
    bff.rejectAssessment.and.returnValue(of({ ok: true }));

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
    const host = fixture.nativeElement as HTMLElement;
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(host.querySelector('.ff-page-bar')).not.toBeNull();
    expect(host.querySelector('.ff-score-panel')).not.toBeNull();
    expect(host.querySelector('.ff-section-accordion')).not.toBeNull();
    expect(text).toContain('Test Assessment');
    expect(text).toContain('88');
    expect(text).toContain('Braking Technique');
    expect(text).toContain('Bon niveau terrain.');
  });

  it('validates assessment through API facade', () => {
    fixture.componentInstance.validateResults();

    expect(bff.validateAssessment).toHaveBeenCalledWith(12);
  });

  it('rejects the candidate through API facade', () => {
    fixture.componentInstance.rejectCandidate();

    expect(bff.rejectAssessment).toHaveBeenCalledWith(12);
  });

  it('opens a section detail with answers, correct answers and comments', () => {
    const host = fixture.nativeElement as HTMLElement;
    const sectionButton = host.querySelector<HTMLButtonElement>('[data-testid="assessment-section-1"]');

    sectionButton?.click();
    fixture.detectChanges();

    const text = host.textContent ?? '';
    expect(sectionButton).not.toBeNull();
    expect(text).toContain('Reponses et commentaires');
    expect(text).toContain('Quelle distance faut-il garder ?');
    expect(text).toContain('Reponse candidat');
    expect(text).toContain('Deux secondes');
    expect(text).toContain('Bonne reponse');
    expect(text).toContain('Trois secondes');
    expect(text).toContain('Confusion sur la regle.');
    expect(text).toContain('6 / 10');
  });

  it('renders section details directly under the opened section and keeps global feedback after all sections', () => {
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('[data-testid="assessment-section-1"]')?.click();
    fixture.detectChanges();

    const firstSectionPanel = host.querySelector<HTMLElement>('[data-testid="assessment-section-panel-1"]');
    const firstSectionDetail = host.querySelector<HTMLElement>('[data-testid="assessment-section-detail-1"]');
    const secondSectionPanel = host.querySelector<HTMLElement>('[data-testid="assessment-section-panel-2"]');
    const globalFeedback = host.querySelector<HTMLElement>('[data-testid="assessment-global-feedback"]');

    expect(firstSectionPanel).not.toBeNull();
    expect(firstSectionDetail).not.toBeNull();
    expect(firstSectionPanel?.contains(firstSectionDetail)).toBeTrue();
    expect(secondSectionPanel?.compareDocumentPosition(globalFeedback as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(firstSectionDetail?.compareDocumentPosition(secondSectionPanel as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    host.querySelector<HTMLButtonElement>('[data-testid="assessment-section-2"]')?.click();
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="assessment-section-detail-1"]')).toBeNull();
    expect(host.querySelector('[data-testid="assessment-section-detail-2"]')).not.toBeNull();
  });

  it('closes the section detail when clicking the opened section again', () => {
    const host = fixture.nativeElement as HTMLElement;
    const sectionButton = host.querySelector<HTMLButtonElement>('[data-testid="assessment-section-1"]');

    sectionButton?.click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="assessment-section-detail-1"]')).not.toBeNull();

    sectionButton?.click();
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="assessment-section-detail-1"]')).toBeNull();
  });
});
